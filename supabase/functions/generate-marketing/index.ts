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
    const { template, shopName, posterText, festival, discount, language, theme } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isHindi = language === 'hindi';
    const themeDescription = theme === 'elegant' ? 'elegant and sophisticated' 
      : theme === 'festive' ? 'colorful and festive' 
      : theme === 'modern' ? 'modern and minimalist'
      : 'vibrant and eye-catching';

    // Generate caption based on template
    let captionPrompt = '';
    if (template === 'sale') {
      captionPrompt = isHindi 
        ? `एक आकर्षक सोशल मीडिया कैप्शन बनाएं "${shopName}" दुकान की ${discount}% छूट के लिए। इमोजी, हैशटैग और कॉल टू एक्शन शामिल करें। हिंदी में देवनागरी लिपि में लिखें। 100 शब्दों से कम में।`
        : `Create a catchy social media caption for a ${discount}% OFF sale at "${shopName}". Include emojis, hashtags, and a call to action. Write in English. Under 100 words.`;
    } else if (template === 'festival') {
      captionPrompt = isHindi
        ? `"${shopName}" दुकान के लिए ${festival} त्योहार की शुभकामनाओं के साथ एक आकर्षक सोशल मीडिया कैप्शन बनाएं। त्योहार की शुभकामनाएं, विशेष ऑफर, इमोजी और हैशटैग शामिल करें। हिंदी में देवनागरी लिपि में लिखें। 100 शब्दों से कम में।`
        : `Create a festive social media caption for ${festival} celebration offer at "${shopName}". Include festival greetings, special offers, emojis, hashtags. Write in English. Under 100 words.`;
    } else if (template === 'new-arrival') {
      captionPrompt = isHindi
        ? `"${shopName}" दुकान में नए आगमन की घोषणा के लिए एक उत्साहजनक सोशल मीडिया कैप्शन बनाएं। इमोजी, हैशटैग और तत्काल खरीदने की अपील शामिल करें। हिंदी में देवनागरी लिपि में लिखें। 100 शब्दों से कम में।`
        : `Create an exciting social media caption announcing new arrivals at "${shopName}". Include emojis, hashtags, and urgency to visit. Write in English. Under 100 words.`;
    } else {
      captionPrompt = isHindi
        ? `"${shopName}" दुकान के लिए "${posterText || 'विशेष ऑफर'}" के बारे में एक प्रमोशनल सोशल मीडिया कैप्शन बनाएं। इमोजी और हैशटैग शामिल करें। हिंदी में देवनागरी लिपि में लिखें। 100 शब्दों से कम में।`
        : `Create a promotional social media caption for "${shopName}" about: ${posterText || 'special offers'}. Include emojis and hashtags. Write in English. Under 100 words.`;
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
            content: `You are a social media marketing expert for Indian retail businesses. Create engaging, short captions (max 100 words) with emojis and relevant hashtags. 
Be creative, persuasive, and culturally relevant for Indian audience.
${isHindi ? 'Always respond in Hindi using Devanagari script.' : 'Respond in English.'}
Include:
- Catchy opening line
- Key offer/message
- Call to action
- 3-5 relevant hashtags
- Appropriate emojis`
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
      (isHindi 
        ? `🎉 ${shopName} पर विशेष ऑफर! ${discount ? `${discount}% की छूट` : 'शानदार डील्स'} - अभी विजिट करें! #Shopping #Deals`
        : `🎉 Special offer at ${shopName}! ${discount ? `${discount}% OFF` : 'Amazing deals'} - Visit now! #Shopping #Deals`);

    // Generate image using AI
    let imageUrl = null;
    try {
      let imagePrompt = '';
      
      if (template === 'sale') {
        imagePrompt = `Professional retail sale poster design:
- Bold "${discount}% OFF" text prominently displayed
- ${themeDescription} color scheme
- Modern and clean layout
- Shopping/retail theme with bags or products
- No additional text or watermarks
- Square format 1080x1080
- High contrast and readable
- Professional marketing quality`;
      } else if (template === 'festival') {
        imagePrompt = `Beautiful ${festival} festival celebration poster:
- Traditional Indian festive decorations (diyas, rangoli, flowers)
- ${themeDescription} colors matching ${festival}
- Elegant and celebratory design
- Cultural elements authentic to ${festival}
- No text needed
- Square format 1080x1080
- Premium quality festive design`;
      } else if (template === 'new-arrival') {
        imagePrompt = `Modern new arrivals announcement poster:
- Fresh and exciting design with "NEW" theme
- Shopping bags, gift boxes, or fashion items
- ${themeDescription} color palette
- Clean and premium look
- Retail store atmosphere
- Square format 1080x1080
- Professional marketing quality`;
      } else {
        imagePrompt = `Professional retail promotional poster:
- ${themeDescription} design style
- Modern and clean layout
- Shopping/retail theme
- ${posterText || 'special offer'} concept
- Square format 1080x1080
- High quality marketing poster`;
      }

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
