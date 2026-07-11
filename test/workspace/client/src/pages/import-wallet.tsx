import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/wallet-context";

export default function ImportWallet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setWallet } = useWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const importWalletMutation = useMutation({
    mutationFn: async (mnemonicPhrase: string) => {
      const response = await apiRequest("POST", "/api/wallet/import", {
        mnemonic: mnemonicPhrase,
        password: "demo-password-123",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setWallet(data.wallet.id, data.wallet.address);
      toast({
        title: "Wallet imported successfully",
        description: "Your wallet has been restored.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Failed to import wallet. Please try again.",
      });
    },
  });

  const validateMnemonic = (text: string) => {
    const words = text.trim().split(/\s+/);
    const valid = words.length === 12 || words.length === 24;
    setIsValid(valid);
    return valid;
  };

  const handleImport = () => {
    if (validateMnemonic(mnemonic)) {
      importWalletMutation.mutate(mnemonic);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid recovery phrase",
        description: "Please enter a valid 12 or 24 word recovery phrase.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
            className="hover-elevate"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Import Wallet</CardTitle>
            <CardDescription>
              Enter your 12 or 24 word recovery phrase to restore your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your recovery phrase should be separated by spaces. Never share it with anyone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recovery Phrase</label>
              <Textarea
                placeholder="Enter your recovery phrase here..."
                value={mnemonic}
                onChange={(e) => {
                  setMnemonic(e.target.value);
                  validateMnemonic(e.target.value);
                }}
                rows={4}
                className="font-mono resize-none"
                data-testid="input-mnemonic"
              />
              {isValid === false && mnemonic.trim() && (
                <p className="text-sm text-destructive">
                  Please enter a valid 12 or 24 word recovery phrase
                </p>
              )}
              {isValid === true && (
                <p className="text-sm text-success">
                  Valid recovery phrase
                </p>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!isValid || importWalletMutation.isPending}
              onClick={handleImport}
              data-testid="button-import"
            >
              {importWalletMutation.isPending ? "Importing..." : "Import Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
