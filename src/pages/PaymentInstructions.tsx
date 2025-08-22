import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, QrCode, CreditCard, Building2, User, Phone, Mail, ArrowLeft, Upload, MessageCircle } from "lucide-react";
import { openWhatsAppWithMessage, getWhatsAppUrl, getWhatsAppNumber } from '@/lib/whatsapp';

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  hospital: string;
  city: string;
  notes: string;
  tierLabel: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  orderNumber: string;
}

interface PaymentMethods {
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
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!orderId || !amount) {
      toast.error("Invalid payment information");
      navigate('/');
      return;
    }

    // Get customer details from sessionStorage instead of database
    const storedDetails = sessionStorage.getItem('customerDetails');
    if (!storedDetails) {
      toast.error("Session expired. Please try again.");
      navigate('/');
      return;
    }

    try {
      const details = JSON.parse(storedDetails) as CustomerDetails;
      setCustomerDetails(details);
      
      // Set payment instructions
      setPaymentInstructions({
        upiId: "istadigitalmedia@okaxis",
        qrCode: "/lovable-uploads/3d7301ed-d85b-4d57-933d-52cc9642c413.png",
        bankDetails: {
          accountName: "ISTA DIGITAL MEDIA",
          accountNumber: "50200097383107",
          ifsc: "HDFC0009377",
          bank: "HDFC"
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error parsing customer details:', error);
      toast.error("Invalid session data. Please try again.");
      navigate('/');
    }
  }, [orderId, amount, navigate]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handlePaymentProofSubmit = async () => {
    if (!orderId) return;
    
    setUploadingProof(true);
    
    try {
      const response = await fetch(`https://vnccezzqcohvgzkwojqz.supabase.co/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentProofUrl: 'manual_verification_pending',
          transactionId: 'manual_verification'
        })
      });

      if (response.ok) {
        toast.success("Payment proof submitted for verification. We'll contact you once verified.");
        // Clear session data after successful submission
        sessionStorage.removeItem('customerDetails');
      } else {
        throw new Error('Failed to submit payment proof');
      }
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error("Failed to submit payment proof. Please try again.");
    } finally {
      setUploadingProof(false);
    }
  };

  const sendWhatsAppPaymentDetails = () => {
    if (!customerDetails) return;
    
    const message = `Hi! I have completed the payment for my ISTA Media event registration.

Order Details:
📋 Order Number: ${customerDetails.orderNumber}
👤 Name: ${customerDetails.name}
📧 Email: ${customerDetails.email}
📱 Phone: ${customerDetails.phone}
🎟️ Tier: ${customerDetails.tierLabel}
💰 Amount Paid: ₹${customerDetails.totalAmount.toLocaleString()} (including GST)

I will share the payment screenshot shortly. Please verify my payment and confirm my registration.

Thank you!`;

    openWhatsAppWithMessage(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customerDetails || !paymentInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Failed to load payment instructions</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold">Payment Instructions</h1>
          </div>

          {/* Order Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customerDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customerDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customerDetails.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-medium">{customerDetails.orderNumber}</p>
                </div>
              </div>
              
              {/* Amount Breakdown */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Fee ({customerDetails.tierLabel})</span>
                    <span>₹{customerDetails.baseAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{customerDetails.gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount</span>
                    <span>₹{customerDetails.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <Badge variant="secondary" className="w-fit">
                {customerDetails.tierLabel}
              </Badge>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UPI Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  UPI Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <img 
                    src={paymentInstructions.qrCode} 
                    alt="UPI QR Code" 
                    className="w-48 h-48 mx-auto border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">UPI ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {paymentInstructions.upiId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInstructions.upiId, 'UPI ID')}
                    >
                      {copiedField === 'UPI ID' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      ₹{customerDetails.totalAmount}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(customerDetails.totalAmount.toString(), 'Amount')}
                    >
                      {copiedField === 'Amount' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bank Transfer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Account Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {paymentInstructions.bankDetails.accountName}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInstructions.bankDetails.accountName, 'Account Name')}
                    >
                      {copiedField === 'Account Name' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Account Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {paymentInstructions.bankDetails.accountNumber}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInstructions.bankDetails.accountNumber, 'Account Number')}
                    >
                      {copiedField === 'Account Number' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">IFSC Code</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {paymentInstructions.bankDetails.ifsc}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInstructions.bankDetails.ifsc, 'IFSC Code')}
                    >
                      {copiedField === 'IFSC Code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Bank Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {paymentInstructions.bankDetails.bank}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInstructions.bankDetails.bank, 'Bank Name')}
                    >
                      {copiedField === 'Bank Name' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Confirmation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                After making the payment, you can either send us the details via WhatsApp or submit for manual verification.
              </p>
              
              {/* WhatsApp Button - Primary Option */}
              <Button 
                onClick={sendWhatsAppPaymentDetails}
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send payment details via WhatsApp
              </Button>

              {/* Manual Verification Button - Secondary Option */}
              <Button 
                onClick={handlePaymentProofSubmit}
                disabled={uploadingProof}
                variant="outline"
                className="w-full"
              >
                {uploadingProof ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    I have completed the payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={getWhatsAppUrl("Hi, I need help with my payment for ISTA Media event registration.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with us on WhatsApp ({getWhatsAppNumber()})
                </a>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>contact@istamedia.com</span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructions;