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
  console.log('Edge function started - create-manual-order');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Make authentication optional for payment processing
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    if (authHeader) {
      console.log('Authentication header found, authenticating user...');
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (!authError && data.user) {
        user = data.user;
        console.log('User authenticated:', user.id);
      } else {
        console.log('Authentication failed, proceeding as guest');
      }
    } else {
      console.log('No authentication header, proceeding as guest');
    }

    const requestBody = await req.json();
    const { amount, currency, formData, tierLabel }: OrderRequest = requestBody;

    // Input validation
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }
    if (!currency || !['INR', 'USD'].includes(currency)) {
      throw new Error("Invalid currency");
    }
    if (!formData?.email || !formData.email.includes('@')) {
      throw new Error("Invalid email");
    }
    if (!formData?.phone || formData.phone.length < 10) {
      throw new Error("Invalid phone number");
    }
    if (!formData?.fullName || formData.fullName.length < 2) {
      throw new Error("Invalid name");
    }

    console.log('Order validated for user:', user?.id || 'guest');

    // Create order using service role
    console.log('Creating manual order...');
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate a unique order ID for reference
    const orderId = `MO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const orderData = {
      user_id: user?.id || null,
      amount: amount,
      currency: currency,
      status: "pending_payment",
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      speciality: formData.speciality,
      hospital: formData.hospital,
      city: formData.city,
      notes: formData.notes,
      tier_label: tierLabel,
      payment_method: "upi",
    };

    console.log('Creating order for user:', user?.id || 'guest');

    const { data: order, error: insertError } = await supabaseService
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error(`Failed to save order to database: ${insertError.message}`);
    }

    console.log('Order created successfully:', order.id);

    // Return payment instructions
    const responseData = {
      orderId: order.id,
      orderNumber: orderId,
      amount: amount,
      currency: currency,
      paymentInstructions: {
        upiId: "istadigitalmedia@okaxis",
        qrCode: `upi://pay?pa=istadigitalmedia@okaxis&am=${amount}&cu=${currency}&tn=ISTA Event Registration - ${tierLabel}`,
        bankDetails: {
          accountName: "ISTA Digital Media",
          accountNumber: "2345678901",
          ifsc: "OKAX0001234", 
          bank: "Okaxis Bank"
        }
      }
    };

    console.log('Returning response with payment instructions');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-manual-order function:", error);
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