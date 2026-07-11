import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertCircle, Copy, Download, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/wallet-context";

export default function CreateWallet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setWallet } = useWallet();
  const [step, setStep] = useState<"generate" | "confirm" | "complete">("generate");
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [hideSeed, setHideSeed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Record<number, number>>({});
  const [testWords] = useState([2, 5, 9]); // indices to test

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/create", {
        password: "demo-password-123", // In production, get from user
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSeedPhrase(data.mnemonic.split(" "));
      setWalletData(data.wallet);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create wallet. Please try again.",
      });
      setLocation("/");
    },
  });

  const copySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase.join(" "));
    toast({
      title: "Copied to clipboard",
      description: "Your recovery phrase has been copied.",
    });
  };

  const downloadSeedPhrase = () => {
    const element = document.createElement("a");
    const file = new Blob([seedPhrase.join(" ")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "lumirra-recovery-phrase.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Downloaded",
      description: "Recovery phrase saved to your downloads.",
    });
  };

  const handleWordSelect = (position: number, wordIndex: number) => {
    setSelectedWords(prev => {
      const newSelected = { ...prev };
      if (newSelected[position] === wordIndex) {
        delete newSelected[position];
      } else {
        newSelected[position] = wordIndex;
      }
      return newSelected;
    });
  };

  const verifySelection = () => {
    const correct = testWords.every((word, i) => selectedWords[i] === word);
    if (correct) {
      if (walletData) {
        setWallet(walletData.id, walletData.address);
      }
      setStep("complete");
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect words",
        description: "Please select the correct words in order.",
      });
    }
  };

  // Generate wallet on mount
  useEffect(() => {
    if (seedPhrase.length === 0 && !createWalletMutation.isPending) {
      createWalletMutation.mutate();
    }
  }, []);

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

        {step === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-display">Your Recovery Phrase</CardTitle>
              <CardDescription>
                Write down these 12 words in order and store them securely offline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {createWalletMutation.isPending && (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-muted-foreground">Creating your wallet...</p>
                </div>
              )}

              {seedPhrase.length === 0 && !createWalletMutation.isPending && null}
              {seedPhrase.length > 0 && (
              <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Never share your recovery phrase. Anyone with these words can access your funds.
                  Lumirra cannot recover your wallet without this phrase.
                </AlertDescription>
              </Alert>

              <div className="relative">
                <div className={`grid grid-cols-3 gap-3 ${hideSeed ? "blur-md select-none" : ""}`}>
                  {seedPhrase.map((word, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-lg p-3 text-center"
                      data-testid={`text-seed-word-${index}`}
                    >
                      <span className="text-xs text-muted-foreground mr-2">{index + 1}.</span>
                      <span className="font-mono font-medium">{word}</span>
                    </div>
                  ))}
                </div>
                {hideSeed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Recovery phrase hidden
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setHideSeed(!hideSeed)}
                  data-testid="button-toggle-seed"
                  className="flex-1 hover-elevate"
                >
                  {hideSeed ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  {hideSeed ? "Show" : "Hide"}
                </Button>
                <Button
                  variant="outline"
                  onClick={copySeedPhrase}
                  data-testid="button-copy-seed"
                  className="flex-1 hover-elevate"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadSeedPhrase}
                  data-testid="button-download-seed"
                  className="flex-1 hover-elevate"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmed"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  data-testid="checkbox-confirmed"
                />
                <label
                  htmlFor="confirmed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have written down my recovery phrase and stored it safely
                </label>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!confirmed}
                onClick={() => setStep("confirm")}
                data-testid="button-continue"
              >
                Continue
              </Button>
              </>
              )}
            </CardContent>
          </Card>
        )}

        {step === "confirm" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-display">Verify Recovery Phrase</CardTitle>
              <CardDescription>
                Select the correct words to confirm you saved your recovery phrase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {testWords.map((wordIndex, position) => (
                  <div key={position}>
                    <p className="text-sm font-medium mb-2">Word #{wordIndex + 1}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {seedPhrase.map((word, index) => (
                        <Button
                          key={index}
                          variant={selectedWords[position] === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleWordSelect(position, index)}
                          data-testid={`button-word-${index}`}
                          className="hover-elevate"
                        >
                          {word}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={verifySelection}
                disabled={Object.keys(selectedWords).length < 3}
                data-testid="button-verify"
              >
                Verify & Create Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-success/10 p-6 rounded-full">
                    <CheckCircle2 className="h-16 w-16 text-success" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-semibold mb-2">
                    Wallet Created Successfully!
                  </h2>
                  <p className="text-muted-foreground">
                    Your Lumirra wallet is ready to use.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-go-dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
