import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/Lumirra Logo Design (original)_1761875532047.png";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logoImage} alt="Lumirra" className="h-7 w-7" />
          <span className="font-semibold">Privacy Policy</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: April 6, 2026</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Lumirra is a self-custody crypto wallet. We are committed to protecting your privacy. This policy
            explains what data we collect, why we collect it, and how it is handled.
          </p>

          <Section title="1. Data We Collect">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Wallet data</strong> — Your encrypted private keys and seed phrases are stored locally on your device only. We never transmit or have access to them.</li>
              <li><strong className="text-foreground">Preferences</strong> — Theme, language, currency and display settings are stored locally in your browser (localStorage).</li>
              <li><strong className="text-foreground">Session data</strong> — Temporary session identifiers used to keep you logged in during a session (sessionStorage).</li>
              <li><strong className="text-foreground">Support messages</strong> — If you contact us via the in-app support chat, the content of your messages is stored on our servers to allow us to respond. No financial data is included.</li>
            </ul>
          </Section>

          <Section title="2. Data We Do Not Collect">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>We do not collect or store your private keys, seed phrases, or passwords on our servers.</li>
              <li>We do not sell or share your data with advertisers or third-party marketing companies.</li>
              <li>We do not track your on-chain activity.</li>
              <li>We do not use third-party analytics services that identify you personally.</li>
            </ul>
          </Section>

          <Section title="3. Local Storage & Cookies">
            <p className="text-muted-foreground leading-relaxed">
              Lumirra uses browser localStorage and sessionStorage — not traditional HTTP cookies — to store wallet state,
              user preferences, and session flags. These are stored only on your device and are never sent to our servers.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We may also use strictly necessary cookies for server-side session management when you contact our support team.
              See our <button onClick={() => navigate("/cookie-policy")} className="text-[#1677FF] underline-offset-2 hover:underline">Cookie Policy</button> for full details.
            </p>
          </Section>

          <Section title="4. Third-Party Services">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Blockchain networks</strong> — Transactions you sign are broadcast to public blockchain networks (Ethereum, BNB Chain, Solana, TRON). These are public by nature.</li>
              <li><strong className="text-foreground">Price data providers</strong> — We fetch public market price data. No personal identifiers are included in these requests.</li>
              <li><strong className="text-foreground">MoonPay (Buy/Sell)</strong> — If you use the Buy/Sell feature, you are redirected to MoonPay's platform. Their own privacy policy applies.</li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p className="text-muted-foreground leading-relaxed">
              All wallet data stored on your device is encrypted with AES-256 using a password you set. We use HTTPS for
              all network communication. We do not have access to your encryption password.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>You can delete all locally stored data at any time via <strong className="text-foreground">Settings → Site Data → Clear All Data</strong>.</li>
              <li>You can request deletion of any support chat messages by contacting us.</li>
              <li>You have the right to access, correct, or delete any personal data we hold about you.</li>
            </ul>
          </Section>

          <Section title="7. Children">
            <p className="text-muted-foreground leading-relaxed">
              Lumirra is not intended for users under the age of 18. We do not knowingly collect data from minors.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify you of significant changes within the app.
              Continued use of Lumirra after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="9. Contact Us">
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this policy, please contact us through the in-app support chat or at{" "}
              <a href="mailto:privacy@lumirra.app" className="text-[#1677FF] underline-offset-2 hover:underline">privacy@lumirra.app</a>.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
