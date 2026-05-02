'use client';

import { useState, useEffect, useRef } from 'react';

const PRICE_PER_SQFT = 0.2163;
const ROOF_MULTIPLIER = 1.25;
const ADDRESS_LIMIT = 2;
const SESSION_KEY = 'rs_addr_count';

const WHY = [
  { title: 'Locally Owned & Operated', desc: 'Proudly serving Schaumburg, Rosemont, and surrounding communities.' },
  { title: 'Fully Insured', desc: 'Your property is in safe hands. We carry full liability insurance on every job.' },
  { title: 'Satisfaction Guaranteed', desc: "We don't leave until the job is done right — every time." },
];

declare global {
  interface Window { google: any; initGoogleMaps: () => void; }
}

type ServiceKey = 'house' | 'windows' | 'walkway' | 'roof';

const GALLERY = [
  '/photo-before-after.jpg',
  '/ba-1.png',
  '/ba-2.png',
  '/ba-3.png',
  '/ba-4.png',
  '/ba-5.png',
];

export default function HomePage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', notes: '' });
  const [selectedServices, setSelectedServices] = useState<Set<ServiceKey>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [squareFootage, setSquareFootage] = useState<number | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [housePhoto, setHousePhoto] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reviews, setReviews] = useState<{ author: string; rating: number; text: string; time: string }[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Lead capture state
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [hasSelectedServices, setHasSelectedServices] = useState(false);
  const [confirmedAddresses, setConfirmedAddresses] = useState<string[]>([]);
  const [addressLimitReached, setAddressLimitReached] = useState(false);
  const [driveMinutes, setDriveMinutes] = useState<number | null>(null);

  const housePrice = squareFootage ? Math.round(squareFootage * PRICE_PER_SQFT) : 349;
  const roofPrice = Math.round(housePrice * ROOF_MULTIPLIER);
  const windowsPrice = 179;
  const walkwayPrice = 129;

  // Distance surcharge: $30 flat + $2/min past 45
  const driveSurcharge = driveMinutes !== null && driveMinutes > 45
    ? 30 + 2 * (driveMinutes - 45)
    : 0;
  // Under $100 → bake silently into service price; $100+ → show as separate line item
  const surchargeVisible = driveSurcharge >= 100;

  const BASE_OPTIONS = [
    { key: 'house' as ServiceKey,   name: 'House Power Wash',          price: housePrice },
    { key: 'windows' as ServiceKey, name: 'Exterior Window Cleaning',  price: windowsPrice },
    { key: 'walkway' as ServiceKey, name: 'Front Walkway',             price: walkwayPrice },
    { key: 'roof' as ServiceKey,    name: 'Roof Wash',                 price: roofPrice },
  ];
  const surchargeKey: ServiceKey = selectedServices.has('house')
    ? 'house'
    : (BASE_OPTIONS.filter(s => selectedServices.has(s.key)).sort((a, b) => b.price - a.price)[0]?.key ?? 'house');

  const SERVICE_OPTIONS: { key: ServiceKey; name: string; price: number }[] = BASE_OPTIONS.map(s => ({
    ...s,
    price: !surchargeVisible && s.key === surchargeKey ? s.price + driveSurcharge : s.price,
  }));

  const count = selectedServices.size;
  const isPlatinum = count === 4;
  const isGold     = count === 3;
  const isSilver   = count === 2;

  const discount = isPlatinum ? 0.80 : isGold ? 0.90 : isSilver ? 0.95 : 1.0;
  const baseTotal = SERVICE_OPTIONS.filter(s => selectedServices.has(s.key)).reduce((sum, s) => sum + s.price, 0);
  const discountedServices = Math.round(baseTotal * discount);
  const totalPrice = discountedServices + (surchargeVisible && selectedServices.size > 0 ? driveSurcharge : 0);
  const savings = baseTotal - discountedServices;

  const packageLabel = isPlatinum ? '💎 Platinum Package — 20% off applied!'
    : isGold     ? '🥇 Gold Package — 10% off applied!'
    : isSilver   ? '🥈 Silver Package — 5% off applied!'
    : null;

  const upsellMsg = isPlatinum ? null
    : isGold     ? '➕ Add 1 more service to unlock 20% off — Platinum!'
    : isSilver   ? '➕ Add 1 more service to unlock 10% off — Gold!'
    : count === 1 ? '➕ Add 1 more service to unlock 5% off — Silver!'
    : null;

  const accentColor = isPlatinum ? '#8EC8DC' : isGold ? '#D4A017' : '#B8B8C0';
  const bannerBg    = isPlatinum ? 'rgba(18,50,70,0.50)'      : isGold ? 'rgba(212,160,23,0.15)'  : 'rgba(184,184,192,0.10)';
  const bannerBord  = isPlatinum ? 'rgba(142,200,220,0.50)'   : isGold ? 'rgba(212,160,23,0.40)'  : 'rgba(184,184,192,0.30)';
  const platGrad: React.CSSProperties = isPlatinum
    ? { background: 'linear-gradient(90deg,#7BBDD4,#D0ECF7,#9AC8DC,#D0ECF7,#7BBDD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
    : { color: accentColor };

  // Keep a ref with latest lead data so beforeunload always reads fresh values
  const leadDataRef = useRef({
    form,
    confirmedAddresses,
    services: [] as { name: string; price: number }[],
    total: 0,
    packageName: null as string | null,
    hasSelectedServices,
    quoteSubmitted,
  });
  leadDataRef.current = {
    form,
    confirmedAddresses,
    services: SERVICE_OPTIONS.filter(s => selectedServices.has(s.key)).map(s => ({ name: s.name, price: s.price })),
    total: totalPrice,
    packageName: isPlatinum ? 'Platinum Package' : isGold ? 'Gold Package' : isSilver ? 'Silver Package' : null,
    hasSelectedServices,
    quoteSubmitted,
  };

  // Send lead capture email when user leaves without submitting a quote
  useEffect(() => {
    const handleBeforeUnload = () => {
      const d = leadDataRef.current;
      if (!d.hasSelectedServices || d.quoteSubmitted) return;
      const payload = JSON.stringify({
        firstName: d.form.firstName,
        lastName: d.form.lastName,
        email: d.form.email,
        phone: d.form.phone,
        addresses: d.confirmedAddresses,
        services: d.services,
        total: d.total,
        packageName: d.packageName,
      });
      navigator.sendBeacon('/api/lead', new Blob([payload], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Clear address warning once all required contact fields are filled
  useEffect(() => {
    if (form.firstName && form.lastName && form.email && form.phone) {
      setShowAddressWarning(false);
    }
  }, [form.firstName, form.lastName, form.email, form.phone]);

  function galleryNav(dir: 1 | -1) {
    setGalleryIndex(i => (i + dir + GALLERY.length) % GALLERY.length);
    if (galleryTimer.current) clearTimeout(galleryTimer.current);
    galleryTimer.current = setTimeout(() => setGalleryIndex(i => (i + 1) % GALLERY.length), 5000);
  }

  useEffect(() => {
    galleryTimer.current = setTimeout(function tick() {
      setGalleryIndex(i => (i + 1) % GALLERY.length);
      galleryTimer.current = setTimeout(tick, 5000);
    }, 5000);
    return () => { if (galleryTimer.current) clearTimeout(galleryTimer.current); };
  }, []);

  useEffect(() => {
    fetch('/api/reviews').then(r => r.json()).then(d => {
      if (d.reviews?.length) setReviews(d.reviews);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!reviews.length) return;
    reviewTimer.current = setTimeout(function tick() {
      setReviewIndex(i => (i + 1) % reviews.length);
      reviewTimer.current = setTimeout(tick, 5000);
    }, 5000);
    return () => { if (reviewTimer.current) clearTimeout(reviewTimer.current); };
  }, [reviews]);

  function reviewNav(dir: 1 | -1) {
    setReviewIndex(i => (i + dir + reviews.length) % reviews.length);
    if (reviewTimer.current) clearTimeout(reviewTimer.current);
    reviewTimer.current = setTimeout(function tick() {
      setReviewIndex(i => (i + 1) % reviews.length);
      reviewTimer.current = setTimeout(tick, 5000);
    }, 5000);
  }

  function toggleService(key: ServiceKey) {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setHasSelectedServices(true);
  }

  function buildServiceString() {
    const names = SERVICE_OPTIONS.filter(s => selectedServices.has(s.key)).map(s => s.name).join(', ');
    const pkg = isPlatinum ? 'Platinum Package (20% off)' : isGold ? 'Gold Package (10% off)' : isSilver ? 'Silver Package (5% off)' : '';
    return pkg ? `${pkg}: ${names} — $${totalPrice.toLocaleString()}` : `${names} — $${totalPrice.toLocaleString()}`;
  }

  // Read DOM values directly so browser autofill (which skips React onChange) is handled correctly
  function contactInfoFilled() {
    const fn = firstNameRef.current?.value || form.firstName;
    const ln = lastNameRef.current?.value || form.lastName;
    const em = emailRef.current?.value || form.email;
    const ph = phoneRef.current?.value || form.phone;
    return !!(fn && ln && em && ph);
  }

  // Sync autofilled DOM values into React state so the rest of the form stays consistent
  function syncAutofill() {
    setForm(prev => ({
      ...prev,
      firstName: firstNameRef.current?.value || prev.firstName,
      lastName: lastNameRef.current?.value || prev.lastName,
      email: emailRef.current?.value || prev.email,
      phone: phoneRef.current?.value || prev.phone,
    }));
  }

  function handleAddressFocus() {
    syncAutofill();
    if (!contactInfoFilled()) {
      setShowAddressWarning(true);
    }
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    function setupAutocomplete() {
      if (!addressInputRef.current || autocompleteRef.current) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current, { types: ['address'], componentRestrictions: { country: 'us' } }
      );
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        const addr = place.formatted_address || '';
        if (addr) { setForm(prev => ({ ...prev, address: addr })); handleAddressSelected(addr); }
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

  function notifyMultiProperty(addresses: string[]) {
    const { firstName, lastName, email, phone } = form;
    if (!firstName && !email && !phone) return; // nothing to send
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, phone, addresses, services: [], total: 0, isMultiProperty: true }),
    }).catch(() => {});
  }

  async function handleAddressSelected(address: string) {
    // Require contact info before any API calls (check DOM values to handle browser autofill)
    syncAutofill();
    if (!contactInfoFilled()) {
      setShowAddressWarning(true);
      setForm(prev => ({ ...prev, address: '' }));
      return;
    }

    // Client-side address limit check
    const currentCount = parseInt(sessionStorage.getItem(SESSION_KEY) || '0');
    if (currentCount >= ADDRESS_LIMIT) {
      setAddressLimitReached(true);
      notifyMultiProperty([...confirmedAddresses, address]);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, String(currentCount + 1));

    setConfirmedAddresses(prev => [...prev, address]);
    setAddressConfirmed(true);
    setLoadingProperty(true);
    setSquareFootage(null);
    setHousePhoto('');
    setSelectedServices(new Set());
    setDriveMinutes(null);

    // Silently calculate drive time from warehouse for distance surcharge
    if (window.google?.maps) {
      const svc = new window.google.maps.DistanceMatrixService();
      svc.getDistanceMatrix(
        { origins: ['142 Eisenhower Ln S, Lombard IL 60148'], destinations: [address], travelMode: window.google.maps.TravelMode.DRIVING },
        (response: any, status: any) => {
          if (status === 'OK') {
            const mins = Math.round(response.rows[0].elements[0].duration.value / 60);
            setDriveMinutes(mins);
          }
        }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) setHousePhoto(`https://maps.googleapis.com/maps/api/streetview?size=700x350&location=${encodeURIComponent(address)}&key=${apiKey}`);
    try {
      const res = await fetch(`/api/property?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.limitReached) {
        setAddressLimitReached(true);
        setAddressConfirmed(false);
        setHousePhoto('');
        setLoadingProperty(false);
        notifyMultiProperty([...confirmedAddresses, address]);
        return;
      }
      if (data.found && data.squareFootage) setSquareFootage(data.squareFootage);
    } catch { /* default prices remain */ }
    setLoadingProperty(false);
  }

  function scrollToForm() { document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address) {
      setError('Please fill in all fields above before submitting.'); return;
    }
    if (!addressConfirmed) { setError('Please select your address from the dropdown so we can look up your property.'); return; }
    if (selectedServices.size === 0) { setError('Please select at least one service.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          squareFootage,
          service: buildServiceString(),
          services: SERVICE_OPTIONS.filter(s => selectedServices.has(s.key)).map(s => ({ name: s.name, price: s.price })),
          baseTotal,
          total: totalPrice,
          savings,
          packageName: isPlatinum ? 'Platinum Package' : isGold ? 'Gold Package' : isSilver ? 'Silver Package' : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setQuoteSubmitted(true);
      } else {
        setError('Something went wrong. Please try again or call us directly.');
      }
    } catch { setError('Something went wrong. Please try again or call us directly.'); }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Hero */}
      <section className="relative min-h-[440px] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photo-hero.png" alt="Rolling Suds at work" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0D1B4B]/70" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white py-20">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-lg">Rolling Suds of Schaumburg – Rosemont</h1>
          <p className="text-[#D4A017] text-xl md:text-2xl font-semibold mb-3 drop-shadow">Get Your Instant Home Wash Quote</p>
          <p className="text-gray-200 text-base max-w-xl mx-auto">Fill in your info below and get a real price in seconds — no phone call needed.</p>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="py-20 px-4 bg-[#0D1B4B]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Get Your Free Quote</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Enter your information below for an instant price.</p>

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
                  <input ref={firstNameRef} required type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} onBlur={syncAutofill}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Last Name *</label>
                  <input ref={lastNameRef} required type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} onBlur={syncAutofill}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Email *</label>
                <input ref={emailRef} required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={syncAutofill}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Phone Number *</label>
                <input ref={phoneRef} required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={syncAutofill}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] transition-colors" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Street Address *</label>
                <input
                  ref={addressInputRef}
                  required
                  type="text"
                  id="address-input"
                  value={form.address}
                  onFocus={handleAddressFocus}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value });
                    if (addressConfirmed) { setAddressConfirmed(false); setHousePhoto(''); setSquareFootage(null); setSelectedServices(new Set()); }
                  }}
                  placeholder="Start typing your address..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A017] transition-colors"
                />
                {showAddressWarning && (
                  <p className="text-yellow-400 text-sm mt-2 leading-snug">
                    Almost there! Please fill in your name, email, and phone number first so we can build your personalized quote.
                  </p>
                )}
                {!showAddressWarning && !addressConfirmed && form.address.length > 0 && (
                  <p className="text-yellow-500 text-xs mt-1">Select your address from the dropdown to confirm it</p>
                )}
              </div>

              {/* Address limit reached message */}
              {addressLimitReached && (
                <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl text-center">
                  <p className="text-blue-300 font-semibold text-sm">Multiple properties? We&apos;ve got you covered!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    A member of our team will be reaching out to discuss your properties and put together the right package for you.
                  </p>
                </div>
              )}

              {!addressLimitReached && (housePhoto || loadingProperty) && (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {housePhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={housePhoto} alt="Your home" className="w-full object-cover" style={{ maxHeight: '220px' }} />
                  )}
                  <div className="bg-white/5 px-4 py-3">
                    {loadingProperty ? (
                      <p className="text-gray-400 text-sm">Looking up property data...</p>
                    ) : squareFootage ? (
                      <p className="text-gray-300 text-sm"><span className="text-white font-semibold">{squareFootage.toLocaleString()} sq ft</span> home — prices calculated below</p>
                    ) : (
                      <p className="text-gray-500 text-sm">Property size not found — showing standard prices</p>
                    )}
                  </div>
                </div>
              )}

              {!addressLimitReached && addressConfirmed && !loadingProperty && (
                <div>
                  <label className="block text-gray-300 text-sm mb-3">Select Services *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_OPTIONS.map((svc) => {
                      const selected = selectedServices.has(svc.key);
                      return (
                        <button key={svc.key} type="button" onClick={() => toggleService(svc.key)}
                          className="p-4 rounded-xl border-2 text-left transition-all"
                          style={selected
                            ? { borderColor: accentColor, backgroundColor: `${accentColor}22` }
                            : { borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <p className="font-semibold text-sm" style={{ color: selected ? accentColor : 'white' }}>{svc.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: selected ? `${accentColor}BB` : '#9ca3af' }}>${svc.price.toLocaleString()}</p>
                        </button>
                      );
                    })}
                  </div>

                  {packageLabel && (
                    <div className="mt-3 p-3 rounded-lg border text-center" style={{ background: bannerBg, borderColor: bannerBord }}>
                      <p className="font-bold text-sm" style={platGrad}>{packageLabel}</p>
                      {savings > 0 && <p className="text-xs mt-0.5" style={{ color: `${accentColor}AA` }}>You save ${savings.toLocaleString()}</p>}
                    </div>
                  )}

                  {upsellMsg && (
                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-xs" style={{ color: `${accentColor}99` }}>{upsellMsg}</p>
                    </div>
                  )}

                  {surchargeVisible && selectedServices.size > 0 && (
                    <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
                      <span className="text-xs text-amber-300">Distance charge — our warehouse is in Lombard, IL</span>
                      <span className="text-sm font-semibold text-amber-300">+${driveSurcharge.toLocaleString()}</span>
                    </div>
                  )}

                  {selectedServices.size > 0 && (
                    <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: `${accentColor}11`, borderColor: `${accentColor}33` }}>
                      <span className="text-sm" style={{ color: `${accentColor}CC` }}>{isPlatinum ? 'Platinum Package Total' : isGold ? 'Gold Package Total' : isSilver ? 'Silver Package Total' : `${selectedServices.size} service${selectedServices.size > 1 ? 's' : ''} selected`}</span>
                      <span className="font-bold text-lg" style={{ color: accentColor }}>${totalPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {!addressLimitReached && addressConfirmed && !loadingProperty && (
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Anything else? <span className="text-gray-500 font-normal">(optional)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="List any additional services you're interested in — gutter cleaning, limestone patio, etc. An estimator will call you with a free quote."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A017] transition-colors resize-none text-sm"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {!addressLimitReached && addressConfirmed && !loadingProperty && (
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#D4A017] hover:bg-[#b8891a] text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg disabled:opacity-60">
                  {submitting ? 'Sending...' : 'Send My Quote'}
                </button>
              )}

            </form>
          )}
        </div>
      </section>

      {/* Before / After carousel */}
      <section className="py-16 px-4 bg-[#0D1B4B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">See the Difference</h2>
          <p className="text-gray-400 text-sm mb-8">Real results from our team — before and after a single visit</p>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GALLERY[galleryIndex]} alt="Before and after power washing" className="w-full rounded-2xl shadow-2xl" style={{ maxHeight: '520px', objectFit: 'cover' }} />
            {/* Left arrow */}
            <button onClick={() => galleryNav(-1)} aria-label="Previous"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#0D1B4B]/80 hover:bg-[#D4A017] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors text-lg font-bold">
              ‹
            </button>
            {/* Right arrow */}
            <button onClick={() => galleryNav(1)} aria-label="Next"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#0D1B4B]/80 hover:bg-[#D4A017] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors text-lg font-bold">
              ›
            </button>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {GALLERY.map((_, i) => (
              <button key={i} onClick={() => galleryNav(i > galleryIndex ? 1 : -1)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i === galleryIndex ? '#D4A017' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
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

          {/* Google Reviews carousel */}
          {reviews.length > 0 && (
            <div className="mt-14">
              <p className="text-center text-sm font-semibold text-[#D4A017] uppercase tracking-widest mb-6">What Our Customers Say</p>
              <div className="relative max-w-2xl mx-auto">
                <div className="bg-[#0D1B4B] rounded-2xl px-8 py-8 text-center shadow-lg min-h-[200px] flex flex-col justify-between">
                  {/* Stars */}
                  <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: reviews[reviewIndex].rating }).map((_, i) => (
                      <span key={i} className="text-[#D4A017] text-lg">★</span>
                    ))}
                  </div>
                  {/* Review text */}
                  <p className="text-gray-200 text-sm leading-relaxed italic flex-1">&ldquo;{reviews[reviewIndex].text}&rdquo;</p>
                  {/* Author */}
                  <div className="mt-5">
                    <p className="text-white font-semibold text-sm">{reviews[reviewIndex].author}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{reviews[reviewIndex].time} · Google Review</p>
                  </div>
                </div>
                {/* Left arrow */}
                <button onClick={() => reviewNav(-1)} aria-label="Previous review"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 bg-white border border-gray-200 hover:bg-[#D4A017] hover:border-[#D4A017] hover:text-white text-[#0D1B4B] rounded-full w-10 h-10 flex items-center justify-center shadow transition-colors text-lg font-bold">
                  ‹
                </button>
                {/* Right arrow */}
                <button onClick={() => reviewNav(1)} aria-label="Next review"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 bg-white border border-gray-200 hover:bg-[#D4A017] hover:border-[#D4A017] hover:text-white text-[#0D1B4B] rounded-full w-10 h-10 flex items-center justify-center shadow transition-colors text-lg font-bold">
                  ›
                </button>
              </div>
              {/* Dots */}
              <div className="flex justify-center gap-2 mt-5">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => { setReviewIndex(i); if (reviewTimer.current) clearTimeout(reviewTimer.current); }}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: i === reviewIndex ? '#D4A017' : '#cbd5e1' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060f28] text-gray-400 py-10 px-4 text-center text-sm">
        <p className="font-semibold text-white text-base mb-1">Rolling Suds of Schaumburg - Rosemont</p>
        <p>Serving Schaumburg, Rosemont, and surrounding communities</p>

        {/* Social / profile links */}
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <a href="https://www.google.com/maps/place/?q=place_id:ChIJQUStiW2IAYQRuZZ9Ep1m3EQ"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-xs font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Google Business
          </a>
          <a href="https://www.instagram.com/rollingsuds81"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-xs font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
          <a href="https://www.facebook.com/rollingsudsschaumburgrosemont"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-gray-300 hover:text-white transition-colors text-xs font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>

        <p className="mt-6 text-gray-600 text-xs">© {new Date().getFullYear()} Rolling Suds. All rights reserved.</p>
      </footer>

    </div>
  );
}
