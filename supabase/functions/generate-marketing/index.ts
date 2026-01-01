import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, shopName, posterText, festival, discount, language } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isHindi = language === 'hindi';

    // Generate caption based on template
    let captionPrompt = '';
    if (template === 'sale') {
      captionPrompt = `Create a catchy social media caption for a ${discount}% OFF sale at "${shopName}". Include emojis, hashtags, and a call to action. ${isHindi ? 'Write in Hindi using Devanagari script.' : 'Write in English.'}`;
    } else if (template === 'festival') {
      captionPrompt = `Create a festive social media caption for ${festival} celebration offer at "${shopName}". Include festival greetings, emojis, hashtags. ${isHindi ? 'Write in Hindi using Devanagari script.' : 'Write in English.'}`;
    } else if (template === 'new-arrival') {
      captionPrompt = `Create an exciting social media caption announcing new arrivals at "${shopName}". Include emojis, hashtags, and urgency. ${isHindi ? 'Write in Hindi using Devanagari script.' : 'Write in English.'}`;
    } else {
      captionPrompt = `Create a promotional social media caption for "${shopName}" about: ${posterText || 'special offers'}. Include emojis and hashtags. ${isHindi ? 'Write in Hindi using Devanagari script.' : 'Write in English.'}`;
    }

    // Generate caption using AI
    const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a social media marketing expert for Indian retail businesses. Create engaging, short captions (max 150 words) with emojis and relevant hashtags. Be creative and persuasive."
          },
          { role: "user", content: captionPrompt }
        ],
      }),
    });

    if (!captionResponse.ok) {
      console.error("Caption generation error:", await captionResponse.text());
      throw new Error("Failed to generate caption");
    }

    const captionData = await captionResponse.json();
    const caption = captionData.choices?.[0]?.message?.content || 
      `🎉 Special offer at ${shopName}! ${discount ? `${discount}% OFF` : 'Amazing deals'} - Visit now! #Shopping #Deals`;

    // Generate image using AI
    let imageUrl = null;
    try {
      const imagePrompt = template === 'sale' 
        ? `Professional retail sale poster, bold "${discount}% OFF" text, modern design, vibrant colors, shopping theme, clean layout, no text other than discount`
        : template === 'festival'
        ? `Beautiful ${festival} festival celebration poster, traditional Indian decorations, festive colors, elegant design, celebration theme`
        : template === 'new-arrival'
        ? `Modern new arrivals announcement poster, shopping bags, fresh and exciting design, retail store theme, premium look`
        : `Professional retail promotional poster, modern design, shopping theme, ${posterText || 'special offer'}`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            { role: "user", content: `Generate a professional marketing poster: ${imagePrompt}. Make it visually appealing for social media. Square format, 1080x1080 pixels ideal.` }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const images = imageData.choices?.[0]?.message?.images;
        if (images && images.length > 0) {
          imageUrl = images[0].image_url?.url;
        }
      }
    } catch (imageError) {
      console.error("Image generation error:", imageError);
      // Continue without image
    }

    return new Response(
      JSON.stringify({
        success: true,
        caption: caption,
        image: imageUrl,
        template: template
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Marketing generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        caption: null,
        image: null
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
