import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import logoImage from "@assets/Lumirra Logo Design (original)_1761875532047.png";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Loader2, AlertCircle, ChevronLeft, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/wallet-context";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setWallet, isAuthenticated, isLoading } = useWallet();
  const [step, setStep] = useState<"email" | "pin" | "reset-email" | "reset-code" | "reset-pin" | "reset-confirm">("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetCode, setResetCode] = useState<string[]>(["", "", "", ""]);
  const [resetCodeIndex, setResetCodeIndex] = useState(0);
  const [newPin, setNewPin] = useState<string>("");
  const [verifiedResetCode, setVerifiedResetCode] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Redirect already-authenticated users straight to the dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Check if user was redirected from "Forget Password" in settings
  useEffect(() => {
    const startResetFlow = sessionStorage.getItem("startResetFlow");
    const resetEmail = sessionStorage.getItem("resetEmail");
    
    if (startResetFlow === "true" && resetEmail) {
      setEmail(resetEmail);
      setStep("reset-code");
      setCountdown(600); // 10 minutes
      
      // Clear sessionStorage flags
      sessionStorage.removeItem("startResetFlow");
      sessionStorage.removeItem("resetEmail");
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setStep("pin");
  };

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
          setLoading(true);
          setError("");
          
          try {
            const response = await apiRequest("POST", "/api/auth/login-pin", { 
              email, 
              pin: enteredPin 
            });
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.wallet) {
                setWallet(data.wallet.id, data.wallet.address);
              }
              
              toast({
                title: "Login Successful",
                description: "Welcome back!",
              });

              if (data.user.isAdmin) {
                window.location.href = "/admin";
              } else {
                window.location.href = "/dashboard";
              }
            } else {
              const errorData = await response.json();
              
              if (errorData.requiresPasswordReset) {
                toast({
                  title: "Password Reset Required",
                  description: "Your password needs to be updated to the new PIN format. Please reset your password.",
                  variant: "destructive",
                });
                setStep("reset-email");
                setPin(["", "", "", "", "", ""]);
                setCurrentIndex(0);
              } else {
                // Trigger shake animation
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 600);
                
                setError(errorData.error || "Invalid PIN. Please try again.");
                setTimeout(() => {
                  setPin(["", "", "", "", "", ""]);
                  setCurrentIndex(0);
                }, 600);
              }
              
              setLoading(false);
            }
          } catch (error: any) {
            // Trigger shake animation
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
            
            setError(error?.message || "An error occurred during login.");
            setTimeout(() => {
              setPin(["", "", "", "", "", ""]);
              setCurrentIndex(0);
            }, 600);
            setLoading(false);
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

  const handleForgotPassword = () => {
    setStep("reset-email");
  };

  const handleSendResetCode = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/send-reset-code", {
        email,
      });

      if (response.ok) {
        setCountdown(600); // 10 minutes
        setStep("reset-code");
        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the 4-digit code",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send reset code");
      }
    } catch (error: any) {
      setError(error?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCodeNumberClick = (num: string) => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (resetCodeIndex < 4) {
      const updatedCode = [...resetCode];
      updatedCode[resetCodeIndex] = num;
      setResetCode(updatedCode);
      setResetCodeIndex(resetCodeIndex + 1);

      if (resetCodeIndex === 3) {
        const enteredCode = updatedCode.join("");
        
        // Verify the code with backend before proceeding
        setTimeout(async () => {
          setLoading(true);
          setError("");
          
          try {
            const response = await apiRequest("POST", "/api/auth/verify-reset-code", {
              email: email.toLowerCase(),
              code: enteredCode,
            });
            
            if (response.ok) {
              // Code verified successfully, save it and proceed to new PIN entry
              setVerifiedResetCode(enteredCode);
              setStep("reset-pin");
              setResetCodeIndex(0);
            } else {
              const errorData = await response.json();
              
              // Show error with shake animation and clear immediately for retry
              setIsShaking(true);
              setError(errorData.error || "Invalid reset code. Please try again.");
              setResetCode(["", "", "", ""]);
              setResetCodeIndex(0);
              
              // Clear the shake animation and error after 1.5 seconds
              setTimeout(() => {
                setIsShaking(false);
                setError("");
              }, 1500);
            }
          } catch (error: any) {
            // Show error with shake animation and clear immediately for retry
            setIsShaking(true);
            setError("Failed to verify code. Please try again.");
            setResetCode(["", "", "", ""]);
            setResetCodeIndex(0);
            
            // Clear the shake animation and error after 1.5 seconds
            setTimeout(() => {
              setIsShaking(false);
              setError("");
            }, 1500);
          } finally {
            setLoading(false);
          }
        }, 300);
      }
    }
  };

  const handleResetCodeDelete = () => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (resetCodeIndex > 0) {
      const updatedCode = [...resetCode];
      updatedCode[resetCodeIndex - 1] = "";
      setResetCode(updatedCode);
      setResetCodeIndex(resetCodeIndex - 1);
    }
  };

  const handleResetPinNumberClick = (num: string) => {
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
        setNewPin(enteredPin);
        
        setTimeout(() => {
          setStep("reset-confirm");
          setPin(["", "", "", "", "", ""]);
          setCurrentIndex(0);
          toast({
            description: "Confirm your new PIN",
          });
        }, 300);
      }
    }
  };

  const handleResetConfirmNumberClick = (num: string) => {
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
          if (enteredPin === newPin) {
            setLoading(true);
            
            try {
              const response = await apiRequest("POST", "/api/auth/reset-password-pin", {
                email: email.toLowerCase(),
                code: verifiedResetCode,
                newPin: newPin,
              });

              if (response.ok) {
                toast({
                  title: "Password Reset Successful",
                  description: "You can now login with your new PIN",
                });
                setStep("email");
                setPin(["", "", "", "", "", ""]);
                setCurrentIndex(0);
                setResetCode(["", "", "", ""]);
                setNewPin("");
              } else {
                const errorData = await response.json();
                toast({
                  title: "Reset Failed",
                  description: errorData.error || "Failed to reset password",
                  variant: "destructive",
                });
                setPin(["", "", "", "", "", ""]);
                setCurrentIndex(0);
              }
            } catch (error: any) {
              toast({
                title: "Error",
                description: error?.message || "Failed to reset password",
                variant: "destructive",
              });
              setPin(["", "", "", "", "", ""]);
              setCurrentIndex(0);
            } finally {
              setLoading(false);
            }
          } else {
            toast({
              description: "PINs don't match. Please try again.",
              variant: "destructive",
            });
            setPin(["", "", "", "", "", ""]);
            setCurrentIndex(0);
            setNewPin("");
            setStep("reset-pin");
          }
        }, 300);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden glass-bg bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF]/12 via-background to-[#2ED8FF]/12" />
      <motion.div 
        className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#1677FF]/10 rounded-full blur-3xl pointer-events-none"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: 'opacity' }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2ED8FF]/10 rounded-full blur-3xl pointer-events-none"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ willChange: 'opacity' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {step === "email" && (
          <div className="glass-modal p-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex justify-center mb-5">
              <img
                src={logoImage}
                alt="Lumirra"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 14px rgba(22,119,255,0.28))",
                }}
              />
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-center mb-8">
              Login to access your wallet
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="border-red-500/50 bg-red-500/10" data-testid="alert-error">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="ml-2 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    data-testid="input-email"
                    autoFocus
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:opacity-90"
                size="lg"
                disabled={loading}
                data-testid="button-continue"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/create-account")}
                className="text-[#1677FF] hover:underline font-medium"
                data-testid="link-create-account"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {step === "pin" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-email"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("email");
                      setPin(["", "", "", "", "", ""]);
                      setCurrentIndex(0);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Enter PIN</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 w-full"
                      >
                        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10" data-testid="alert-error">
                          <AlertCircle className="h-5 w-5" />
                          <AlertDescription className="ml-2 text-sm">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <h2 className="text-xl mb-8 text-center" data-testid="text-pin-prompt">
                    Enter your 6-digit PIN
                  </h2>
                  
                  <div 
                    className={`flex gap-3 mb-12 ${isShaking ? 'animate-shake' : ''}`} 
                    data-testid="container-pin-inputs"
                  >
                    {pin.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`pin-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${
                          isShaking && digit ? "error" : digit ? "filled" : ""
                        }`}
                      >
                        {digit && <span className="text-2xl">•</span>}
                      </div>
                    ))}
                  </div>

                  <button
                    data-testid="button-forgot-password"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-primary hover-elevate active-elevate-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Forget Password
                  </button>
                </div>

                <div className="w-full max-w-[280px]">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-num-${num}`}
                        onClick={() => handleNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-num-0"
                      onClick={() => handleNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-delete"
                      onClick={handleDelete}
                      className="glass-keypad-btn aspect-square w-full flex items-center justify-center"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

        {step === "reset-email" && (
          <div className="glass-modal p-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep(email ? "pin" : "email");
                setError("");
              }}
              className="mb-6"
              data-testid="button-back-from-reset"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
            <p className="text-muted-foreground text-center mb-8">
              Enter your email to receive a reset code
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="border-red-500/50 bg-red-500/10" data-testid="alert-error">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="ml-2 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    data-testid="input-reset-email"
                    autoFocus
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleSendResetCode}
                className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:opacity-90"
                size="lg"
                disabled={loading || countdown > 0}
                data-testid="button-send-reset-code"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Code...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "reset-code" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-reset-email"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("reset-email");
                      setResetCode(["", "", "", ""]);
                      setResetCodeIndex(0);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Enter Reset Code</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <h2 className="text-xl mb-8 text-center" data-testid="text-reset-code-prompt">
                    Enter the 4-digit code sent to {email}
                  </h2>
                  
                  <div 
                    className={`flex gap-3 mb-4 ${isShaking ? "animate-shake" : ""}`}
                    data-testid="container-reset-code-inputs"
                  >
                    {resetCode.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`reset-code-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${
                          error ? "error" : digit ? "filled" : ""
                        }`}
                      >
                        {digit && <span className="text-2xl">•</span>}
                      </div>
                    ))}
                  </div>
                  
                  {error && (
                    <p className="text-destructive text-sm text-center mb-8" data-testid="text-reset-code-error">
                      {error}
                    </p>
                  )}
                  
                  {!error && (
                    <div className="mb-12"></div>
                  )}
                </div>

                <div className="w-full max-w-[280px]">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-num-${num}`}
                        onClick={() => handleResetCodeNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-num-0"
                      onClick={() => handleResetCodeNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-delete"
                      onClick={handleResetCodeDelete}
                      className="glass-keypad-btn aspect-square w-full flex items-center justify-center"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

        {step === "reset-pin" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-reset-code"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("reset-code");
                      setPin(["", "", "", "", "", ""]);
                      setCurrentIndex(0);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">New PIN</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <h2 className="text-xl mb-8 text-center" data-testid="text-new-pin-prompt">
                    Enter your new 6-digit PIN
                  </h2>
                  
                  <div className="flex gap-3 mb-12" data-testid="container-pin-inputs">
                    {pin.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`pin-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${digit ? "filled" : ""}`}
                      >
                        {digit && <span className="text-2xl">•</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-[280px]">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-num-${num}`}
                        onClick={() => handleResetPinNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-num-0"
                      onClick={() => handleResetPinNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-delete"
                      onClick={handleDelete}
                      className="glass-keypad-btn aspect-square w-full flex items-center justify-center"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

        {step === "reset-confirm" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-new-pin"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("reset-pin");
                      setPin(["", "", "", "", "", ""]);
                      setCurrentIndex(0);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Confirm PIN</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <h2 className="text-xl mb-8 text-center" data-testid="text-confirm-pin-prompt">
                    Confirm your new 6-digit PIN
                  </h2>
                  
                  <div className="flex gap-3 mb-12" data-testid="container-pin-inputs">
                    {pin.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`pin-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${digit ? "filled" : ""}`}
                      >
                        {digit && <span className="text-2xl">•</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-[280px]">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-num-${num}`}
                        onClick={() => handleResetConfirmNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-num-0"
                      onClick={() => handleResetConfirmNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-delete"
                      onClick={handleDelete}
                      className="glass-keypad-btn aspect-square w-full flex items-center justify-center"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Your keys, your crypto. Always.
        </p>
      </motion.div>
    </div>
  );
}
