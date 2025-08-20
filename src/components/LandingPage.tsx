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

const WHATSAPP_NUMBER = "919603494999";
const RZP_KEY = "YOUR_RAZORPAY_KEY_ID";

const DEADLINES = {
  early: Date.parse("2025-08-31T18:29:59Z"), // 23:59:59 IST
  std: Date.parse("2025-09-07T18:29:59Z"),
  last: Date.parse("2025-09-12T18:29:59Z"),
};

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

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-primary/25 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-lg gold-gradient text-primary-foreground font-black">I</div>
            <div>
              <div className="kicker">ISTA Digital Media</div>
              <div className="font-semibold">Doctors' Souvenir — Anniversary</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {['About', 'Pricing', 'Chief Guests', 'Doctors', 'Souvenir', 'Register', 'FAQ', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <Button className="gold-gradient text-primary-foreground">Register</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-padding backdrop-gold">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="kicker">Anniversary Edition 2025</div>
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
      <section id="about" className="section-padding">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold gold-glow">About ISTA Digital Media</h2>
          <p className="mt-3 text-muted-foreground">
            ISTA curates healthcare stories, campaigns, and impact-led publications that champion the medical fraternity. Our Doctors' Souvenir honors clinical excellence and builds public trust — a keepsake that celebrates your journey.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding">
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
                Ends in <span className="gold font-semibold">{tier.until ? formatTime(tier.until - Date.now()) : '—'}</span>
              </div>
            </div>
            <Button className="gold-gradient text-primary-foreground">Register at Current Price</Button>
          </Card>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="section-padding">
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
                  <div>📲 WhatsApp: <span className="gold font-semibold">+91 96034 94999</span></div>
                  <div>✉️ Email: info@istadigitalmedia.com</div>
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
      <section id="chief-guests" className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold gold-glow text-center mb-8">Previous Chief Guests</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="gold-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold gold">Governor of Telangana</h3>
                <p className="mt-3 text-muted-foreground italic">
                  "ISTA has consistently created a platform where the medical fraternity feels celebrated. In a world where doctors often work behind the scenes, ISTA reminds us that they are the true heroes shaping society."
                </p>
              </CardContent>
            </Card>
            <Card className="gold-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold gold">Health Minister of Telangana</h3>
                <p className="mt-3 text-muted-foreground italic">
                  "The healthcare community is the backbone of society, and ISTA understands this truth deeply. By organizing these celebrations year after year, ISTA has helped build a culture of gratitude in our communities."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="section-padding">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold gold-glow text-center mb-8">Eminent Doctors Participating</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="gold-border">
                <CardContent className="p-6">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-3 gold-border">
                    <img 
                      src={`https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=450&fit=crop&crop=face`} 
                      alt={`Doctor ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">Dr. Name {i} — Speciality</h3>
                  <p className="mt-2 text-muted-foreground italic text-sm">
                    "ISTA's events are more than ceremonies; they are heartfelt experiences where doctors feel seen, valued, and uplifted."
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
                <p className="text-muted-foreground mt-1">+91 96034 94999</p>
              </CardContent>
            </Card>
            <Card className="gold-border">
              <CardContent className="p-4">
                <h4 className="font-semibold gold">Email</h4>
                <p className="text-muted-foreground mt-1">info@istadigitalmedia.com</p>
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
          ends in <span className="gold font-semibold">{tier.until ? formatTime(tier.until - Date.now()) : '—'}</span>
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