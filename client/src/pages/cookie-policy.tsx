import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
const logoImage = "/lumirra-logo.png";

const cookieCategories = [
  {
    name: "Strictly Necessary",
    canDisable: false,
    description:
      "These are required for the wallet to function. They include encrypted wallet state, session tokens, and security flags. Without them the app cannot operate.",
    examples: [
      { name: "lumirra-wallet-*", purpose: "Encrypted wallet data (private keys never leave device)" },
      { name: "__lumirra_splash_date__", purpose: "Controls which splash screen variant is shown" },
      { name: "app-version", purpose: "Detects app updates and triggers cache refresh" },
    ],
  },
  {
    name: "Functional",
    canDisable: true,
    description:
      "These remember your preferences so you don't have to set them every visit.",
    examples: [
      { name: "theme", purpose: "Saves your chosen colour theme (dark / light)" },
      { name: "fiatCurrency", purpose: "Remembers your preferred display currency" },
      { name: "i18nextLng", purpose: "Saves your language preference" },
    ],
  },
  {
    name: "Analytics",
    canDisable: true,
    description:
      "These help us understand how people use Lumirra so we can improve it. No personally identifiable information is included.",
    examples: [
      { name: "lumirra-usage-*", purpose: "Aggregate feature-usage counters (no PII)" },
    ],
  },
];

export default function CookiePolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logoImage} alt="Lumirra" className="h-7 w-7" />
          <span className="font-semibold">Cookie Policy</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: April 6, 2026</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Lumirra uses browser storage technologies — primarily <strong className="text-foreground">localStorage</strong> and{" "}
            <strong className="text-foreground">sessionStorage</strong> — rather than traditional HTTP cookies.
            These technologies work the same way as cookies but are never transmitted to our servers in request headers.
            This page explains what we store, why, and how you can control it.
          </p>

          <div className="bg-[#1677FF]/5 border border-[#1677FF]/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note on terminology:</strong> Throughout this policy, when we say "cookies"
              we mean both traditional cookies and browser storage technologies (localStorage / sessionStorage) — unless
              we specifically distinguish between them.
            </p>
          </div>

          {cookieCategories.map((cat) => (
            <div key={cat.name} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{cat.name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cat.canDisable ? "bg-muted text-muted-foreground" : "bg-[#1677FF]/10 text-[#1677FF]"}`}>
                  {cat.canDisable ? "Optional" : "Always Active"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{cat.description}</p>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2.5 font-medium text-foreground w-1/2">Name / Pattern</th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.examples.map((ex, i) => (
                      <tr key={i} className={i < cat.examples.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ex.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ex.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Managing Your Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can update your cookie preferences at any time:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">In-app:</strong> Go to{" "}
                <button onClick={() => navigate("/settings")} className="text-[#1677FF] underline-offset-2 hover:underline">
                  Settings → Privacy & Cookies
                </button>{" "}
                to manage preferences or clear all site data.
              </li>
              <li>
                <strong className="text-foreground">Browser settings:</strong> You can clear localStorage through your browser's developer tools
                (DevTools → Application → Storage → Local Storage) or via your browser's privacy settings.
              </li>
              <li>
                <strong className="text-foreground">Note:</strong> Clearing necessary storage will log you out of the wallet. Your funds are safe — they remain on the blockchain — but you will need your seed phrase to restore access.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about this policy? Contact us at{" "}
              <a href="mailto:privacy@lumirra.app" className="text-[#1677FF] underline-offset-2 hover:underline">privacy@lumirra.app</a>{" "}
              or through the in-app{" "}
              <button onClick={() => navigate("/support-chat")} className="text-[#1677FF] underline-offset-2 hover:underline">
                support chat
              </button>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
