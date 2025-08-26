import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Restricted CORS headers for security
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vnccezzqcohvgzkwojqz.supabase.co",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to check if user has required role
async function hasStaffRole(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });
  
  if (error) {
    const { data: moderatorData, error: modError } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'moderator'
    });
    
    if (modError) {
      console.error('Error checking roles:', error, modError);
      return false;
    }
    
    return moderatorData === true;
  }
  
  return data === true;
}

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

    // Get authorization header and check if user is staff
    const authHeader = req.headers.get('Authorization');
    let isStaffUser = false;

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
      
      if (!userError && userData.user) {
        isStaffUser = await hasStaffRole(supabaseService, userData.user.id);
      }
    }

    // If not a staff user, only update to pending_verification
    if (!isStaffUser) {
      console.log('Non-staff verification request - updating to pending_verification');
      
      const { data: updateData, error: updateError } = await supabaseService
        .from('orders')
        .update({ 
          status: 'pending_verification',
          payment_proof_url: paymentProofUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating order to pending_verification:', updateError);
        throw new Error(`Failed to update order status: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment submitted for verification',
          order: updateData,
          status: 'pending_verification'
        }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Staff user verification - proceeding with full payment processing');

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