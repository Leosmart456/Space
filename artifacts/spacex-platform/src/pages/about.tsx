import { useLocation } from "wouter";
import { motion } from "framer-motion";
import logoSrc from "@assets/xpsca_1778445100452.png";
import SiteNav from "@/components/site-nav";

function SpaceXLogo({ className }: { className?: string }) {
  return <img src={logoSrc} alt="SpaceX" className={className} />;
}

const milestones = [
  { year: "2002", event: "SpaceX founded by Elon Musk with $100M of his own capital." },
  { year: "2008", event: "Falcon 1 becomes first privately developed liquid-fueled rocket to reach orbit." },
  { year: "2012", event: "Dragon becomes first commercial spacecraft to berth with the ISS." },
  { year: "2015", event: "Falcon 9 first stage successfully lands for the first time." },
  { year: "2018", event: "Falcon Heavy launches — most powerful operational rocket in the world." },
  { year: "2020", event: "Crew Dragon carries NASA astronauts to the ISS — first crewed commercial mission." },
  { year: "2023", event: "Starship completes first integrated flight test. Starlink surpasses 1 million users." },
  { year: "2024", event: "Starship Super Heavy booster caught mid-air — largest rocket ever flown." },
];

const stats = [
  { value: "$350B+", label: "Estimated Valuation" },
  { value: "6,000+", label: "Starlink Satellites Deployed" },
  { value: "300+", label: "Successful Rocket Landings" },
  { value: "22+", label: "Years of Innovation" },
];

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteNav active="about" />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 md:px-16 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>About the platform</p>
          <h1
            className="text-white font-black text-4xl md:text-7xl tracking-wide leading-none mb-8"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            INVESTING IN<br />THE IMPOSSIBLE
          </h1>
          <p className="text-white/50 text-lg max-w-2xl leading-relaxed">
            SpaceX Pre-IPO Investment Platform gives accredited investors exclusive access to equity in SpaceX — the most transformational aerospace company in history — before the public markets open.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-t border-b border-white/[0.06] py-16 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center md:text-left"
            >
              <div className="text-white font-black text-3xl md:text-4xl mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.value}</div>
              <div className="text-white/35 text-xs tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Our mission</p>
            <h2 className="text-white font-black text-3xl md:text-4xl tracking-wide mb-6" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              DEMOCRATIZING<br />ACCESS TO SPACE EQUITY
            </h2>
            <p className="text-white/50 leading-relaxed mb-4">
              For decades, ownership in companies like SpaceX was reserved for venture funds and institutional players. We changed that. SpaceX (SPCX) listed on Nasdaq on June 12, 2026 — and our platform connects verified accredited investors directly with SpaceX shares through regulated transactions.
            </p>
            <p className="text-white/50 leading-relaxed">
              Every investment is processed in full compliance with SEC Regulation D and applicable securities law. Our team of securities attorneys and investment professionals reviews every transaction before settlement.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>How it works</p>
            {[
              { step: "01", title: "Apply & Verify", desc: "Submit your accreditation details. Our team reviews your investor status within 24–48 hours." },
              { step: "02", title: "Fund Your Account", desc: "Wire your investment amount. Minimum $10,000 for direct share access." },
              { step: "03", title: "Receive Shares", desc: "SpaceX shares are transferred to your account via our regulated custodial process." },
              { step: "04", title: "Transfer to Brokerage", desc: "SpaceX is now publicly traded on Nasdaq (SPCX). Transfer your shares to your registered brokerage to trade on the open market." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 mb-8 last:mb-0">
                <div className="text-white/15 font-black text-2xl w-8 shrink-0 mt-0.5" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{item.step}</div>
                <div>
                  <div className="text-white text-sm font-bold tracking-widest uppercase mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{item.title}</div>
                  <div className="text-white/40 text-sm leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white/[0.02] border-t border-white/[0.06] py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>SpaceX milestones</p>
            <h2 className="text-white font-black text-3xl md:text-4xl tracking-wide mb-16" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>A RECORD OF THE EXTRAORDINARY</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-0">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-6 py-6 border-b border-white/[0.06]"
              >
                <div className="text-white/25 font-black text-sm w-12 shrink-0 pt-0.5" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{m.year}</div>
                <div className="text-white/55 text-sm leading-relaxed">{m.event}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-wide mb-6" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            READY TO INVEST?
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto">Apply now for accredited investor access to SpaceX shares — now publicly traded on Nasdaq under ticker SPCX.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/invest")}
              className="text-sm bg-white text-black font-black px-10 py-4 tracking-widest uppercase hover:bg-white/90 transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              Apply for Access
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="text-sm text-white/50 hover:text-white border border-white/20 hover:border-white/50 font-bold px-10 py-4 tracking-widest uppercase transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <SpaceXLogo className="h-10 w-auto opacity-40" />
          <p className="text-white/20 text-xs text-center">© {new Date().getFullYear()} SpaceX Pre-IPO Investment Platform. All rights reserved. Registered private securities platform operating under SEC Regulation D.</p>
        </div>
      </footer>
    </div>
  );
}
