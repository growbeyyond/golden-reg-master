import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  qrCode: string;
}

serve(async (req) => {
  console.log('Edge function started - scan-ticket');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { qrCode }: ScanRequest = requestBody;

    if (!qrCode) {
      throw new Error("QR code is required");
    }

    console.log('Scanning ticket:', qrCode);

    // Use service role to check and update ticket
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find ticket with QR code and join with order
    const { data: ticketData, error: ticketError } = await supabaseService
      .from("tickets")
      .select(`
        *,
        orders (
          id,
          full_name,
          email,
          phone,
          tier_label,
          status,
          is_checked_in,
          check_in_time
        )
      `)
      .eq("qr_code", qrCode)
      .single();

    if (ticketError || !ticketData) {
      console.error("Ticket not found:", ticketError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid ticket QR code"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const order = ticketData.orders;
    
    // Check if order is paid
    if (order.status !== "paid") {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Ticket payment not verified"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if already checked in
    if (order.is_checked_in) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Ticket already used",
          checkedInAt: order.check_in_time,
          attendee: {
            name: order.full_name,
            email: order.email,
            tier: order.tier_label
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Mark ticket as used and update check-in
    const now = new Date().toISOString();
    
    const { error: updateTicketError } = await supabaseService
      .from("tickets")
      .update({
        is_used: true,
        used_at: now
      })
      .eq("id", ticketData.id);

    const { error: updateOrderError } = await supabaseService
      .from("orders")
      .update({
        is_checked_in: true,
        check_in_time: now
      })
      .eq("id", order.id);

    if (updateTicketError || updateOrderError) {
      console.error("Error updating ticket/order:", updateTicketError || updateOrderError);
      throw new Error("Failed to check in ticket");
    }

    console.log('Ticket checked in successfully:', ticketData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Check-in successful!",
        attendee: {
          name: order.full_name,
          email: order.email,
          phone: order.phone,
          tier: order.tier_label
        },
        checkedInAt: now
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in scan-ticket function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
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