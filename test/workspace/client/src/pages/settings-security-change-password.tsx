import { ChevronLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Delete } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  isAdmin: boolean;
}

export default function ChangeSecurityPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"current" | "new" | "confirm">("current");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newPin, setNewPin] = useState<string>("");
  const [currentPin, setCurrentPin] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const handleNumberClick = (num: string) => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (currentIndex < 6) {
      const updatedPin = [...pin];
      updatedPin[currentIndex] = num;
      setPin(updatedPin);
      setCurrentIndex(currentIndex + 1);

      if (currentIndex === 5) {
        const enteredPin = updatedPin.join("");
        
        setTimeout(async () => {
          if (step === "current") {
            // Save current PIN for API call
            setCurrentPin(enteredPin);
            setStep("new");
            setPin(["", "", "", "", "", ""]);
            setCurrentIndex(0);
            toast({
              description: "Enter your new PIN",
            });
          } else if (step === "new") {
            // Save new PIN for confirmation
            setNewPin(enteredPin);
            setStep("confirm");
            setPin(["", "", "", "", "", ""]);
            setCurrentIndex(0);
            toast({
              description: "Confirm your new PIN",
            });
          } else {
            // Confirm PIN and submit to backend
            if (enteredPin === newPin) {
              setIsChanging(true);
              try {
                const response = await apiRequest("POST", "/api/auth/change-password", {
                  currentPassword: currentPin,
                  newPassword: newPin,
                });

                if (response.ok) {
                  toast({
                    description: "Security password updated successfully",
                  });
                  setTimeout(() => {
                    window.history.back();
                  }, 1000);
                } else {
                  const errorData = await response.json();
                  toast({
                    description: errorData.error || "Failed to change password",
                    variant: "destructive",
                  });
                  // Go back to current PIN step if current password was incorrect
                  if (errorData.error?.includes("incorrect")) {
                    setPin(["", "", "", "", "", ""]);
                    setCurrentIndex(0);
                    setCurrentPin("");
                    setNewPin("");
                    setStep("current");
                  } else {
                    setPin(["", "", "", "", "", ""]);
                    setCurrentIndex(0);
                    setNewPin("");
                    setStep("new");
                  }
                }
              } catch (error: any) {
                toast({
                  description: error?.message || "Failed to change password",
                  variant: "destructive",
                });
                setPin(["", "", "", "", "", ""]);
                setCurrentIndex(0);
                setNewPin("");
                setStep("new");
              } finally {
                setIsChanging(false);
              }
            } else {
              toast({
                description: "PINs don't match. Please try again.",
                variant: "destructive",
              });
              setPin(["", "", "", "", "", ""]);
              setCurrentIndex(0);
              setNewPin("");
              setStep("new");
            }
          }
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (currentIndex > 0) {
      const updatedPin = [...pin];
      updatedPin[currentIndex - 1] = "";
      setPin(updatedPin);
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleReset = () => {
    setPin(["", "", "", "", "", ""]);
    setCurrentIndex(0);
    setNewPin("");
    setCurrentPin("");
    if (step === "confirm") {
      setStep("new");
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please login to reset your security password",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const response = await apiRequest("POST", "/api/auth/send-reset-code", {
        email: user.email,
      });

      if (response.ok) {
        // Log out the user and redirect to login page with reset flow
        await apiRequest("POST", "/api/auth/logout", {});
        
        toast({
          title: "Reset Code Sent",
          description: "Check your email for the reset code. Redirecting to login...",
        });
        
        // Store email in sessionStorage for the login page to use
        sessionStorage.setItem("resetEmail", user.email);
        sessionStorage.setItem("startResetFlow", "true");
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Send Reset Code",
          description: errorData.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset code",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Link href="/settings/security">
            <button 
              data-testid="button-back"
              className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Change Security Password</h1>
        <div className="w-9"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
          <h2 className="text-xl mb-8" data-testid="text-pin-prompt">
            {step === "current" && "Enter old password"}
            {step === "new" && "Enter new password"}
            {step === "confirm" && "Confirm new password"}
          </h2>
          
          <div className="flex gap-3 mb-12" data-testid="container-pin-inputs">
            {pin.map((digit, index) => (
              <div
                key={index}
                data-testid={`pin-box-${index}`}
                className={`w-12 h-16 border-2 rounded-lg flex items-center justify-center text-2xl ${
                  digit ? "border-primary" : "border-muted-foreground/30"
                }`}
              >
                {digit && <span className="text-2xl">•</span>}
              </div>
            ))}
          </div>

          <button
            data-testid="button-forgot-password"
            onClick={handleForgotPassword}
            disabled={sending}
            className="text-primary hover-elevate active-elevate-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? "Sending..." : "Forget Password"}
          </button>
        </div>

        <div className="w-full max-w-md">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                data-testid={`button-num-${num}`}
                onClick={() => handleNumberClick(num.toString())}
                disabled={isChanging}
                className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 text-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            <div className="h-16"></div>
            <button
              data-testid="button-num-0"
              onClick={() => handleNumberClick("0")}
              disabled={isChanging}
              className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 text-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              data-testid="button-delete"
              onClick={handleDelete}
              disabled={isChanging}
              className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChanging ? <Loader2 className="w-6 h-6 animate-spin" /> : <Delete className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
