import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircle } from 'lucide-react';
import { openWhatsAppWithMessage, openWhatsApp } from '@/lib/whatsapp';

// Types and Config
interface TierInfo {
  label: string;
  amount: number;
  until: number | null;
}

const DEADLINES = {
  early: Date.parse("2025-09-04T18:29:59Z"), // Sept 4th 23:59:59 IST
  std: Date.parse("2025-09-14T18:29:59Z"), // Sept 14th 23:59:59 IST
};

const CHIEF_GUESTS = [
  {
    name: "Sri. Jishnu Dev Varma Garu", 
    designation: "Governor of Telangana",
    image: "/lovable-uploads/07095247-9d5e-4433-aa60-1b2377dc2836.png",
    quote: "The noble work of ISTA in honoring our healthcare heroes deserves appreciation from every section of society."
  },
  {
    name: "Sri. Damodar Rajanarasimha Garu",
    designation: "Health Minister of Telangana",
    image: "/lovable-uploads/632d5279-ccad-4a29-a60d-cfcea9b52d67.png",
    quote: "ISTA has consistently created a platform where the medical fraternity feels celebrated and recognized for their selfless service to humanity."
  },
  {
    name: "Sri. Madavaneni Raghunandan Rao Garu",
    designation: "Member of Parliament Medak constituency",
    image: "/lovable-uploads/af60150e-f4be-4cc5-a06e-be8e25dd77c2.png", 
    quote: "ISTA's commitment to celebrating medical excellence sets a benchmark for honoring our healthcare professionals."
  },
  {
    name: "Sri. V. V. Lakshminarayana Garu",
    designation: "Ex CBI Joint Director, Agriculturist, Social worker", 
    image: "/lovable-uploads/1c0d8019-a6fd-402d-9278-8fa452533b98.png",
    quote: "Through ISTA's initiatives, we witness the true spirit of recognizing those who dedicate their lives to healing others."
  },
  {
    name: "Smt. Nerella Sharada Garu",
    designation: "Chairperson, Telangana State Commission for Women",
    image: "/lovable-uploads/8c22de2b-6c41-4d04-8a4e-a2692e4970f0.png",
    quote: "The recognition provided by ISTA to our medical community is both timely and necessary for society's wellbeing."
  }
];

const DOCTORS = [
  {
    name: "Dr Gopala Krishna Gokule",
    image: "/lovable-uploads/a3a07d30-4e07-4ffe-bf02-0a8a5400aee5.png",
    quote: "ISTA transforms our profession by celebrating the human stories behind medical excellence. Every doctor deserves recognition for their dedication and sacrifice. This platform beautifully captures our journey and inspires the next generation of healers."
  },
  {
    name: "Dr Seetharam Buddavarapu", 
    image: "/lovable-uploads/afb48efd-93ea-4e54-a46b-3fd49aa5b4e0.png",
    quote: "Through ISTA, I've witnessed doctors rediscover their passion for medicine. The organization doesn't just honor achievements—it honors the heart of healing. Every event reminds us why we chose this noble calling."
  },
  {
    name: "Dr Manjula Anagani",
    image: "/lovable-uploads/ac9f74f5-2c35-4213-a8f7-8b47e00b3b65.png",
    quote: "ISTA's approach to celebrating doctors is refreshingly authentic. They don't just showcase our degrees—they honor our dedication, our sleepless nights, and our unwavering commitment to saving lives."
  },
  {
    name: "Dr KVNN Santosh Murthy",
    image: "/lovable-uploads/d0daa190-d243-44cb-bf66-fd91e5f3cd9f.png",
    quote: "ISTA provides a unique platform where medical professionals can connect, share experiences, and celebrate our collective commitment to healthcare excellence and patient care."
  },
  {
    name: "Dr Rajeswari Reddy",
    image: "/lovable-uploads/c29b9f5f-fffd-4b5d-80b7-d23f6610d686.png",
    quote: "In my years of practice, I've rarely found a platform that truly understands doctors. ISTA bridges the gap between our professional achievements and personal stories, creating a legacy worth preserving."
  },
  {
    name: "Dr Samatha Tulla",
    image: "/lovable-uploads/8b105df3-8298-4a1c-8ecb-0f4b4bbe7ae9.png",
    quote: "What sets ISTA apart is its genuine understanding of a doctor's journey. Beyond the clinical expertise, they recognize our emotional investment in every patient. This recognition fuels our commitment to excellence."
  },
  {
    name: "Dr Hari Chekuri",
    image: "/lovable-uploads/5f6511ad-b869-47d1-ac4f-baa8aa3f2fa1.png",
    quote: "ISTA creates meaningful connections within the medical community, fostering an environment where doctors can share knowledge, experiences, and support each other in our noble profession."
  },
  {
    name: "Dr Preeti Challa",
    image: "/lovable-uploads/preeti-challa-full-head.png",
    quote: "Being part of the ISTA community means being recognized not just as a medical professional, but as a human being dedicated to healing and caring for others with compassion and expertise."
  },
  {
    name: "Dr Vani Veggalam",
    image: "/lovable-uploads/2592ccd1-42f2-4ac5-8e68-7de3b2422e65.png",
    quote: "ISTA creates a sanctuary where doctors can share their vulnerabilities and victories. In a profession where we give so much, this platform gives back by amplifying our voices and celebrating our humanity."
  }
];

