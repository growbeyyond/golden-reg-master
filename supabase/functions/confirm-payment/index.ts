
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmation {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

serve(async (req) => {
  console.log('Payment confirmation function started');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: PaymentConfirmation = await req.json();
    
    console.log('Confirming payment for order:', razorpay_order_id);
    
    // Verify signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const expectedSignature = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ).then(key => 
      crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)
      )
    ).then(signature => 
      Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid signature');
      throw new Error("Invalid payment signature");
    }

    console.log('Payment signature verified successfully');

    // Update order in database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: order, error: fetchError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchError || !order) {
      console.error('Order not found:', fetchError);
      throw new Error("Order not found");
    }

    const { error: updateError } = await supabaseService
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error("Failed to update order status");
    }

    console.log('Order status updated to paid');

    // Send email notifications
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Generate invoice HTML
      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt - ISTA Media</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1a365d; }
            .invoice-details { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total { font-weight: bold; background-color: #f0f9ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ISTA Media</div>
            <h2>Payment Receipt</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Receipt #:</strong> ${razorpay_payment_id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Customer:</strong> ${order.full_name}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Tier</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Event Registration</td>
                <td>${order.tier_label || 'Standard'}</td>
                <td>${order.currency} ${order.amount}</td>
              </tr>
              <tr class="total">
                <td colspan="2"><strong>Total Paid</strong></td>
                <td><strong>${order.currency} ${order.amount}</strong></td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
            <h3>Event Details</h3>
            <p><strong>Specialty:</strong> ${order.speciality || 'Not specified'}</p>
            <p><strong>Hospital:</strong> ${order.hospital || 'Not specified'}</p>
            <p><strong>City:</strong> ${order.city || 'Not specified'}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>

          <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Thank you for your registration!</p>
            <p>For any queries, contact us at contact@istamedia.com</p>
          </div>
        </body>
        </html>
      `;

      // Send email to customer
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: [order.email],
          subject: "Payment Confirmation - ISTA Media Event Registration",
          html: invoiceHtml,
        });
        console.log('Customer email sent successfully');
      } catch (emailError) {
        console.error('Failed to send customer email:', emailError);
      }

      // Send notification email to team
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: ["admin@yourdomain.com"],
          subject: `New Registration Payment Received - ${order.full_name}`,
          html: `
            <h2>New Payment Received</h2>
            <p><strong>Customer:</strong> ${order.full_name}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Amount:</strong> ${order.currency} ${order.amount}</p>
            <p><strong>Tier:</strong> ${order.tier_label || 'Standard'}</p>
            <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
            <p><strong>Specialty:</strong> ${order.speciality || 'Not specified'}</p>
            <p><strong>Hospital:</strong> ${order.hospital || 'Not specified'}</p>
            <p><strong>City:</strong> ${order.city || 'Not specified'}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          `,
        });
        console.log('Team notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send team notification email:', emailError);
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email notifications');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment confirmed successfully",
        order: order
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in confirm-payment function:", error);
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
