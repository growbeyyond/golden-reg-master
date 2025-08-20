import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  amount: number;
  currency: string;
  formData: {
    fullName: string;
    email: string;
    phone: string;
    speciality: string;
    hospital: string;
    city: string;
    notes: string;
  };
  tierLabel: string;
}

serve(async (req) => {
  console.log('Edge function started - create-razorpay-order');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Get Razorpay credentials
    const razorpayKeyId = "YOUR_RAZORPAY_KEY_ID_HERE"; // Replace with your actual Key ID
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    console.log('Razorpay Key ID:', razorpayKeyId);
    console.log('Razorpay Secret exists:', !!razorpayKeySecret);
    
    if (!razorpayKeySecret) {
      console.error('Razorpay secret not configured');
      throw new Error("Razorpay secret not configured");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log('Supabase client created');

    // Get user from auth header (optional for guest checkout)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    if (authHeader) {
      console.log('Auth header found, getting user...');
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      console.log('User retrieved:', user?.id);
    } else {
      console.log('No auth header - guest checkout');
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { amount, currency, formData, tierLabel }: OrderRequest = requestBody;

    console.log('Parsed order data:', { amount, currency, tierLabel });

    // Create Razorpay order
    console.log('Creating Razorpay order...');
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          tier: tierLabel,
        },
      }),
    });

    console.log('Razorpay API response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay API error:", errorText);
      throw new Error(`Razorpay API error: ${razorpayResponse.status} - ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created:", razorpayOrder.id);

    // Save order to database using service role
    console.log('Saving order to database...');
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const orderData = {
      user_id: user?.id || null,
      razorpay_order_id: razorpayOrder.id,
      amount: amount,
      currency: currency,
      status: "created",
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      speciality: formData.speciality,
      hospital: formData.hospital,
      city: formData.city,
      notes: formData.notes,
      tier_label: tierLabel,
    };

    console.log('Inserting order data:', orderData);

    const { error: insertError } = await supabaseService.from("orders").insert(orderData);

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error(`Failed to save order to database: ${insertError.message}`);
    }

    console.log('Order saved to database successfully');

    const responseData = {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId,
    };

    console.log('Returning response:', responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-razorpay-order function:", error);
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