import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHash, createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestBody = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: PaymentVerificationRequest = requestBody;

    console.log('Verifying Razorpay payment:', { razorpay_order_id, razorpay_payment_id });

    // Verify signature
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Find the order
    const { data: razorpayOrder, error: razorpayOrderError } = await supabase
      .from("razorpay_orders")
      .select(`
        *,
        orders:manual_order_id (*)
      `)
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (razorpayOrderError || !razorpayOrder) {
      throw new Error('Order not found');
    }

    const order = razorpayOrder.orders;

    // Update order status to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        status: "paid",
        payment_proof_url: `razorpay_payment_${razorpay_payment_id}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Update Razorpay order status
    await supabase
      .from("razorpay_orders")
      .update({ status: "paid" })
      .eq("razorpay_order_id", razorpay_order_id);

    // Generate QR code for ticket
    const qrCode = `ISTA-${order.id}-${Date.now()}`;
    
    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        order_id: order.id,
        qr_code: qrCode,
        is_used: false
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Failed to create ticket:', ticketError);
    }

    // Update order with QR code
    if (ticket) {
      await supabase
        .from("orders")
        .update({ ticket_qr_code: qrCode })
        .eq("id", order.id);
    }

    // Send WhatsApp notification
    const whatsappMessage = `🎉 *PAYMENT CONFIRMED!*

📋 *Order Details:*
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
• Payment ID: ${razorpay_payment_id}

🎟️ *Ticket Details:*
• Ticket ID: ${ticket?.id || 'N/A'}
• QR Code: ${qrCode}
• Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

✅ Registration completed successfully! 
Customer can now use their QR code for event entry.`;

    // Send notification (fire and forget)
    supabase.functions.invoke('send-whatsapp-notification', {
      body: { message: whatsappMessage }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      ticketId: ticket?.id,
      qrCode: qrCode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});