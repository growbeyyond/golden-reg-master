// Fixed Helmet issue - removed all references
import React, { useState, useEffect } from 'react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Types and Config
interface TierInfo {
  label: string;
  amount: number;
  until: number | null;
}

const WHATSAPP_NUMBER = "994899001";
const RZP_KEY = "YOUR_RAZORPAY_KEY_ID";

const DEADLINES = {
  early: Date.parse("2025-08-31T18:29:59Z"), // 23:59:59 IST
  std: Date.parse("2025-09-07T18:29:59Z"),
  last: Date.parse("2025-09-12T18:29:59Z"),
};

const CHIEF_GUESTS = [
  {
    name: "Sri. Damodar Rajanarasimha Garu",
    designation: "Health Minister of Telangana",
    image: "/lovable-uploads/632d5279-ccad-4a29-a60d-cfcea9b52d67.png",
    quote: "ISTA has consistently created a platform where the medical fraternity feels celebrated and recognized for their selfless service to humanity."
  },
  {
    name: "Sri. Jishnu Dev Varma Garu", 
    designation: "Governor of Telangana",
    image: "/lovable-uploads/07095247-9d5e-4433-aa60-1b2377dc2836.png",
    quote: "The noble work of ISTA in honoring our healthcare heroes deserves appreciation from every section of society."
  },
  {
    name: "Sri. V. V. Lakshminarayana Garu",
    designation: "Ex CBI Joint Director, Agriculturist, Social worker", 
    image: "/lovable-uploads/1c0d8019-a6fd-402d-9278-8fa452533b98.png",
    quote: "Through ISTA's initiatives, we witness the true spirit of recognizing those who dedicate their lives to healing others."
  },
  {
    name: "Sri. Madavaneni Raghunandan Rao Garu",
    designation: "Member of Parliament Medak constituency",
    image: "/lovable-uploads/af60150e-f4be-4cc5-a06e-be8e25dd77c2.png", 
    quote: "ISTA's commitment to celebrating medical excellence sets a benchmark for honoring our healthcare professionals."
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
    name: "Dr Gopala Krishna Gokhale",
    image: "/lovable-uploads/742f39e6-a38a-46f8-aa50-454ea741cecb.png",
    quote: "ISTA transforms our profession by celebrating the human stories behind medical excellence. Every doctor deserves recognition for their dedication and sacrifice. This platform beautifully captures our journey and inspires the next generation of healers."
  },
  {
    name: "Dr Seetharam Buddavarapu", 
    image: "/lovable-uploads/394f9d24-dbec-4251-9b86-ceeb9e6828b6.png",
    quote: "Through ISTA, I've witnessed doctors rediscover their passion for medicine. The organization doesn't just honor achievements—it honors the heart of healing. Every event reminds us why we chose this noble calling."
  },
  {
    name: "Dr Vani Veggalam",
    image: "/lovable-uploads/2b9d7883-3862-4486-bce7-70db71356803.png",
    quote: "ISTA creates a sanctuary where doctors can share their vulnerabilities and victories. In a profession where we give so much, this platform gives back by amplifying our voices and celebrating our humanity."
  },
  {
    name: "Dr Samatha Tulla",
    image: "/lovable-uploads/093f66d8-5797-4c86-84f0-0080686b193d.png",
    quote: "What sets ISTA apart is its genuine understanding of a doctor's journey. Beyond the clinical expertise, they recognize our emotional investment in every patient. This recognition fuels our commitment to excellence."
  },
  {
    name: "Dr Hari Cherukuri", 
    image: "/lovable-uploads/a35c7add-a4ef-45c4-88ad-22365b3fb10b.png",
    quote: "ISTA doesn't just organize events—they create transformative experiences. Every gathering becomes a moment of reflection, growth, and renewed purpose. The impact extends far beyond the ceremony itself."
  },
  {
    name: "Dr Rajeswari",
    image: "/lovable-uploads/078624d0-1590-441b-a3e7-ce664db05e34.png",
    quote: "In my years of practice, I've rarely found a platform that truly understands doctors. ISTA bridges the gap between our professional achievements and personal stories, creating a legacy worth preserving."
  },
  {
    name: "Dr Manjula Anagani",
    image: "/lovable-uploads/b0f5d108-2c60-46d7-ba9c-7453ace41049.png",
    quote: "ISTA's approach to celebrating doctors is refreshingly authentic. They don't just showcase our degrees—they honor our dedication, our sleepless nights, and our unwavering commitment to saving lives."
  }
];

// Utility functions
const formatTime = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const getActiveTier = (ts = Date.now()): TierInfo => {
  if (ts <= DEADLINES.early) return { label: "Early Bird", amount: 5000, until: DEADLINES.early };
  if (ts <= DEADLINES.std) return { label: "Standard", amount: 10000, until: DEADLINES.std };
  if (ts <= DEADLINES.last) return { label: "Last Chance", amount: 15000, until: DEADLINES.last };
  return { label: "Final/On-spot", amount: 15000, until: null };
};

