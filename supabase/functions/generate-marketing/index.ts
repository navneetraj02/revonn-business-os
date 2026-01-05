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
    const { userPrompt, shopName, language } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isHindi = language === 'hindi';

    // Generate caption based on user's exact prompt
    const captionSystemPrompt = isHindi 
      ? `आप एक भारतीय रिटेल बिज़नेस के लिए सोशल मीडिया मार्केटिंग एक्सपर्ट हैं। 
उपयोगकर्ता की मांग के अनुसार एक आकर्षक सोशल मीडिया कैप्शन बनाएं।
दुकान का नाम: ${shopName}

नियम:
- 100 शब्दों से कम में लिखें
- इमोजी और हैशटैग शामिल करें
- कॉल टू एक्शन दें
- हिंदी में देवनागरी लिपि में लिखें
- भारतीय ग्राहकों के लिए प्रासंगिक बनाएं`
      : `You are a social media marketing expert for Indian retail businesses.
Create an engaging social media caption based on the user's exact requirement.
Shop name: ${shopName}

Rules:
- Keep under 100 words
- Include emojis and hashtags
- Add call to action
- Write in English
- Make it relevant for Indian customers`;

    const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: captionSystemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!captionResponse.ok) {
      console.error("Caption generation error:", await captionResponse.text());
      throw new Error("Failed to generate caption");
    }

    const captionData = await captionResponse.json();
    const caption = captionData.choices?.[0]?.message?.content || 
      (isHindi 
        ? `🎉 ${shopName} पर विशेष ऑफर! अभी विजिट करें! #Shopping #Deals`
        : `🎉 Special offer at ${shopName}! Visit now! #Shopping #Deals`);

    // Generate image based on user's exact prompt
    let imageUrl = null;
    try {
      const imagePrompt = `Professional retail marketing poster for Indian business:
Based on this requirement: "${userPrompt}"
Shop: ${shopName}

Design requirements:
- Professional and eye-catching design
- Vibrant colors suitable for Indian market
- Clean and modern layout
- No watermarks
- Square format 1080x1080
- High quality marketing poster
- Include relevant visual elements based on the requirement`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            { role: "user", content: imagePrompt }
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
      } else {
        console.error("Image generation failed:", await imageResponse.text());
      }
    } catch (imageError) {
      console.error("Image generation error:", imageError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        caption: caption,
        image: imageUrl,
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
