import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, QrCode, CreditCard, Building2, User, Phone, Mail, ArrowLeft, Upload } from "lucide-react";

interface Order {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  tier_label: string;
  status: string;
}

interface PaymentInstructions {
  upiId: string;
  qrCode: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bank: string;
  };
}

const PaymentInstructions = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const amount = searchParams.get('amount');
  const baseAmount = searchParams.get('baseAmount');
  const gstAmount = searchParams.get('gstAmount');
  const currency = searchParams.get('currency');

  useEffect(() => {
    if (!orderId || !amount) {
      toast.error("Invalid payment information");
      navigate('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error || !orderData) {
          toast.error("Order not found");
          navigate('/');
          return;
        }

        setOrder(orderData);
        
        // Set payment instructions
        setPaymentInstructions({
          upiId: "istadigitalmedia@okaxis",
          qrCode: `upi://pay?pa=istadigitalmedia@okaxis&am=${amount}&cu=${currency}&tn=ISTA Event Registration - ${orderData.tier_label}`,
          bankDetails: {
            accountName: "ISTA Digital Media",
            accountNumber: "2345678901",
            ifsc: "OKAX0001234",
            bank: "Okaxis Bank"
          }
        });
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error("Failed to load payment instructions");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, amount, currency, navigate]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePaymentProofSubmit = async () => {
    if (!order) return;
    
    setUploadingProof(true);
    try {
      // For now, we'll mark as submitted without file upload
      // In a real implementation, you'd upload the file first
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { 
          orderId: order.id,
          paymentProofUrl: "manual_verification_required",
          transactionId: `TXN_${Date.now()}`
        }
      });

      if (error) {
        toast.error("Failed to submit payment verification");
        return;
      }

      toast.success("Payment proof submitted! Your ticket will be generated once payment is verified.");
      navigate('/');
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error("Failed to submit payment proof");
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading payment instructions...</p>
        </div>
      </div>
    );
  }

  if (!order || !paymentInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load payment instructions</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground">Follow the instructions below to complete your registration</p>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{order.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <Badge>{order.tier_label}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <div>
                  <p className="text-2xl font-bold text-primary">₹{order.amount}</p>
                  {baseAmount && gstAmount ? (
                    <p className="text-xs text-muted-foreground">₹{baseAmount} + ₹{gstAmount} GST (18%)</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">₹5000 + ₹900 GST (18%)</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{orderNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UPI Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              UPI Payment (Recommended)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">UPI ID</p>
                <p className="font-mono font-semibold">{paymentInstructions.upiId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(paymentInstructions.upiId, 'upi')}
              >
                {copiedField === 'upi' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Scan QR code with any UPI app</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src="/lovable-uploads/c0cb2aeb-779b-402c-9b34-478507e45c16.png" 
                  alt="UPI QR Code - istadigitalmedia@okaxis" 
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Amount: ₹{amount} {baseAmount && gstAmount ? `(₹${baseAmount} + ₹${gstAmount} GST)` : '(₹5000 + ₹900 GST)'} • {order.tier_label}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries({
              'Account Name': paymentInstructions.bankDetails.accountName,
              'Account Number': paymentInstructions.bankDetails.accountNumber,
              'IFSC Code': paymentInstructions.bankDetails.ifsc,
              'Bank': paymentInstructions.bankDetails.bank
            }).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-mono font-semibold">{value}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(value, label.toLowerCase().replace(' ', '_'))}
                >
                  {copiedField === label.toLowerCase().replace(' ', '_') ? 
                    <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Proof */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Submit Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm">
                After making the payment, click the button below to submit your payment for verification. 
                Your ticket will be generated once the payment is confirmed.
              </p>
            </div>
            <Button 
              onClick={handlePaymentProofSubmit} 
              disabled={uploadingProof}
              className="w-full"
            >
              {uploadingProof ? "Submitting..." : "I have made the payment"}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>Need help? Contact us:</p>
              <div className="flex justify-center items-center gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 9948999001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@istadigitalmedia.com</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default PaymentInstructions;