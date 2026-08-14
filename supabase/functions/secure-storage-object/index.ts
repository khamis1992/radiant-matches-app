import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PUBLIC_BUCKETS = new Set(["avatars", "banners", "portfolio"]);
const IMAGE_MIME_PREFIX = "image/";

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getPublishableKey = () =>
  JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}") ["default"] ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

const getSecretKey = () =>
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") ["default"] ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const isSafePath = (path: string) =>
  path.length > 0 &&
  path.length <= 512 &&
  !path.startsWith("/") &&
  !path.includes("..") &&
  !path.includes("\\") &&
  path.split("/").every(Boolean);

const decodeBase64 = (value: string) => {
  const raw = value.replace(/^data:[^;]+;base64,/, "");
  const binary = atob(raw);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("invalid_file_size");
  }
  return bytes;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "unauthorized" });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, getSecretKey());
  const userClient = createClient(url, getPublishableKey(), {
    global: { headers: { Authorization: authorization } },
  });

  const { data: claims, error: claimsError } = await userClient.auth.getClaims(
    authorization.replace("Bearer ", ""),
  );
  const userId = claims?.claims?.sub;
  if (claimsError || typeof userId !== "string") {
    return json(401, { error: "unauthorized" });
  }

  let body: {
    operation?: string;
    bucket?: string;
    path?: string;
    contentBase64?: string;
    contentType?: string;
    upsert?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_request" });
  }

  const operation = body.operation;
  const bucket = body.bucket;
  const path = body.path;
  if ((operation !== "upload" && operation !== "delete" && operation !== "sign") || typeof bucket !== "string" || typeof path !== "string" || !isSafePath(path)) {
    return json(400, { error: "invalid_request" });
  }

  const { data: roleRows } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  const isAdmin = Boolean(roleRows?.length);

  if (operation === "sign") {
    if (bucket !== "chat-attachments") return json(400, { error: "unsupported_signed_bucket" });
    const { data: visibleMessages, error: visibilityError } = await userClient
      .from("messages")
      .select("id")
      .eq("image_url", path)
      .limit(1);
    if (visibilityError || !visibleMessages?.length) return json(403, { error: "forbidden" });
    const { data: signedData, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);
    if (signedError || !signedData?.signedUrl) return json(500, { error: "sign_failed" });
    return json(200, { success: true, path, signedUrl: signedData.signedUrl });
  }

  const pathOwner = path.split("/")[0];

  let allowed = false;
  if (bucket === "avatars" || bucket === "chat-attachments" || bucket === "review-photos") {
    allowed = pathOwner === userId || isAdmin;
  } else if (bucket === "portfolio") {
    if (isAdmin) {
      allowed = true;
    } else {
      const { data: artist } = await admin
        .from("artists")
        .select("id")
        .eq("id", pathOwner)
        .eq("user_id", userId)
        .maybeSingle();
      allowed = Boolean(artist);
    }
  } else if (bucket === "banners") {
    allowed = isAdmin;
  }

  if (!allowed) {
    return json(403, { error: "forbidden" });
  }

  if (operation === "delete") {
    const { error } = await admin.storage.from(bucket).remove([path]);
    if (error) return json(500, { error: "delete_failed" });
    return json(200, { success: true });
  }

  if (typeof body.contentBase64 !== "string" || typeof body.contentType !== "string" || !body.contentType.startsWith(IMAGE_MIME_PREFIX)) {
    return json(400, { error: "invalid_file" });
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(body.contentBase64);
  } catch {
    return json(413, { error: "invalid_file_size" });
  }

  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: body.contentType,
    upsert: body.upsert === true,
  });
  if (error) return json(500, { error: "upload_failed" });

  const publicUrl = PUBLIC_BUCKETS.has(bucket)
    ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : null;
  return json(200, { success: true, path, publicUrl });
});