// Utility functions
const formatTime = (ms: number): string => {
  if (ms <= 0) return "00:00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getActiveTier = (ts = Date.now()): TierInfo => {
  const earlyAmount = 10000; // Early Bird amount
  const standardAmount = 20000; // Standard amount
  
  if (ts <= DEADLINES.early) return { label: "Early Bird", amount: earlyAmount, until: DEADLINES.early };
  if (ts <= DEADLINES.std) return { label: "Standard", amount: standardAmount, until: DEADLINES.std };
  return { label: "Final/On-spot", amount: standardAmount, until: null };
};


const scrollToRegister = () => {
  const element = document.getElementById('register');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    // Focus the full name input after scroll
    setTimeout(() => {
      const input = document.querySelector('#register input[type="text"]') as HTMLInputElement;
      if (input) input.focus();
    }, 1000);
  }
};

// Main Component
export default function LandingPage() {
  const [tier, setTier] = useState<TierInfo>(getActiveTier());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    speciality: '',
    hospital: '',
    city: '',
    email: '',
    phone: '',
    notes: '',
    agree: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [isProcessing, setIsProcessing] = useState(false);

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setTier(getActiveTier());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Razorpay Payment Integration
  const handlePayment = async () => {
    console.log('handlePayment called - using Razorpay');
    setIsProcessing(true);
    
    try {
      console.log('Creating Razorpay order with data:', {
        baseAmount: tier.amount,
        currency: "INR",
        formData,
        tierLabel: tier.label,
      });

      // Create Razorpay order
      const { data: orderData, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          baseAmount: tier.amount,
          currency: "INR",
          formData,
          tierLabel: tier.label,
        }
      });

      if (error) {
        console.error('Order creation error:', error);
        throw new Error(error.message || 'Failed to create order');
      }

      console.log('Razorpay order created successfully:', orderData);

      // Load Razorpay and process payment
      const { createRazorpayOrder } = await import('@/lib/razorpay');
      
      const paymentResponse = await createRazorpayOrder({
        amount: orderData.amount,
        currency: orderData.currency,
        orderId: orderData.razorpayOrderId,
        key: orderData.key,
        customerDetails: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
      });

      console.log('Payment completed:', paymentResponse);

      // Verify payment
      const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Payment verification failed');
      }

      toast.success("Payment successful! Redirecting to confirmation page...");
      
      // Redirect to success page
      setTimeout(() => {
        window.location.href = `/payment-success?orderId=${orderData.orderId}`;
      }, 1500);

    } catch (error: any) {
      console.error('Payment processing error:', error);
      
      if (error.message === 'Payment cancelled by user') {
        toast.error("Payment was cancelled. Please try again when ready.");
      } else {
        toast.error(error.message || "Payment processing failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number validation
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid 10-digit Indian mobile number';
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
    setFormData({...formData, phone});
    const phoneError = validatePhone(phone);
    setFormErrors({...formErrors, phone: phoneError});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        errors.phone = phoneError;
      }
    }
    
    if (!formData.speciality.trim()) {
      errors.speciality = "Speciality is required";
    }
    
    if (!formData.hospital.trim()) {
      errors.hospital = "Hospital/Clinic name is required";
    }
    
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Fill all required fields correctly to proceed.");
      console.log('Form validation failed:', errors);
      return;
    }
    
    if (!formData.agree) {
      toast.error("Please agree to the terms and conditions to proceed.");
      console.log('Form stopped due to missing agreement');
      return;
    }
    
    console.log('Calling handlePayment...');
    await handlePayment();
  };

  return (
    <>

      {/* Hero Section */}
      <section className="relative pt-4 pb-16 backdrop-gold overflow-hidden">
        {/* Light overlay to maintain text readability while showing gold background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/25"></div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4">
          {/* Sign In Button - Top Right */}
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth'}
              className="text-sm"
            >
              Sign In
            </Button>
          </div>
          
          {/* Logo at Top */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/lovable-uploads/4a2d89c1-89fa-4016-9f29-00667be90c01.png" 
              alt="ISTA Media Logo" 
              className="h-40 md:h-52 lg:h-60 w-auto filter drop-shadow-lg cursor-pointer"
              style={{ filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.4))' }}
              onClick={() => window.location.href = '/'}
            />
            <div className="font-playfair italic text-xl md:text-2xl lg:text-3xl text-gold-light text-shadow-lg -mt-1">
              Anniversary Edition 2025
            </div>
          </div>
          
           <div className="text-center">
             <h1 className="mt-2 text-4xl md:text-6xl font-extrabold gold-glow">
               Celebrating the Heroes in White Coats
             </h1>
             <p className="mt-4 text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
               Be featured in the prestigious Doctors' Souvenir by ISTA Digital Media. A black-and-gold cinematic edition that honors your journey and amplifies your impact.
             </p>
             <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
               <Badge variant="outline" className="gold-pill">📍 JRC Convention, Hyderabad</Badge>
               <Badge variant="outline" className="gold-pill">🗓️ Sunday, 14 September 2025</Badge>
               <Badge variant="outline" className="gold-pill">⏰ 6:00 PM onwards</Badge>
             </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button className="gold-gradient text-primary-foreground" size="lg" onClick={scrollToRegister}>Register Now</Button>
                <Button variant="outline" size="lg" onClick={() => setShowModal(true)}>
                  What's Included
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => openWhatsAppWithMessage("Hi! I'm interested in the ISTA Media Anniversary Edition 2025. Can you help me with more details about the registration?")}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Quick Questions?
                </Button>
              </div>
             <p className="mt-3 text-sm text-muted-foreground">
               Limited slots. Instant confirmation after payment.
             </p>
           </div>

           {/* Hero Cards Section */}
           <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card className="gold-border p-6 bg-gradient-to-br from-primary/10 to-black/60">
              <CardContent className="p-0 text-center">
                <div className="text-3xl mb-3">📖</div>
                <p className="text-xl font-semibold mb-2 gold-glow">Premium Publication</p>
                <p className="text-muted-foreground text-sm">
                  Your profile in the Anniversary Souvenir distributed across partner hospitals and digital channels.
                </p>
              </CardContent>
            </Card>
            
            <Card className="gold-border p-6 bg-gradient-to-br from-primary/10 to-black/60">
              <CardContent className="p-0 text-center">
                <div className="text-3xl mb-3">🏆</div>
                <p className="text-xl font-semibold mb-2 gold-glow">Recognition Awards</p>
                <p className="text-muted-foreground text-sm">
                  Official recognition ceremony with distinguished guests and healthcare leaders in attendance.
                </p>
              </CardContent>
            </Card>

            <Card className="gold-border p-6 bg-gradient-to-br from-primary/10 to-black/60">
              <CardContent className="p-0 text-center">
                <div className="text-3xl mb-3">🤝</div>
                <p className="text-xl font-semibold mb-2 gold-glow">Elite Networking</p>
                <p className="text-muted-foreground text-sm">
                  Connect with 200+ distinguished medical professionals and healthcare leaders.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-primary/25">
        <div className="mx-auto max-w-7xl px-4 py-4 text-sm flex flex-wrap justify-center gap-4 text-muted-foreground">
          <span>🔒 Data privacy assured</span>
          <span>🎯 Registration-focused experience</span>
          <span>🎁 Limited-time offer tiers</span>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding section-bg">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">About ISTA Digital Media</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              ISTA Digital Media has been at the forefront of celebrating healthcare excellence for over a decade. We specialize in curating impactful stories, campaigns, and publications that honor the medical fraternity and their invaluable contributions to society.
            </p>
            <p>
              Our flagship Doctors' Souvenir series has featured over 500+ distinguished medical professionals, reaching audiences across hospitals, medical institutions, and healthcare communities nationwide. Each edition serves as both a tribute to clinical excellence and a bridge that builds public trust in our healthcare system.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold gold mb-3">What We Do</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-card/50 border border-primary/20">
                  <div className="font-semibold text-primary">Storytelling</div>
                  <div>Crafting compelling narratives that showcase medical excellence</div>
                </div>
                <div className="p-4 rounded-lg bg-card/50 border border-primary/20">
                  <div className="font-semibold text-primary">Recognition Programs</div>
                  <div>Honoring healthcare heroes through prestigious publications</div>
                </div>
                <div className="p-4 rounded-lg bg-card/50 border border-primary/20">
                  <div className="font-semibold text-primary">Impact Publications</div>
                  <div>Creating keepsakes that celebrate medical journeys and inspire future generations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Event */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">Why This Event Matters</h2>
          <p className="mt-4 text-lg text-muted-foreground">Beyond recognition, it's about building legacy and fostering connection in the medical community</p>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="gold-border bg-card/50 p-6">
              <div className="text-2xl mb-3">📚</div>
              <h3 className="font-semibold text-primary mb-2">Editorial Polish</h3>
              <p className="text-sm text-muted-foreground">Your story, professionally crafted and beautifully presented in our premium souvenir publication</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6">
              <div className="text-2xl mb-3">🏆</div>
              <h3 className="font-semibold text-primary mb-2">Peer Recognition</h3>
              <p className="text-sm text-muted-foreground">Be celebrated among colleagues and healthcare leaders in a distinguished ceremony</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6">
              <div className="text-2xl mb-3">🌟</div>
              <h3 className="font-semibold text-primary mb-2">Legacy Publication</h3>
              <p className="text-sm text-muted-foreground">A keepsake that honors your medical journey and inspires future generations of healers</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6">
              <div className="text-2xl mb-3">🤝</div>
              <h3 className="font-semibold text-primary mb-2">Network Building</h3>
              <p className="text-sm text-muted-foreground">Connect with distinguished medical professionals and healthcare leaders across specialties</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 2025 Guest of Honour */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">2025 Guest of Honour</h2>
          <p className="text-muted-foreground mt-2">A distinguished personality to be announced soon</p>
          <Card className="mt-8 gold-border bg-card/50 max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                TBD
              </div>
              <h3 className="text-xl font-semibold mb-2">To Be Announced</h3>
              <p className="text-sm text-muted-foreground italic">We are honored to have a distinguished guest who will inspire and celebrate our medical community. Stay tuned for the big reveal!</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2025 Event Highlights */}
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-glow">2025 Event Highlights</h2>
            <p className="text-muted-foreground">What makes this anniversary edition special</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="font-semibold text-primary mb-2">Premium Souvenir</h3>
              <p className="text-sm text-muted-foreground">Black & gold cinematic edition featuring your professional journey</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">🏅</div>
              <h3 className="font-semibold text-primary mb-2">Recognition Awards</h3>
              <p className="text-sm text-muted-foreground">On-stage recognition and appreciation certificates</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-primary mb-2">Elite Networking</h3>
              <p className="text-sm text-muted-foreground">Connect with 200+ distinguished medical professionals</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-semibold text-primary mb-2">Distinguished Guests</h3>
              <p className="text-sm text-muted-foreground">Ministers, governors, and healthcare leaders in attendance</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="font-semibold text-primary mb-2">Cultural Performances</h3>
              <p className="text-sm text-muted-foreground">Elegant entertainment and celebration activities</p>
            </Card>
            <Card className="gold-border bg-card/50 p-6 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="font-semibold text-primary mb-2">Digital Legacy</h3>
              <p className="text-sm text-muted-foreground">Online features and social media amplification</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Event Agenda */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Event Flow</h2>
            <p className="text-muted-foreground">Sunday, 14 September 2025 • JRC Convention, Hyderabad</p>
          </div>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">5:00pm – 5:45pm</span>
                <span className="text-muted-foreground">Registration and check-in for doctors</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">5:45pm – 6:00pm</span>
                <span className="text-muted-foreground">Welcome and event introduction by the anchor</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">6:00pm – 6:30pm</span>
                <span className="text-muted-foreground">Doctor's debate session</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">6:30pm – 6:45pm</span>
                <span className="text-muted-foreground">Cultural activity</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">6:45pm – 7:00pm</span>
                <span className="text-muted-foreground">Lamp lighting ceremony conducted by the chief guest</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">7:00pm – 7:30pm</span>
                <span className="text-muted-foreground">Chief guest's welcome note and keynote speech</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">7:30pm – 9:30pm</span>
                <span className="text-muted-foreground">Awards ceremony</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">9:30pm – 9:45pm</span>
                <span className="text-muted-foreground">Doctor's sharing their perspectives "Doctor's Bytes"</span>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 gold-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">9:45pm – 10:30pm</span>
                <span className="text-muted-foreground">Dinner • 10:30pm: Closing Ceremony</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Spotlight */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">Venue Spotlight</h2>
          <Card className="mt-8 gold-border bg-card/50">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-4">JRC Convention Center</h3>
              <p className="text-muted-foreground mb-6">A premium venue in the heart of Hyderabad, known for hosting distinguished events and celebrations. The elegant ambiance perfectly complements our anniversary celebration.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="gold-pill">📍 Prime Hyderabad Location</Badge>
                <Badge className="gold-pill">🅿️ Ample Parking Available</Badge>
                <Badge className="gold-pill">♿ Accessibility Features</Badge>
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={() => window.open('https://maps.google.com/?q=JRC+Convention,+Hyderabad', '_blank')}>
                  📍 View on Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding section-bg">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Limited-Time Offer Pricing</h2>
            <p className="text-muted-foreground">Auto-updates by date (IST). Pay securely via Razorpay.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="gold-border bg-card/50">
              <CardContent className="p-6">
                <div className="kicker mb-2">Till Sep 4</div>
                <div className="text-4xl font-extrabold">₹10,000</div>
                <p className="mt-2 text-sm text-muted-foreground">Early Bird — ends Sep 4, 23:59 IST</p>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50">
              <CardContent className="p-6">
                <div className="kicker mb-2">Sep 5 – Sep 14</div>
                <div className="text-4xl font-extrabold">₹20,000</div>
                <p className="mt-2 text-sm text-muted-foreground">Standard — ends Sep 14, 23:59 IST</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 gold-border p-5 flex items-center justify-between gap-4 flex-col md:flex-row">
            <div className="text-sm">
              <div>🎟️ Current Tier: <span className="gold font-semibold">{tier.label}</span></div>
              <div>
                Price: <span className="gold font-semibold">₹{tier.amount.toLocaleString('en-IN')}</span> <span className="text-xs text-muted-foreground">+ GST</span> • 
                {tier.until ? (
                  <>Ends in <span className="gold font-semibold">{formatTime(tier.until - Date.now())}</span> <span className="text-xs">(Days:Hours:Minutes:Seconds IST)</span></>
                ) : (
                  <span className="gold font-semibold">Available now</span>
                )}
              </div>
            </div>
            <Button className="gold-gradient text-primary-foreground" onClick={scrollToRegister}>Register at Current Price</Button>
          </Card>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="section-padding section-bg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Secure Your Spot</h2>
            <p className="text-muted-foreground">Fill your details below. We'll confirm instantly after payment via secure Razorpay gateway.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="gold-border">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="grid md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm text-muted-foreground">Full Name (Doctor) *</label>
                       <Input 
                         required 
                         value={formData.fullName}
                         onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.fullName ? 'border-destructive' : ''}`}
                       />
                       {formErrors.fullName && (
                         <div className="text-xs text-destructive mt-1">{formErrors.fullName}</div>
                       )}
                     </div>
                     <div>
                       <label className="text-sm text-muted-foreground">Speciality *</label>
                       <Input 
                         required 
                         value={formData.speciality}
                         onChange={(e) => setFormData({...formData, speciality: e.target.value})}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.speciality ? 'border-destructive' : ''}`}
                       />
                       {formErrors.speciality && (
                         <div className="text-xs text-destructive mt-1">{formErrors.speciality}</div>
                       )}
                     </div>
                     <div>
                       <label className="text-sm text-muted-foreground">Hospital / Clinic *</label>
                       <Input 
                         required
                         value={formData.hospital}
                         onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.hospital ? 'border-destructive' : ''}`}
                       />
                       {formErrors.hospital && (
                         <div className="text-xs text-destructive mt-1">{formErrors.hospital}</div>
                       )}
                     </div>
                     <div>
                       <label className="text-sm text-muted-foreground">City *</label>
                       <Input 
                         required
                         value={formData.city}
                         onChange={(e) => setFormData({...formData, city: e.target.value})}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.city ? 'border-destructive' : ''}`}
                       />
                       {formErrors.city && (
                         <div className="text-xs text-destructive mt-1">{formErrors.city}</div>
                       )}
                     </div>
                     <div>
                       <label className="text-sm text-muted-foreground">Email *</label>
                       <Input 
                         type="email" 
                         required 
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.email ? 'border-destructive' : ''}`}
                       />
                       {formErrors.email && (
                         <div className="text-xs text-destructive mt-1">{formErrors.email}</div>
                       )}
                     </div>
                     <div>
                       <label className="text-sm text-muted-foreground">WhatsApp Number *</label>
                       <Input 
                         type="tel" 
                         required 
                         placeholder="10-digit mobile number"
                         value={formData.phone}
                         onChange={handlePhoneChange}
                         className={`mt-1 bg-black/40 border-primary/35 ${formErrors.phone ? 'border-destructive' : ''}`}
                         aria-describedby="phone-help"
                       />
                       <div id="phone-help" className="text-xs text-muted-foreground mt-1">
                         Enter a valid 10-digit Indian mobile number (6-9 followed by 9 digits)
                       </div>
                       {formErrors.phone && (
                         <div className="text-xs text-destructive mt-1">{formErrors.phone}</div>
                       )}
                     </div>
                   </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Notes (optional)</label>
                    <Textarea 
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-1 bg-black/40 border-primary/35"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4" 
                      required
                      checked={formData.agree}
                      onChange={(e) => setFormData({...formData, agree: e.target.checked})}
                    />
                    I agree to be contacted via WhatsApp/Email for confirmation and print proof.
                  </label>
                  <Button 
                    type="submit" 
                    className="gold-gradient text-primary-foreground w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Proceed to Payment (₹${tier.amount.toLocaleString('en-IN')} + GST)`}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center p-6 border-l border-primary/25">
              <p className="font-semibold mb-2">Need help?</p>
              <p className="text-sm text-muted-foreground mb-4">Chat with us on WhatsApp for instant assistance</p>
              <Button 
                variant="outline" 
                onClick={() => openWhatsAppWithMessage("Hi! I need help with the ISTA Media event registration. Can you assist me?")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat with us (+91 9948999001)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Chief Guests */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-glow">Previous Chief Guests</h2>
            <p className="text-muted-foreground">Distinguished personalities who have graced our ceremonies</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {CHIEF_GUESTS.map((guest, idx) => (
              <Card key={idx} className="gold-border bg-card/50 overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={guest.image} 
                    alt={guest.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-white text-shadow-lg text-lg">{guest.name}</h3>
                    <p className="text-sm text-white/90 text-shadow">{guest.designation}</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground italic">"{guest.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Souvenir Showcase */}
      <section className="section-padding">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">Souvenir Showcase</h2>
          <p className="mt-3 text-muted-foreground">
            An elegant black & gold publication capturing journeys, research, and inspiring stories of doctors.
          </p>
          <blockquote className="mt-6 italic text-muted-foreground max-w-3xl mx-auto">
            "ISTA's souvenir is not just a publication; it is a living archive of inspiration. Every page carries stories that uplift and remind us why we chose this noble profession."
          </blockquote>
        </div>
      </section>

      {/* Recognition & Awards */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Recognition & Awards</h2>
            <p className="text-muted-foreground">What you receive as part of this prestigious program</p>
          </div>
          <Card className="gold-border bg-card/50">
            <CardContent className="p-8">
              <div className="mb-6">
                <p className="text-lg italic text-center">
                  "Being featured in ISTA's souvenir isn't just recognition—it's a celebration of our commitment to healing humanity. The elegance and respect with which they present our stories makes every doctor feel truly valued and appreciated."
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">— Dr. Priya Sharma, Cardiologist</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/10">
                  <h4 className="font-semibold text-primary mb-2">🎖️ Stage Recognition</h4>
                  <p className="text-sm text-muted-foreground">Individual felicitation on stage during the ceremony</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <h4 className="font-semibold text-primary mb-2">📖 Souvenir Profile</h4>
                  <p className="text-sm text-muted-foreground">Premium feature in our anniversary publication</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <h4 className="font-semibold text-primary mb-2">🏆 ISTA Badge</h4>
                  <p className="text-sm text-muted-foreground">Official recognition certificate and badge</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <h4 className="font-semibold text-primary mb-2">📱 Digital Feature</h4>
                  <p className="text-sm text-muted-foreground">Online profile and social media amplification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ISTA Track Record */}
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-glow">ISTA Track Record</h2>
            <p className="text-muted-foreground">A legacy of celebrating healthcare excellence</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="gold-border bg-card/50 text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold gold mb-2">3</div>
                <div className="text-sm text-muted-foreground">Awards Ceremonies</div>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50 text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold gold mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Doctors Honored</div>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50 text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold gold mb-2">25+</div>
                <div className="text-sm text-muted-foreground">Distinguished Guests</div>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50 text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold gold mb-2">1st</div>
                <div className="text-sm text-muted-foreground">Souvenir Edition</div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-center mb-8 gold">Our Journey</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="gold-border bg-card/50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl mb-3">🏆</div>
                  <h4 className="font-semibold text-primary mb-2">First Awards Ceremony</h4>
                  <p className="text-sm text-muted-foreground">Launched our mission to honor medical professionals with our inaugural awards event</p>
                </CardContent>
              </Card>
              <Card className="gold-border bg-card/50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl mb-3">🌟</div>
                  <h4 className="font-semibold text-primary mb-2">Continued Excellence</h4>
                  <p className="text-sm text-muted-foreground">Successfully organized two more ceremonies, building a strong reputation in healthcare recognition</p>
                </CardContent>
              </Card>
              <Card className="gold-border bg-card/50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl mb-3">📖</div>
                  <h4 className="font-semibold text-primary mb-2">Souvenir Innovation</h4>
                  <p className="text-sm text-muted-foreground">2025 marks our evolution into creating lasting legacies through premium publications</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* New in 2025 */}
          <Card className="gold-border bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-8 text-center">
              <Badge className="gold-pill mb-4">New in 2025</Badge>
              <h3 className="text-2xl font-bold gold-glow mb-4">First Ever Souvenir Edition</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                After three successful awards ceremonies, we're proud to introduce our premium souvenir concept. This Anniversary Edition combines our proven expertise in medical recognition with a beautiful, lasting publication that doctors and their families will treasure forever.
              </p>
              <Button className="gold-gradient text-primary-foreground" onClick={scrollToRegister}>
                Be Part of History - Register Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Doctors' Gallery */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-glow">Featured Doctors</h2>
            <p className="text-muted-foreground">Celebrating our esteemed medical professionals</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {DOCTORS.map((doctor, idx) => (
              <Card key={idx} className="gold-border bg-card/50 overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-white text-shadow-lg text-lg">{doctor.name}</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground italic">"{doctor.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="section-padding section-bg">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-3xl font-bold gold-glow text-center">FAQ</h2>
          <div className="mt-6 space-y-3">
            <details className="gold-pill p-4">
              <summary className="cursor-pointer font-semibold">How do I pay?</summary>
              <p className="mt-2 text-muted-foreground">
                After submitting your registration, a secure Razorpay modal opens with the active tier amount. You'll receive a payment confirmation instantly.
              </p>
            </details>
            <details className="gold-pill p-4">
              <summary className="cursor-pointer font-semibold">What do I get for the fee?</summary>
              <p className="mt-2 text-muted-foreground">
                A premium profile in the Anniversary Souvenir, recognition on stage, and digital amplification on ISTA channels.
              </p>
            </details>
            <details className="gold-pill p-4">
              <summary className="cursor-pointer font-semibold">Can I edit my details later?</summary>
              <p className="mt-2 text-muted-foreground">
                Yes, until the editorial cut-off communicated via email/WhatsApp.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA + Contact */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Card className="gold-border bg-card/50">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold gold-glow mb-4">Ready to Join Our Distinguished Community?</h2>  
              <p className="text-lg text-muted-foreground mb-8">Secure your place in the 2025 Anniversary Edition and be celebrated among healthcare's finest.</p>
              <Button size="lg" className="gold-gradient text-primary-foreground mb-8" onClick={scrollToRegister}>
                Register Now - Limited Spots Available
              </Button>
              <div className="border-t border-primary/25 pt-6">
                <h3 className="font-semibold text-primary mb-4">Need Help? Get In Touch</h3>
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <a href="tel:+919948999001" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    📞 <span>+91 9948999001</span>
                  </a>
                  <a href="mailto:contact@istamedia.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    📧 <span>contact@istamedia.com</span>
                  </a>
                  <Button 
                    variant="ghost" 
                    onClick={() => openWhatsAppWithMessage("Hi! I'm interested in registering for the ISTA Media Anniversary Edition 2025. Can you help me with the process?")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary p-0 h-auto"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/25 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="font-semibold text-primary">ISTA Digital Media</div>
              <p className="text-sm text-muted-foreground mt-2">Celebrating healthcare excellence through impactful storytelling and prestigious recognition programs.</p>
            </div>
            <div>
              <div className="font-semibold text-primary">Contact Us</div>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <a href="mailto:contact@istamedia.com" className="flex items-center gap-1 hover:text-primary transition-colors">📧 contact@istamedia.com</a>
                <a href="tel:+919948999001" className="flex items-center gap-1 hover:text-primary transition-colors">📞 +91 9948999001</a>
                <Button 
                  variant="ghost" 
                  onClick={() => openWhatsAppWithMessage("Hi! I have a question about the ISTA Media event. Can you help me?")}
                  className="flex items-center gap-1 hover:text-primary transition-colors text-left p-0 h-auto text-sm text-muted-foreground"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp support available
                </Button>
              </div>
            </div>
            <div>
              <div className="font-semibold text-primary">Event Details</div>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <div>📅 Sunday, 14 September 2025</div>
                <div>⏰ 6:00 PM onwards</div>
                <div>📍 JRC Convention, Hyderabad</div>
              </div>
            </div>
          </div>
          <div className="border-t border-primary/25 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ISTA Digital Media. All rights reserved. | Celebrating medical excellence with dignity and respect.</p>
          </div>
        </div>
      </footer>

      {/* Sticky CTA Bar */}
      <div className="sticky-cta">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="text-sm">
              <div>🎟️ <span className="gold font-semibold">{tier.label}</span> — ₹{tier.amount.toLocaleString('en-IN')} <span className="text-xs text-muted-foreground">+ GST</span></div>
              <div className="text-xs text-muted-foreground">
                {tier.until ? (
                  <>Ends in <span className="gold font-semibold">{formatTime(tier.until - Date.now())}</span> <span className="text-xs">(Days:Hours:Minutes:Seconds IST)</span></>
                ) : (
                  <>Available now</>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gold-gradient text-primary-foreground" onClick={scrollToRegister}>Register</Button>
              <Button size="sm" variant="outline" onClick={openWhatsApp}>WhatsApp</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <Card className="relative w-full max-w-xl gold-border">
            <CardContent className="p-6">
              <button 
                className="absolute right-3 top-3 rounded-full p-2 hover:bg-white/5" 
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="gold-gradient px-3 py-2 rounded-xl text-primary-foreground">🎁</div>
                  <div>
                    <h3 className="text-xl font-bold gold">Inclusions — Premium Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Printed profile in the Anniversary Souvenir + digital feature + priority placement for early entries.
                    </p>
                  </div>
                </div>
                <ul className="grid md:grid-cols-2 gap-2 text-sm">
                  <li>✔ Premium design layout</li>
                  <li>✔ Editorial polish</li>
                  <li>✔ Digital promotion</li>
                  <li>✔ ISTA recognition badge</li>
                </ul>
                <Badge className="gold-pill block">
                  Register early to lock the lowest price & best placement.
                </Badge>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Maybe Later
                  </Button>
                  <Button type="button" onClick={scrollToRegister} className="gold-gradient text-primary-foreground">
                    Register Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}