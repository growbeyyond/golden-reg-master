import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('=== RAZORPAY ORDER CREATION START ===');
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    // Enhanced credential checking with detailed logging
    console.log('=== CREDENTIAL CHECK ===');
    console.log('SUPABASE_URL exists:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    console.log('RAZORPAY_KEY_ID exists:', !!razorpayKeyId);
    console.log('RAZORPAY_KEY_SECRET exists:', !!razorpayKeySecret);
    
    if (razorpayKeyId) {
      console.log('RAZORPAY_KEY_ID length:', razorpayKeyId.length);
      console.log('RAZORPAY_KEY_ID starts with:', razorpayKeyId.substring(0, 4));
    }
    
    if (razorpayKeySecret) {
      console.log('RAZORPAY_KEY_SECRET length:', razorpayKeySecret.length);
    }
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials - KeyId:', !!razorpayKeyId, 'KeySecret:', !!razorpayKeySecret);
      return new Response(
        JSON.stringify({ 
          error: "Payment system is currently unavailable. Please contact support or try again later.",
          code: "PAYMENT_UNAVAILABLE" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log('Razorpay credentials found successfully');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestBody = await req.json();
    const { baseAmount, currency, formData, tierLabel }: RazorpayOrderRequest = requestBody;

    // Calculate GST and total amount
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    
    console.log('Creating Razorpay order:', { baseAmount, gstAmount, totalAmount });

    // Input validation
    if (!baseAmount || baseAmount <= 0) {
      throw new Error("Invalid amount");
    }
    if (!currency || !['INR', 'USD'].includes(currency)) {
      throw new Error("Invalid currency");
    }
    if (!formData?.email || !formData.email.includes('@')) {
      throw new Error("Invalid email");
    }

    // Generate unique order ID
    const orderNumber = `RZP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create Razorpay order
    const razorpayOrderData = {
      amount: totalAmount * 100, // Convert to paise
      currency: currency,
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
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created:', razorpayOrder);

    // Create order in our database
    const orderData = {
      amount: totalAmount,
      currency: currency,
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
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Database error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    // Store Razorpay order mapping
    const { error: razorpayError } = await supabase
      .from("razorpay_orders")
      .insert({
        razorpay_order_id: razorpayOrder.id,
        manual_order_id: order.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        status: razorpayOrder.status
      });

    if (razorpayError) {
      console.error("Razorpay order mapping error:", razorpayError);
    }

    const responseData = {
      orderId: order.id,
      orderNumber: orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      baseAmount: baseAmount,
      gstAmount: gstAmount,
      currency: currency,
      key: razorpayKeyId,
      name: "ISTA Media",
      description: `${tierLabel} Registration`,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});