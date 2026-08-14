import { supabase } from "@/integrations/supabase/client";

type UploadOptions = {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
};

type StorageFunctionResult = {
  success: boolean;
  path?: string;
  publicUrl?: string | null;
  signedUrl?: string | null;
  error?: string;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const toBase64 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const invokeStorage = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke<StorageFunctionResult>(
    "secure-storage-object",
    { body },
  );
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? "storage_operation_failed");
  return data;
};

export const secureUpload = async ({ bucket, path, file, upsert = false }: UploadOptions) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalid_file_type");
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error("invalid_file_size");
  }

  return invokeStorage({
    operation: "upload",
    bucket,
    path,
    contentBase64: await toBase64(file),
    contentType: file.type,
    upsert,
  });
};

export const secureDelete = async (bucket: string, path: string) => {
  return invokeStorage({ operation: "delete", bucket, path });
};

export const secureSignedUrl = async (bucket: string, path: string) => {
  const result = await invokeStorage({ operation: "sign", bucket, path });
  if (!result.signedUrl) throw new Error("signed_url_unavailable");
  return result.signedUrl;
};

export const publicObjectUrl = (bucket: string, path: string) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
