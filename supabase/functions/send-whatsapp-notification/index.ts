
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'customer' | 'team';
}

serve(async (req) => {
  console.log('WhatsApp notification function started');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type }: WhatsAppMessage = await req.json();
    
    // Example implementation for WhatsApp Business Cloud API
    // You'll need to replace with your preferred WhatsApp service
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    
    if (!whatsappToken || !whatsappPhoneId) {
      console.log('WhatsApp credentials not configured, skipping notification');
      return new Response(
        JSON.stringify({ message: "WhatsApp not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Send WhatsApp message using Facebook Graph API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message }
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error("WhatsApp API error:", errorData);
      throw new Error(`WhatsApp API error: ${whatsappResponse.status}`);
    }

    const result = await whatsappResponse.json();
    console.log('WhatsApp message sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.messages[0].id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in WhatsApp notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
