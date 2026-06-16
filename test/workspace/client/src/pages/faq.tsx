import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const [, setLocation] = useLocation();

  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "What is Lumirra and how does it work?",
          answer: "Lumirra is a self-custody, multi-chain cryptocurrency wallet that supports Ethereum, BNB Smart Chain, TRON, and Solana. Unlike centralized exchanges, you maintain full control of your private keys and assets. The wallet provides a unified interface to manage tokens across multiple blockchains, execute swaps, send/receive crypto, and buy digital assets with fiat currency."
        },
        {
          question: "How do I create a wallet?",
          answer: "Creating a wallet takes less than 2 minutes. Click 'Create Account' on the homepage, enter your email address, create a strong password (minimum 8 characters), and you're done. Your wallet is automatically generated with support for all four supported blockchains. You'll have immediate access to your dashboard where you can start managing your crypto assets."
        },
        {
          question: "What's the difference between Lumirra and a crypto exchange?",
          answer: "Crypto exchanges are custodial platforms where the exchange controls your private keys and assets. With Lumirra, you maintain full ownership and control. Your private keys never leave your device, and only you can access your funds. Additionally, Lumirra provides direct access to decentralized finance (DeFi) features like token swaps without needing to create exchange accounts or go through lengthy verification processes for basic operations."
        }
      ]
    },
    {
      category: "Security & Safety",
      questions: [
        {
          question: "How secure is Lumirra?",
          answer: "Lumirra implements military-grade AES-256 encryption for all sensitive data. Your private keys are encrypted with your password and stored securely on your device—we never have access to them. The wallet uses industry-standard cryptographic libraries and follows best practices for key derivation (BIP-39/BIP-44). Additionally, all connections use HTTPS/TLS encryption, and we never store unencrypted private keys or seed phrases on our servers."
        },
        {
          question: "What if I forget my password?",
          answer: "You can reset your password using the 'Forgot Password' link on the login page. You'll receive a verification code via email to confirm your identity before creating a new password. However, it's critical to understand that while you can reset your password, you cannot recover it if you lose access to your registered email. Always keep your email account secure and consider enabling two-factor authentication on your email provider."
        },
        {
          question: "Can Lumirra access my funds?",
          answer: "No. Lumirra is a non-custodial wallet, meaning you have complete control over your private keys and funds. We never have access to your assets, cannot move your funds, or freeze your account. This is fundamentally different from custodial services where the company holds your keys. With Lumirra, you are the only person who can authorize transactions."
        },
        {
          question: "What should I do if I suspect unauthorized access?",
          answer: "If you suspect unauthorized access to your wallet, immediately transfer your assets to a new wallet with a different password. Change your email password if you believe it's been compromised. Review your transaction history for any suspicious activity. For security concerns, contact our support team immediately at support@lumirra.com with details about the incident."
        }
      ]
    },
    {
      category: "Supported Networks",
      questions: [
        {
          question: "Which blockchains does Lumirra support?",
          answer: "Lumirra currently supports four major blockchain networks: Ethereum (including all ERC-20 tokens), BNB Smart Chain (BEP-20 tokens), TRON (TRC-20 tokens), and Solana (SPL tokens). Each network has its own ecosystem of tokens and DeFi applications that you can access directly through your Lumirra wallet."
        },
        {
          question: "Can I send Bitcoin or other networks?",
          answer: "Currently, Lumirra supports Ethereum, BNB Smart Chain, TRON, and Solana networks. Bitcoin, Litecoin, and other networks are not yet supported but are on our development roadmap. We're continuously working to add support for additional blockchains based on user demand and market trends."
        },
        {
          question: "Why does my address look different on each network?",
          answer: "Each blockchain network uses different address formats for security and network identification purposes. Ethereum and BNB addresses start with '0x', TRON addresses start with 'T', and Solana addresses use a different alphanumeric format. This is intentional—sending tokens to an address on the wrong network can result in permanent loss of funds. Always verify you're using the correct network before sending crypto."
        }
      ]
    },
    {
      category: "Transactions & Fees",
      questions: [
        {
          question: "What are network fees and why do I have to pay them?",
          answer: "Network fees (also called gas fees) are payments to blockchain validators/miners who process and confirm your transactions. These fees are not collected by Lumirra—they go directly to the network. Fee amounts vary based on network congestion: Ethereum typically has higher fees than BNB Smart Chain, TRON, or Solana. During peak usage times, fees can increase significantly. The wallet displays estimated fees before you confirm any transaction."
        },
        {
          question: "How long do transactions take?",
          answer: "Transaction speed varies by blockchain: Solana transactions typically confirm in 1-2 seconds, TRON in 3-5 seconds, BNB Smart Chain in 3-5 seconds, and Ethereum in 15 seconds to several minutes (depending on gas fees paid and network congestion). Once submitted, transactions cannot be canceled—they must be confirmed by the network."
        },
        {
          question: "What happens if I send crypto to the wrong address?",
          answer: "Cryptocurrency transactions are irreversible. If you send tokens to an incorrect address, they cannot be recovered. This is a fundamental characteristic of blockchain technology, not a limitation of Lumirra. Always double-check recipient addresses before confirming transactions. For extra safety, send a small test amount first for large transfers."
        },
        {
          question: "Why did my swap fail but I still paid fees?",
          answer: "When a swap transaction fails (due to slippage exceeding your tolerance, insufficient liquidity, or other smart contract issues), the network still charges fees because validators processed your transaction attempt. To minimize failed swaps, increase your slippage tolerance for volatile tokens, ensure you have sufficient balance for gas fees, and avoid trading during extreme market volatility."
        }
      ]
    },
    {
      category: "Features & Usage",
      questions: [
        {
          question: "How do I buy cryptocurrency with a credit card?",
          answer: "Navigate to 'Buy/Sell' from your wallet dashboard, select the cryptocurrency you want to purchase, enter the amount in your local currency, and choose your payment method. Lumirra partners with MoonPay to process fiat payments securely. You'll need to complete identity verification for purchases over certain amounts (typically $500) to comply with financial regulations. Crypto is delivered directly to your Lumirra wallet within minutes."
        },
        {
          question: "What is token swapping and how does it work?",
          answer: "Token swapping lets you exchange one cryptocurrency for another directly within your wallet using decentralized exchange (DEX) protocols. Lumirra aggregates rates from multiple liquidity sources to ensure you get competitive pricing. When you swap, smart contracts on the blockchain execute the trade automatically. You pay network fees plus small liquidity provider fees (typically 0.1%-0.3% of the trade amount)."
        },
        {
          question: "Can I use Lumirra on multiple devices?",
          answer: "Yes. You can access your Lumirra wallet from any device by logging in with your email and password. Your encrypted wallet data syncs across devices, ensuring you have access to your funds wherever you need them. However, for maximum security, avoid logging in on public or shared computers, and always log out when finished."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">FAQ</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about using Lumirra wallet
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-2xl font-bold mb-4 text-[#1677FF]">{category.category}</h3>
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${categoryIndex}-${index}`}
                    className="border border-border rounded-lg px-6 py-2 bg-card"
                    data-testid={`faq-item-${categoryIndex}-${index}`}
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-[#1677FF]/10 to-[#2ED8FF]/10 border border-[#1677FF]/20 text-center">
          <h3 className="text-2xl font-bold mb-3">Still Need Help?</h3>
          <p className="text-muted-foreground mb-6 text-lg">
            Our support team is available 24/7 to assist you with any questions or concerns
          </p>
          <Button
            onClick={() => setLocation("/contact")}
            size="lg"
            className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
            data-testid="button-contact-support"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
