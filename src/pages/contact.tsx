import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import logoSrc from "@assets/xpsca_1778445100452.png";
import SiteNav from "@/components/site-nav";

function SpaceXLogo({ className }: { className?: string }) {
  return <img src={logoSrc} alt="SpaceX" className={className} />;
}

export default function ContactPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  const inputClass =
    "w-full bg-white/[0.03] border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-colors";

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteNav active="contact" />

      <div className="pt-40 pb-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left — info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Get in touch</p>
            <h1 className="text-white font-black text-4xl md:text-6xl tracking-wide leading-none mb-8" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              CONTACT<br />US
            </h1>
            <p className="text-white/45 leading-relaxed mb-12 max-w-md">
              Our investor relations team is available Monday through Friday, 9 AM – 6 PM MST. We typically respond within one business day.
            </p>

            <div className="space-y-8">
              {/* Phone */}
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/50">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white/30 text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Phone</div>
                  <a href="tel:+14809726080" className="text-white/70 hover:text-white transition-colors text-sm">+1 (480) 972-6080</a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/50">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <div className="text-white/30 text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Email</div>
                  <a href="mailto:reply@spacexrocket.space" className="text-white/70 hover:text-white transition-colors text-sm">reply@spacexrocket.space</a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/50">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="text-white/30 text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Hours</div>
                  <div className="text-white/70 text-sm">Mon – Fri, 9 AM – 6 PM MST</div>
                </div>
              </div>

              {/* Legal */}
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/50">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white/30 text-xs tracking-widest uppercase mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Compliance</div>
                  <div className="text-white/70 text-sm">SEC Regulation D · Accredited investors only</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 border border-white/20 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-white/70">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-white font-black text-2xl tracking-wide mb-3" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>MESSAGE SENT</h3>
                <p className="text-white/40 text-sm max-w-xs leading-relaxed">Our investor relations team will get back to you within one business day.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-8 text-xs text-white/40 hover:text-white tracking-widest uppercase transition-colors"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/30 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Smith" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-white/30 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-white/30 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Subject</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                    <option value="">Select a topic</option>
                    <option value="investment">Investment Inquiry</option>
                    <option value="accreditation">Accreditation Questions</option>
                    <option value="account">Account Support</option>
                    <option value="compliance">Compliance / Legal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/30 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className={inputClass + " resize-none"}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !form.name || !form.email || !form.message}
                  className="w-full bg-white text-black font-black py-4 text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-colors disabled:opacity-40"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {loading ? "Sending…" : "Send Message"}
                </button>
                <p className="text-white/20 text-xs text-center leading-relaxed pt-2">
                  By submitting this form you agree to be contacted by our investor relations team regarding your inquiry.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <SpaceXLogo className="h-10 w-auto opacity-40" />
          <p className="text-white/20 text-xs text-center">© {new Date().getFullYear()} SpaceX Pre-IPO Investment Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
