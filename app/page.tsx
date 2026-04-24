'use client';

import { useState } from 'react';

const SERVICES = [
  { name: 'House Power Wash', price: 349 },
  { name: 'Exterior Window Cleaning', price: 199 },
  { name: 'Front Walkway', price: 129 },
  { name: 'Roof Wash', price: 399 },
  { name: 'Silver Property Package', price: 597, note: 'House Wash + Exterior Windows + Front Walkway — save $80' },
  { name: 'Full Property Package', price: 896, note: 'Silver + Roof Wash — save $180' },
];

const WHY = [
  { title: 'Locally Owned & Operated', desc: 'Proudly serving Schaumburg, Rosemont, and the surrounding communities.' },
  { title: 'Fully Insured', desc: 'Your property is in safe hands. We carry full liability insurance on every job.' },
  { title: 'Satisfaction Guaranteed', desc: "We don't leave until the job is done right — every time." },
];

export default function HomePage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', service: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function scrollToForm() {
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again or call us directly.');
      }
    } catch {
      setError('Something went wrong. Please try again or call us directly.');
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-[#0D1B4B] sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Rolling Suds" className="h-12 w-auto" />
          <button
            onClick={scrollToForm}
            className="bg-[#00A4C7] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#0090b0] transition-colors"
          >
            Get a Free Quote
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0D1B4B] text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#00A4C7] font-semibold text-sm uppercase tracking-widest mb-3">Schaumburg &amp; Rosemont</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Professional Power Washing for Your Home
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Rolling Suds of Schaumburg - Rosemont delivers expert residential power washing. We keep your home looking its best — guaranteed.
          </p>
          <button
            onClick={scrollToForm}
            className="bg-[#00A4C7] text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#0090b0] transition-colors shadow-lg"
          >
            Get Your Free Quote
          </button>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0D1B4B] mb-10">Why Choose Rolling Suds?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY.map((item) => (
              <div key={item.title} className="p-6 border border-gray-200 rounded-xl text-center">
                <div className="w-10 h-1 bg-[#00A4C7] mx-auto mb-4 rounded" />
                <h3 className="text-base font-bold text-[#0D1B4B] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0D1B4B] mb-2">Our Services</h2>
          <p className="text-center text-gray-500 text-sm mb-10">Prices shown before tax</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <div key={s.name} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="font-bold text-[#0D1B4B] text-base mb-1">{s.name}</p>
                {s.note && <p className="text-gray-400 text-xs mb-3 leading-relaxed">{s.note}</p>}
                <p className="text-[#00A4C7] font-bold text-2xl">${s.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="py-20 px-4 bg-[#0D1B4B]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Get Your Free Quote</h2>
          <p className="text-gray-400 text-center text-sm mb-10">Fill out the form and we&apos;ll be in touch shortly.</p>

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
                  <input
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Select Your Service *</label>
                <select
                  required
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full bg-[#1a2d5a] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00A4C7] transition-colors"
                >
                  <option value="" disabled>Choose a service...</option>
                  <option value="House Power Wash - $349">House Power Wash — $349</option>
                  <option value="Exterior Window Cleaning - $199">Exterior Window Cleaning — $199</option>
                  <option value="Front Walkway - $129">Front Walkway — $129</option>
                  <option value="Roof Wash - $399">Roof Wash — $399</option>
                  <option value="Silver Property Package - $597">Silver Property Package — $597 (save $80)</option>
                  <option value="Full Property Package - $896">Full Property Package — $896 (save $180)</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00A4C7] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#0090b0] transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? 'Sending...' : 'Submit Request'}
              </button>
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
