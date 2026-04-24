'use client';

import { useState, useEffect, useRef } from 'react';

const PRICE_PER_SQFT = 0.2163;
const ROOF_MULTIPLIER = 1.25;

const SERVICES = [
  { name: 'House Power Wash', icon: '🏠' },
  { name: 'Exterior Window Cleaning', icon: '🪟' },
  { name: 'Front Walkway', icon: '🚶' },
  { name: 'Roof Wash', icon: '🏚️' },
  { name: '🥈 Silver Package', sub: 'House + Windows + Walkway — 10% off' },
  { name: '🥇 Gold Package', sub: 'All Services — 20% off' },
];

const WHY = [
  { title: 'Locally Owned & Operated', desc: 'Proudly serving Schaumburg, Rosemont, and surrounding communities.' },
  { title: 'Fully Insured', desc: 'Your property is in safe hands. We carry full liability insurance on every job.' },
  { title: 'Satisfaction Guaranteed', desc: "We don't leave until the job is done right — every time." },
];

declare global {
  interface Window { google: any; initGoogleMaps: () => void; }
}

export default function HomePage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', service: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [squareFootage, setSquareFootage] = useState<number | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [housePhoto, setHousePhoto] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const houseWashPrice = squareFootage ? Math.round(squareFootage * PRICE_PER_SQFT) : null;
  const roofWashPrice = houseWashPrice ? Math.round(houseWashPrice * ROOF_MULTIPLIER) : null;
  const silverPrice = houseWashPrice ? Math.round((houseWashPrice + 179 + 129) * 0.90) : null;
  const goldPrice = (houseWashPrice && roofWashPrice) ? Math.round((houseWashPrice + 179 + 129 + roofWashPrice) * 0.80) : null;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    function setupAutocomplete() {
      if (!addressInputRef.current || autocompleteRef.current) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { types: ['address'], componentRestrictions: { country: 'us' } }
      );
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        const addr = place.formatted_address || '';
        if (addr) { setForm(prev => ({ ...prev, address: addr, service: '' })); handleAddressSelected(addr); }
      });
    }
    if (window.google?.maps?.places) { setupAutocomplete(); }
    else if (!document.getElementById('gmaps-script')) {
      window.initGoogleMaps = setupAutocomplete;
      const script = document.createElement('script');
      script.id = 'gmaps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true; script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  async function handleAddressSelected(address: string) {
    setAddressConfirmed(true); setLoadingProperty(true); setSquareFootage(null); setHousePhoto('');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) setHousePhoto(`https://maps.googleapis.com/maps/api/streetview?size=700x350&location=${encodeURIComponent(address)}&key=${apiKey}`);
    try {
      const res = await fetch(`/api/property?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.found && data.squareFootage) setSquareFootage(data.squareFootage);
    } catch { /* default prices remain */ }
    setLoadingProperty(false);
  }

  function scrollToForm() { document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, squareFootage }) });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setError('Something went wrong. Please try again or call us directly.');
    } catch { setError('Something went wrong. Please try again or call us directly.'); }
    setSubmitting(false);
  }

  function fmt(n: number) { return '$' + n.toLocaleString(); }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-[#0D1B4B] sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Rolling Suds" className="h-12 w-auto" />
          <button onClick={scrollToForm} className="bg-[#D4A017] hover:bg-[#b8891a] text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-md">
            Get a Free Quote
          </button>
        </div>
      </nav>

      {/* Hero — full bleed photo */}
      <section className="relative min-h-[580px] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photo-hero.png" alt="Rolling Suds at work" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0D1B4B]/70" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white py-24">
          <p className="text-[#D4A017] font-semibold text-sm uppercase tracking-widest mb-3">Schaumburg &amp; Rosemont</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight drop-shadow-lg">
            Professional Power Washing for Your Home
          </h1>
          <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
            Rolling Suds of Schaumburg - Rosemont keeps your home looking its best — guaranteed.
          </p>
          <button onClick={scrollToForm} className="bg-[#D4A017] hover:bg-[#b8891a] text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors shadow-xl">
            Get Your Free Quote
          </button>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-16 px-4 bg-[#0D1B4B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">See the Difference</h2>
          <p className="text-gray-400 text-sm mb-8">Real results from our team — before and after a single visit</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photo-before-after.jpg" alt="Before and after power washing" className="w-full rounded-2xl shadow-2xl max-w-2xl mx-auto" />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0D1B4B] mb-10">Why Choose Rolling Suds?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY.map((item) => (
              <div key={item.title} className="p-6 border border-gray-200 rounded-xl text-center">
                <div className="w-10 h-1 bg-[#D4A017] mx-auto mb-4 rounded" />
                <h3 className="text-base font-bold text-[#0D1B4B] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="py-20 px-4 bg-[#0D1B4B]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Get Your Free Quote</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Enter your address for an instant price estimate based on your home&apos;s size.</p>

          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-10 text-center">
              <p className="text-green-400 text-2xl font-bold mb-3">Thank you!</p>
              <p className="text-gray-300">We&apos;ve received your request and will reach out to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">First Name *</label>
                  <input required type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Last Name *</label>
                  <input required type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Phone Number *</label>
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Street Address *</label>
                <input ref={addressInputRef} required type="text" id="address-input" value={form.address}
                  onChange={(e) => { setForm({ ...form, address: e.target.value }); if (addressConfirmed) { setAddressConfirmed(false); setHousePhoto(''); setSquareFootage(null); } }}
                  placeholder="Start typing your address..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A017] transition-colors" />
                {!addressConfirmed && form.address.length === 0 && (
                  <p className="text-gray-500 text-xs mt-1">Select your address from the dropdown to get accurate pricing</p>
                )}
              </div>

              {/* House photo + property info */}
              {(housePhoto || loadingProperty) && (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {housePhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={housePhoto} alt="Your home" className="w-full object-cover" style={{ maxHeight: '220px' }} />
                  )}
                  <div className="bg-white/5 px-4 py-3">
                    {loadingProperty ? (
                      <p className="text-gray-400 text-sm">Looking up property data...</p>
                    ) : squareFootage ? (
                      <p className="text-gray-300 text-sm"><span className="text-white font-semibold">{squareFootage.toLocaleString()} sq ft</span> home detected — prices calculated below</p>
                    ) : (
                      <p className="text-gray-500 text-sm">Property size not found — showing standard prices</p>
                    )}
                  </div>
                </div>
              )}

              {/* Service selection — only shown after address confirmed */}
              {addressConfirmed && !loadingProperty && (
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Select Your Service *</label>
                  <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full bg-[#1a2d5a] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors">
                    <option value="" disabled>Choose a service...</option>
                    <option value={`House Power Wash - ${houseWashPrice ? fmt(houseWashPrice) : '$349'}`}>House Power Wash — {houseWashPrice ? fmt(houseWashPrice) : '$349'}</option>
                    <option value="Exterior Window Cleaning - $179">Exterior Window Cleaning — $179</option>
                    <option value="Front Walkway - $129">Front Walkway — $129</option>
                    <option value={`Roof Wash - ${roofWashPrice ? fmt(roofWashPrice) : '$399'}`}>Roof Wash — {roofWashPrice ? fmt(roofWashPrice) : '$399'}</option>
                    <option value={`Silver Package - ${silverPrice ? fmt(silverPrice) : 'save 10%'}`}>🥈 Silver Package — House, Windows &amp; Walkway {silverPrice ? `— ${fmt(silverPrice)} (10% off!)` : '— 10% off'}</option>
                    <option value={`Gold Package - ${goldPrice ? fmt(goldPrice) : 'save 20%'}`}>🥇 Gold Package — All Services {goldPrice ? `— ${fmt(goldPrice)} (20% off!)` : '— 20% off'}</option>
                  </select>
                  {squareFootage && <p className="text-[#D4A017] text-xs mt-1">Prices calculated for your {squareFootage.toLocaleString()} sq ft home at ${PRICE_PER_SQFT}/sq ft</p>}
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {addressConfirmed && !loadingProperty && (
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#D4A017] hover:bg-[#b8891a] text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 shadow-lg mt-2">
                  {submitting ? 'Sending...' : 'Submit Request'}
                </button>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060f28] text-gray-400 py-10 px-4 text-center text-sm">
        <p className="font-semibold text-white text-base mb-1">Rolling Suds of Schaumburg - Rosemont</p>
        <p>Serving Schaumburg, Rosemont, and surrounding communities</p>
        <p className="mt-4 text-gray-600 text-xs">© {new Date().getFullYear()} Rolling Suds. All rights reserved.</p>
      </footer>

    </div>
  );
}
