import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfUse() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/about")}
              data-testid="button-back"
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">Terms of Use</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-3xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Last Updated: November 6, 2025</p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-foreground mb-4">
              By accessing and using the Lumirra crypto wallet application ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
            <p className="text-foreground mb-4">
              Permission is granted to temporarily use Lumirra for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained in Lumirra</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">3. Wallet Security</h2>
            <p className="text-foreground mb-4">
              You are solely responsible for maintaining the security of your wallet credentials, including your password, recovery phrases, and private keys. Lumirra will never ask for your private keys or recovery phrases. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-2">
              <li>Loss of your credentials may result in permanent loss of access to your crypto assets</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>We cannot recover lost passwords or private keys</li>
              <li>You should never share your credentials with anyone</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">4. Cryptocurrency Risks</h2>
            <p className="text-foreground mb-4">
              You acknowledge and accept the risks associated with using cryptocurrency, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-2">
              <li>Volatility and fluctuations in cryptocurrency values</li>
              <li>Irreversible transactions - once sent, transactions cannot be reversed</li>
              <li>Regulatory changes that may affect cryptocurrency usage</li>
              <li>Potential security vulnerabilities in blockchain networks</li>
              <li>Loss of funds due to user error or network issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">5. Transaction Fees</h2>
            <p className="text-foreground mb-4">
              All cryptocurrency transactions require network fees (gas fees) that are paid to network validators, not to Lumirra. Transaction fees vary based on network congestion and your selected fee tier (Low, Middle, High). You are responsible for all transaction fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
            <p className="text-foreground mb-4">
              You agree not to use Lumirra for any unlawful purposes or in any way that could damage, disable, or impair the Service. Prohibited activities include:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-2">
              <li>Money laundering or terrorist financing</li>
              <li>Fraud or misrepresentation</li>
              <li>Violation of any applicable laws or regulations</li>
              <li>Hacking or unauthorized access attempts</li>
              <li>Distribution of malware or harmful code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">7. Disclaimer</h2>
            <p className="text-foreground mb-4">
              The materials on Lumirra are provided on an 'as is' basis. Lumirra makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">8. Limitations</h2>
            <p className="text-foreground mb-4">
              In no event shall Lumirra or its suppliers be liable for any damages (including, without limitation, damages for loss of data, loss of profit, or loss of cryptocurrency) arising out of the use or inability to use Lumirra, even if Lumirra or an authorized representative has been notified of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">9. Privacy Policy</h2>
            <p className="text-foreground mb-4">
              Your use of Lumirra is also governed by our Privacy Policy. We collect minimal data necessary to provide the Service and never sell your personal information to third parties. We do not have access to your private keys or recovery phrases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">10. Modifications</h2>
            <p className="text-foreground mb-4">
              Lumirra may revise these terms of use at any time without notice. By using this Service, you are agreeing to be bound by the then current version of these terms of use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-foreground mb-4">
              These terms and conditions are governed by and construed in accordance with applicable international cryptocurrency regulations and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
            <p className="text-foreground mb-4">
              If you have any questions about these Terms of Use, please contact us through the Support page in the app settings.
            </p>
          </section>

          <div className="mt-12 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              By continuing to use Lumirra, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
