import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  baseAmount: number; // Changed from 'amount' to 'baseAmount'
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
    const { baseAmount, currency, formData, tierLabel }: OrderRequest = requestBody;

    console.log('Received order request:', { baseAmount, currency, formData, tierLabel });
    
    // Calculate GST and total amount on server
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    
    console.log('Amount calculation:', { baseAmount, gstAmount, totalAmount });

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
      amount: totalAmount, // Store total amount including GST
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

    // Send WhatsApp notifications to team numbers (background task)
    const sendWhatsAppNotifications = async () => {
      try {
        const teamNumbers = ["919948999001", "8886435551"]; // Add your 2 team numbers
        
        const orderMessage = `🏥 *NEW EVENT REGISTRATION* 🏥

📝 *Order Details:*
• Order ID: ${order.id}
• Name: ${formData.fullName}
• Email: ${formData.email}
• Phone: ${formData.phone}
• Speciality: ${formData.speciality}
• Hospital: ${formData.hospital}
• City: ${formData.city}

💰 *Payment Details:*
• Tier: ${tierLabel}
• Base Amount: ₹${baseAmount.toLocaleString('en-IN')}
• GST (18%): ₹${gstAmount.toLocaleString('en-IN')}
• *Total Amount: ₹${totalAmount.toLocaleString('en-IN')}*
• Currency: ${currency}
• Status: Pending Payment

📅 *Registration Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

Please verify the payment and update the order status accordingly.`;

        // Send to both team numbers
        for (const phoneNumber of teamNumbers) {
          await supabaseService.functions.invoke('send-whatsapp-notification', {
            body: {
              to: phoneNumber,
              message: orderMessage,
              type: 'team'
            }
          });
        }

        console.log('WhatsApp notifications sent to team numbers');
      } catch (error) {
        console.error('Error sending WhatsApp notifications:', error);
        // Don't throw error as this is background task
      }
    };

    // Send notifications in background (don't wait for completion)
    sendWhatsAppNotifications();

    // Return payment instructions
    const responseData = {
      orderId: order.id,
      orderNumber: orderId,
      totalAmount: totalAmount, // Total amount including GST
      baseAmount: baseAmount, // Base amount without GST
      gstAmount: gstAmount, // GST amount
      currency: currency,
      paymentInstructions: {
        upiId: "istadigitalmedia@okaxis",
        qrCode: `upi://pay?pa=istadigitalmedia@okaxis&am=${totalAmount}&cu=${currency}&tn=ISTA Event Registration - ${tierLabel}`,
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