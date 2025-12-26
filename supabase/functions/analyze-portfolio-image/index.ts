import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PORTFOLIO_CATEGORIES = [
  "Bridal",
  "Party",
  "Editorial",
  "Natural",
  "Special FX",
  "Photoshoot",
  "General",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing portfolio image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in analyzing makeup and beauty portfolio images. 
Your task is to analyze the image and suggest:
1. The most appropriate category from: ${PORTFOLIO_CATEGORIES.join(", ")}
2. A short, descriptive title in English (max 5 words)
3. Whether this image would make a good featured/showcase image (true/false)

Respond ONLY with a valid JSON object in this exact format:
{
  "category": "Category Name",
  "title": "Short Title",
  "isFeatured": true/false,
  "reason": "Brief explanation in Arabic"
}

Category Guidelines:
- Bridal: Wedding makeup, bridal looks, white themes
- Party: Evening looks, glamorous, sparkles, bold colors
- Editorial: Artistic, high fashion, creative concepts
- Natural: Everyday looks, minimal makeup, fresh
- Special FX: Costume, fantasy, horror, theatrical
- Photoshoot: Studio lighting, professional shots
- General: Anything that doesn't fit other categories`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this makeup/beauty portfolio image and suggest the best category, title, and whether it should be featured."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in response:", data);
      return new Response(
        JSON.stringify({ error: "No analysis result" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response:", content);

    // Parse the JSON from the response
    let suggestion;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      // Return default suggestion
      suggestion = {
        category: "General",
        title: "Portfolio Image",
        isFeatured: false,
        reason: "تعذر تحليل الصورة بشكل كامل"
      };
    }

    // Validate category
    if (!PORTFOLIO_CATEGORIES.includes(suggestion.category)) {
      suggestion.category = "General";
    }

    return new Response(
      JSON.stringify(suggestion),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-portfolio-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
