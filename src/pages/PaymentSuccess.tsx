
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { openWhatsAppWithMessage, getWhatsAppUrl, getWhatsAppNumber } from '@/lib/whatsapp';

interface Order {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  tier_label: string;
  speciality: string;
  hospital: string;
  city: string;
  notes: string;
  razorpay_payment_id: string;
  status: string;
  created_at: string;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      const razorpay_payment_id = searchParams.get("razorpay_payment_id");
      const razorpay_order_id = searchParams.get("razorpay_order_id");
      const razorpay_signature = searchParams.get("razorpay_signature");

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        toast.error("Invalid payment parameters");
        navigate("/");
        return;
      }

      setConfirming(true);

      try {
        // Confirm payment with backend
        const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
          body: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          },
        });

        if (error) {
          console.error("Payment confirmation error:", error);
          toast.error("Failed to confirm payment");
          return;
        }

        setOrder(data);
        toast.success("Payment confirmed successfully!");
        
      } catch (error) {
        console.error("Error confirming payment:", error);
        toast.error("Failed to confirm payment");
      } finally {
        setConfirming(false);
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  const downloadInvoice = () => {
    if (!order) return;

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ISTA Media</title>
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
          <p><strong>Receipt #:</strong> ${order.razorpay_payment_id}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
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

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISTA-Media-Invoice-${order.razorpay_payment_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Invoice downloaded successfully!");
  };

  const sharePaymentConfirmation = () => {
    if (!order) return;
    
    const message = `🎉 Great news! My payment has been successfully processed for ISTA Media event registration.

Payment Confirmation:
💳 Payment ID: ${order.razorpay_payment_id}
🎟️ Registration: ${order.tier_label || 'Standard'} Tier  
💰 Amount: ${order.currency} ${order.amount}

Personal Details:
👤 Name: ${order.full_name}
📧 Email: ${order.email}
📱 Phone: ${order.phone}

Thank you for confirming my registration! Looking forward to the event.`;

    openWhatsAppWithMessage(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">Payment could not be verified</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <p className="text-gray-600">Your registration has been confirmed</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="font-mono text-sm">{order.razorpay_payment_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                  <p className="text-lg font-semibold">{order.currency} {order.amount}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Registration Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {order.full_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {order.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {order.phone}
                  </div>
                  <div>
                    <span className="font-medium">Tier:</span> {order.tier_label || 'Standard'}
                  </div>
                  {order.speciality && (
                    <div>
                      <span className="font-medium">Specialty:</span> {order.speciality}
                    </div>
                  )}
                  {order.hospital && (
                    <div>
                      <span className="font-medium">Hospital:</span> {order.hospital}
                    </div>
                  )}
                  {order.city && (
                    <div>
                      <span className="font-medium">City:</span> {order.city}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={sharePaymentConfirmation}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Share confirmation via WhatsApp
          </Button>
          <Button 
            onClick={downloadInvoice}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            Download Invoice
          </Button>
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
          >
            Return to Home
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>A confirmation email has been sent to {order.email}</p>
          <p>For any queries, contact us on WhatsApp: <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{getWhatsAppNumber()}</a> or email: contact@istamedia.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
