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
  console.log('=== EDGE FUNCTION STARTED ===');
  console.log('Method:', req.method);
  
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('=== INITIALIZING ===');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SERVICE_KEY exists:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('Razorpay credentials loaded from environment');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('=== PARSING REQUEST ===');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
      console.log('Request data:', JSON.stringify(requestBody, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error("Invalid request body");
    }

    const { baseAmount, currency, formData, tierLabel }: RazorpayOrderRequest = requestBody;

    console.log('=== VALIDATION ===');
    console.log('Base amount:', baseAmount);
    console.log('Currency:', currency);
    console.log('Tier label:', tierLabel);
    console.log('Form data keys:', Object.keys(formData || {}));

    // Input validation
    if (!baseAmount || baseAmount <= 0) {
      throw new Error("Invalid amount: " + baseAmount);
    }
    if (!currency || !['INR', 'USD'].includes(currency)) {
      throw new Error("Invalid currency: " + currency);
    }
    if (!formData?.email || !formData.email.includes('@')) {
      throw new Error("Invalid email: " + formData?.email);
    }
    if (!formData?.fullName) {
      throw new Error("Missing full name");
    }

    console.log('Validation passed');

    // Calculate GST and total amount
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    
    console.log('=== AMOUNT CALCULATION ===');
    console.log('Base:', baseAmount, 'GST:', gstAmount, 'Total:', totalAmount);

    // Generate unique order ID
    const orderNumber = `RZP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log('Generated order number:', orderNumber);

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

    console.log('=== CREATING RAZORPAY ORDER ===');
    console.log('Razorpay order data:', JSON.stringify(razorpayOrderData, null, 2));

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(razorpayOrderData),
    });

    console.log('Razorpay API response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error response:', errorText);
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created successfully:', razorpayOrder);

    // Create order in our database
    console.log('=== CREATING DATABASE ORDER ===');
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

    console.log('Order data for database:', JSON.stringify(orderData, null, 2));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Database order error:", orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    console.log('Database order created:', order);

    // Store Razorpay order mapping
    console.log('=== CREATING RAZORPAY MAPPING ===');
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
      // Don't fail the entire request for this
    } else {
      console.log('Razorpay mapping created successfully');
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

    console.log('=== SUCCESS ===');
    console.log('Returning response data:', JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        function: "create-razorpay-order"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});