const openWhatsApp = () => {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
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

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setTier(getActiveTier());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Razorpay Integration
  const handlePayment = () => {
    const options = {
      key: RZP_KEY,
      amount: tier.amount * 100,
      currency: "INR",
      name: "ISTA Doctors' Souvenir",
      description: tier.label,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone
      },
      notes: {
        Tier: tier.label,
        City: formData.city,
        Speciality: formData.speciality,
        Timestamp: new Date().toISOString()
      },
      theme: { color: "#d4af37" },
      handler: function (response: any) {
        alert("Payment successful! Reference: " + response.razorpay_payment_id);
      }
    };
    // @ts-ignore
    new Razorpay(options).open();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) {
      alert("Please agree to the terms.");
      return;
    }
    handlePayment();
  };

  return (
    <>

      {/* Hero Section */}
      <section className="section-padding backdrop-gold">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex flex-col items-center md:items-start mb-8">
              <img 
                src="/lovable-uploads/194fa210-fce3-44f0-bd3d-d40dc04ab21c.png" 
                alt="ISTA Media Logo" 
                className="h-24 md:h-32 w-auto mb-4 logo-spotlight"
              />
              <div className="kicker text-center md:text-left">Anniversary Edition 2025</div>
            </div>
            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold gold-glow">
              Celebrating the Heroes in White Coats
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Be featured in the prestigious Doctors' Souvenir by ISTA Digital Media. A black-and-gold cinematic edition that honors your journey and amplifies your impact.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="gold-pill">📍 JRC Convention, Hyderabad</Badge>
              <Badge variant="outline" className="gold-pill">🗓️ Sunday, 14 Sept 2025</Badge>
              <Badge variant="outline" className="gold-pill">⏰ 6:00 PM onwards</Badge>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="gold-gradient text-primary-foreground" size="lg">Register Now</Button>
              <Button variant="outline" size="lg" onClick={() => setShowModal(true)}>
                What's Included
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Limited slots. Instant confirmation after payment.
            </p>
          </div>
          <div className="relative">
            <Card className="gold-border p-6 bg-gradient-to-br from-primary/10 to-black/60">
              <CardContent className="p-0">
                <p className="text-2xl font-semibold mb-2 gold-glow">Be immortalized in print</p>
                <p className="text-muted-foreground">
                  Your profile appears in the Anniversary Souvenir distributed across partner hospitals and digital channels — designed in a premium black & gold aesthetic.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Badge className="gold-pill">Premium Profile</Badge>
                  <Badge className="gold-pill">ISTA Recognition</Badge>
                  <Badge className="gold-pill">Digital Feature</Badge>
                </div>
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

      {/* Pricing Section */}
      <section id="pricing" className="section-padding section-bg">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Limited-Time Offer Pricing</h2>
            <p className="text-muted-foreground">Auto-updates by date (IST). Pay securely via Razorpay.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="gold-border bg-card/50">
              <CardContent className="p-6">
                <div className="kicker mb-2">Till Aug 31</div>
                <div className="text-4xl font-extrabold">₹5,000</div>
                <p className="mt-2 text-sm text-muted-foreground">Early Bird — ends Aug 31, 23:59 IST</p>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50">
              <CardContent className="p-6">
                <div className="kicker mb-2">Sep 1 – Sep 7</div>
                <div className="text-4xl font-extrabold">₹10,000</div>
                <p className="mt-2 text-sm text-muted-foreground">Standard — ends Sep 7, 23:59 IST</p>
              </CardContent>
            </Card>
            <Card className="gold-border bg-card/50">
              <CardContent className="p-6">
                <div className="kicker mb-2">Sep 8 – Sep 12</div>
                <div className="text-4xl font-extrabold">₹15,000</div>
                <p className="mt-2 text-sm text-muted-foreground">Last Chance — ends Sep 12, 23:59 IST</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 gold-border p-5 flex items-center justify-between gap-4 flex-col md:flex-row">
            <div className="text-sm">
              <div>🎟️ Current Tier: <span className="gold font-semibold">{tier.label}</span></div>
              <div>
                Price: <span className="gold font-semibold">₹{tier.amount.toLocaleString('en-IN')}</span> • 
                Ends in <span className="gold font-semibold">{tier.until ? `${Math.ceil((tier.until - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 'Available now'}</span>
              </div>
            </div>
            <Button className="gold-gradient text-primary-foreground">Register at Current Price</Button>
          </Card>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="section-padding section-bg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gold-glow">Secure Your Spot</h2>
            <p className="text-muted-foreground">Fill your details. We'll confirm instantly after payment.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="gold-border">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Full Name (Doctor)</label>
                      <Input 
                        required 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Speciality</label>
                      <Input 
                        required 
                        value={formData.speciality}
                        onChange={(e) => setFormData({...formData, speciality: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Hospital / Clinic</label>
                      <Input 
                        value={formData.hospital}
                        onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">City</label>
                      <Input 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <Input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">WhatsApp Number</label>
                      <Input 
                        type="tel" 
                        required 
                        placeholder="10-digit"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="mt-1 bg-black/40 border-primary/35"
                      />
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
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button type="submit" className="gold-gradient text-primary-foreground">
                      Submit & Pay (Razorpay)
                    </Button>
                    <Button variant="outline" onClick={openWhatsApp}>
                      Chat on WhatsApp
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We respect your privacy. Data is never sold to third parties.
                  </p>
                </form>
              </CardContent>
            </Card>

            <Card className="gold-border">
              <CardContent className="p-6">
                <h3 className="font-semibold gold">Need help?</h3>
                <p className="text-muted-foreground mt-2">Message us on WhatsApp for instant assistance.</p>
                <div className="mt-3 text-sm space-y-1">
                  <div>📲 WhatsApp: <span className="gold font-semibold">+91 994899001</span></div>
                  <div>✉️ Email: istadigitalmedia@gmail.com</div>
                  <div>📍 Hyderabad, Telangana</div>
                </div>
                <Badge className="gold-pill mt-4 block">
                  Tip: Uploading your photo & bio early improves placement quality.
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Chief Guests */}
      <section id="chief-guests" className="section-padding section-bg">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gold-glow">Previous Chief Guests</h2>
            <p className="text-muted-foreground mt-3">Distinguished personalities who have honored our events with their presence</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHIEF_GUESTS.map((guest, index) => (
              <Card key={index} className="gold-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={guest.image} 
                      alt={guest.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                    />
                    <div>
                      <h3 className="font-semibold gold text-sm">{guest.name}</h3>
                      <p className="text-xs text-muted-foreground">{guest.designation}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "{guest.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              <span className="gold font-semibold">Thank you</span> to all our distinguished guests for supporting healthcare excellence
            </p>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="section-padding section-bg">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold gold-glow text-center mb-8">Doctors about ISTA</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {DOCTORS.map((doctor, index) => (
              <Card key={index} className="gold-border">
                <CardContent className="p-6">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-4 gold-border">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-3">{doctor.name}</h3>
                  <p className="text-muted-foreground italic text-sm leading-relaxed">
                    "{doctor.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">Why Register</h2>
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <Badge className="gold-pill p-4">Premium profile in Souvenir</Badge>
            <Badge className="gold-pill p-4">Recognition among peers</Badge>
            <Badge className="gold-pill p-4">Digital amplification</Badge>
            <Badge className="gold-pill p-4">A legacy keepsake</Badge>
          </div>
        </div>
      </section>

      {/* Souvenir */}
      <section id="souvenir" className="section-padding">
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

      {/* Testimonials */}
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold gold-glow text-center">What Doctors Say</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="gold-border">
              <CardContent className="p-6">
                <p className="italic text-muted-foreground">
                  "ISTA makes doctors feel like stars. They look at the human behind the stethoscope — the person who sacrifices weekends and family moments."
                </p>
                <div className="mt-2 text-sm text-muted-foreground">— Dr. Namratha, Oncologist</div>
              </CardContent>
            </Card>
            <Card className="gold-border">
              <CardContent className="p-6">
                <p className="italic text-muted-foreground">
                  "I've attended many conferences, but ISTA's events stand apart. They're emotionally rich and thoughtfully curated."
                </p>
                <div className="mt-2 text-sm text-muted-foreground">— Dr. Ramesh, Orthopedic</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding">
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

      {/* Footer */}
      <footer className="section-padding border-t border-primary/25">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="gold-border">
              <CardContent className="p-4">
                <h4 className="font-semibold gold">Phone</h4>
                <p className="text-muted-foreground mt-1">+91 994899001</p>
              </CardContent>
            </Card>
            <Card className="gold-border">
              <CardContent className="p-4">
                <h4 className="font-semibold gold">Email</h4>
                <p className="text-muted-foreground mt-1">istadigitalmedia@gmail.com</p>
              </CardContent>
            </Card>
            <Card className="gold-border">
              <CardContent className="p-4">
                <h4 className="font-semibold gold">Venue</h4>
                <p className="text-muted-foreground mt-1">JRC Convention, Hyderabad</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 text-center text-muted-foreground text-sm">
            © 2025 ISTA Digital Media · All rights reserved
          </div>
        </div>
      </footer>

      {/* Sticky CTA */}
      <div className="sticky-cta px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          🎟️ <span className="gold font-semibold">{tier.label}</span> — 
          ₹<span className="gold font-semibold">{tier.amount.toLocaleString('en-IN')}</span> • 
          {tier.until ? `${Math.ceil((tier.until - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 'Available now'}
        </div>
        <div className="flex gap-2">
          <Button className="gold-gradient text-primary-foreground">Register</Button>
          <Button className="bg-[#25D366] text-black hover:bg-[#20c757]" onClick={openWhatsApp}>
            WhatsApp
          </Button>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <button className="whatsapp-fab" onClick={openWhatsApp}>
        WhatsApp
      </button>

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
                  <Button className="gold-gradient text-primary-foreground">
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