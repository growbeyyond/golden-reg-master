import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentVerificationRequest {
  orderId: string;
  paymentProofUrl?: string;
  transactionId?: string;
}

serve(async (req) => {
  console.log('Edge function started - verify-payment');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { orderId, paymentProofUrl, transactionId }: PaymentVerificationRequest = requestBody;

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log('Verifying payment for order:', orderId);

    // Use service role to update order and create ticket
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update order status to paid
    const { data: order, error: updateError } = await supabaseService
      .from("orders")
      .update({
        status: "paid",
        payment_proof_url: paymentProofUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Generate QR code for ticket
    const qrCode = `TICKET_${orderId}_${Date.now()}`;
    
    // Create ticket
    const { data: ticket, error: ticketError } = await supabaseService
      .from("tickets")
      .insert({
        order_id: orderId,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      throw new Error(`Failed to create ticket: ${ticketError.message}`);
    }

    // Update order with ticket QR code
    await supabaseService
      .from("orders")
      .update({
        ticket_qr_code: qrCode
      })
      .eq("id", orderId);

    console.log('Payment verified and ticket created:', ticket.id);

    // Send WhatsApp confirmation to team numbers (background task)
    const sendPaymentConfirmation = async () => {
      try {
        const teamNumbers = ["919948999001", "8886435551"];
        
        const confirmationMessage = `✅ *PAYMENT CONFIRMED* ✅

🎉 *Order Details:*
• Order ID: ${order.id}
• Name: ${order.full_name}
• Email: ${order.email}
• Phone: ${order.phone}
• Speciality: ${order.speciality}
• Hospital: ${order.hospital}
• City: ${order.city}

💰 *Payment Summary:*
• Tier: ${order.tier_label}
• Base Amount: ₹${Math.round(order.amount / 1.18).toLocaleString('en-IN')}
• GST (18%): ₹${Math.round(order.amount - (order.amount / 1.18)).toLocaleString('en-IN')}
• *Total Paid: ₹${order.amount.toLocaleString('en-IN')}*

🎟️ *Ticket Details:*
• Ticket ID: ${ticket.id}
• QR Code: ${qrCode}
• Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

✅ Registration completed successfully! 
Customer can now use their QR code for event entry.`;

        // Send to both team numbers
        for (const phoneNumber of teamNumbers) {
          await supabaseService.functions.invoke('send-whatsapp-notification', {
            body: {
              to: phoneNumber,
              message: confirmationMessage,
              type: 'team'
            }
          });
        }

        console.log('Payment confirmation sent to team numbers');
      } catch (error) {
        console.error('Error sending payment confirmation:', error);
      }
    };

    // Send confirmation in background
    sendPaymentConfirmation();

    return new Response(
      JSON.stringify({
        success: true,
        order: order,
        ticket: ticket,
        qrCode: qrCode
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-payment function:", error);
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