import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface RazorpayOrderRequest {
  baseAmount: number;
  currency: string;
  formData: {
    fullName: string;
    email: string;
    phone: string;
    speciality: string;
    hospital: string;
    city: string;
    notes?: string;
  };
  tierLabel: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    console.log("Checking Razorpay credentials...");
    console.log("RAZORPAY_KEY_ID exists:", !!razorpayKeyId);
    console.log("RAZORPAY_KEY_SECRET exists:", !!razorpayKeySecret);
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not found in environment' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { baseAmount, currency, formData, tierLabel }: RazorpayOrderRequest = await req.json();

    // Validate input
    if (!baseAmount || baseAmount <= 0) {
      throw new Error("Invalid amount");
    }
    if (!formData?.email || !formData?.fullName) {
      throw new Error("Missing required customer details");
    }

    // Calculate total amount with GST
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    
    // Generate order number
    const orderNumber = `RZP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log(`Creating Razorpay order: ${orderNumber}, Amount: ${totalAmount}`);

    // Create Razorpay order
    const razorpayOrderData = {
      amount: totalAmount * 100, // Convert to paise
      currency: currency || "INR",
      receipt: orderNumber,
      notes: {
        customer_name: formData.fullName,
        customer_email: formData.email,
        tier: tierLabel,
      }
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayOrderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error(`Razorpay order creation failed: ${razorpayResponse.status}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created:', razorpayOrder.id);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        amount: totalAmount,
        currency: currency || "INR",
        status: "pending_payment",
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        speciality: formData.speciality,
        hospital: formData.hospital,
        city: formData.city,
        notes: formData.notes || "",
        tier_label: tierLabel,
        payment_method: "razorpay"
      })
      .select()
      .single();

    if (orderError) {
      console.error("Database order error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    // Store Razorpay mapping
    await supabase.from("razorpay_orders").insert({
      razorpay_order_id: razorpayOrder.id,
      manual_order_id: order.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status
    });

    // Return success response
    const responseData = {
      orderId: order.id,
      orderNumber: orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      baseAmount: baseAmount,
      gstAmount: gstAmount,
      currency: currency || "INR",
      key: razorpayKeyId,
      name: "ISTA Digital Media Anniversary Edition 2025",
      description: `${tierLabel} Registration`,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      }
    };

    console.log('Order created successfully:', order.id);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating order:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});