import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    console.log('Testing credentials...');
    console.log('RAZORPAY_KEY_ID exists:', !!razorpayKeyId);
    console.log('RAZORPAY_KEY_SECRET exists:', !!razorpayKeySecret);
    
    if (razorpayKeyId) {
      console.log('RAZORPAY_KEY_ID length:', razorpayKeyId.length);
      console.log('RAZORPAY_KEY_ID prefix:', razorpayKeyId.substring(0, 8) + '...');
    }
    
    return new Response(JSON.stringify({
      razorpay_key_id_exists: !!razorpayKeyId,
      razorpay_key_secret_exists: !!razorpayKeySecret,
      razorpay_key_id_length: razorpayKeyId?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Test error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});