import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PhonePe API endpoints
const PHONEPE_BASE_URL = "https://api.phonepe.com/apis/hermes"; // Production
// const PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"; // Sandbox for testing

// Helper function to encode to base64
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PHONEPE_CLIENT_ID = Deno.env.get("PHONEPE_CLIENT_ID");
    const PHONEPE_CLIENT_SECRET = Deno.env.get("PHONEPE_CLIENT_SECRET");
    const PHONEPE_CLIENT_VERSION = Deno.env.get("PHONEPE_CLIENT_VERSION");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET || !PHONEPE_CLIENT_VERSION) {
      throw new Error("PhonePe credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, ...body } = await req.json();

    if (action === "initiate") {
      // Initiate payment
      const { userId, amount, billingCycle, planName, callbackUrl } = body;

      const merchantTransactionId = `REVONN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const merchantUserId = userId;

      // PhonePe Pay API payload
      const payloadData = {
        merchantId: PHONEPE_CLIENT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: merchantUserId,
        amount: amount * 100, // Amount in paise
        redirectUrl: callbackUrl || `${req.headers.get("origin")}/payment-status`,
        redirectMode: "REDIRECT",
        callbackUrl: `${SUPABASE_URL}/functions/v1/phonepe-payment`,
        mobileNumber: "", // Optional
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      const payloadBase64 = toBase64(JSON.stringify(payloadData));
      
      // Create checksum
      const checksumString = payloadBase64 + "/pg/v1/pay" + PHONEPE_CLIENT_SECRET;
      const encoder = new TextEncoder();
      const data = encoder.encode(checksumString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###" + PHONEPE_CLIENT_VERSION;

      // Call PhonePe API
      const phonepeResponse = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({
          request: payloadBase64
        }),
      });

      const phonepeData = await phonepeResponse.json();
      console.log("PhonePe response:", JSON.stringify(phonepeData));

      if (phonepeData.success && phonepeData.data?.instrumentResponse?.redirectInfo?.url) {
        return new Response(
          JSON.stringify({
            success: true,
            paymentUrl: phonepeData.data.instrumentResponse.redirectInfo.url,
            transactionId: merchantTransactionId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        throw new Error(phonepeData.message || "Failed to initiate payment");
      }
    } else if (action === "verify" || req.method === "POST") {
      // Verify payment status / Handle callback
      const { transactionId, userId, planType, billingCycle } = body;

      if (!transactionId) {
        // This is a callback from PhonePe
        const callbackData = body;
        console.log("PhonePe callback received:", JSON.stringify(callbackData));
        
        // Process callback - update subscription if payment successful
        if (callbackData.code === "PAYMENT_SUCCESS") {
          // Extract user info and update subscription
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Manual verification
      const checksumString = `/pg/v1/status/${PHONEPE_CLIENT_ID}/${transactionId}` + PHONEPE_CLIENT_SECRET;
      const encoder = new TextEncoder();
      const data = encoder.encode(checksumString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###" + PHONEPE_CLIENT_VERSION;

      const statusResponse = await fetch(
        `${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_CLIENT_ID}/${transactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": PHONEPE_CLIENT_ID,
          },
        }
      );

      const statusData = await statusResponse.json();
      console.log("Payment status:", JSON.stringify(statusData));

      if (statusData.success && statusData.code === "PAYMENT_SUCCESS") {
        // Update user subscription
        if (userId && planType && billingCycle) {
          const expiresAt = new Date();
          if (billingCycle === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }

          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              plan_type: planType,
              billing_cycle: billingCycle,
              is_active: true,
              ai_addon: true, // AI is included in Revonn Pro
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            paymentStatus: "SUCCESS",
            message: "Payment verified successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            paymentStatus: statusData.code || "FAILED",
            message: statusData.message || "Payment verification failed"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("PhonePe payment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
