import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2, Loader2, User, Calendar, ChevronLeft, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/wallet-context";

export default function CreateAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setWallet } = useWallet();
  const [step, setStep] = useState<"personal" | "verification" | "pin" | "confirm" | "success">("personal");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verificationIndex, setVerificationIndex] = useState(0);
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newPin, setNewPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: "Last Name Required",
        description: "Please enter your last name",
        variant: "destructive",
      });
      return;
    }

    if (!dateOfBirth) {
      toast({
        title: "Date of Birth Required",
        description: "Please enter your date of birth",
        variant: "destructive",
      });
      return;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      toast({
        title: "Invalid Age",
        description: "You must be at least 18 years old",
        variant: "destructive",
      });
      return;
    }
    
    if (age > 120) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date of birth",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/send-code", {
        email,
        purpose: "signup"
      });

      if (response.ok) {
        setCountdown(600); // 10 minutes
        setStep("verification");
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the 6-digit code",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Send Code",
          description: errorData.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationNumberClick = (num: string) => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (verificationIndex < 6) {
      const updatedCode = [...verificationCode];
      updatedCode[verificationIndex] = num;
      setVerificationCode(updatedCode);
      setVerificationIndex(verificationIndex + 1);

      if (verificationIndex === 5) {
        const enteredCode = updatedCode.join("");
        
        setTimeout(async () => {
          setLoading(true);
          setError("");
          
          try {
            const response = await apiRequest("POST", "/api/auth/verify-code", {
              email,
              code: enteredCode,
              purpose: "signup"
            });

            if (response.ok) {
              setStep("pin");
              setLoading(false);
            } else {
              const errorData = await response.json();
              // Trigger shake animation
              setIsShaking(true);
              setTimeout(() => setIsShaking(false), 600);
              
              setError(errorData.error || "Invalid verification code");
              setTimeout(() => {
                setVerificationCode(["", "", "", "", "", ""]);
                setVerificationIndex(0);
                setError("");
              }, 1500);
              setLoading(false);
            }
          } catch (error: any) {
            // Trigger shake animation
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
            
            setError(error?.message || "Verification failed");
            setTimeout(() => {
              setVerificationCode(["", "", "", "", "", ""]);
              setVerificationIndex(0);
              setError("");
            }, 1500);
            setLoading(false);
          }
        }, 300);
      }
    }
  };

  const handleVerificationDelete = () => {
    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (verificationIndex > 0) {
      const updatedCode = [...verificationCode];
      updatedCode[verificationIndex - 1] = "";
      setVerificationCode(updatedCode);
      setVerificationIndex(verificationIndex - 1);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/send-code", {
        email,
        purpose: "signup"
      });

      if (response.ok) {
        setCountdown(600);
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Resend Code",
          description: errorData.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePinNumberClick = (num: string) => {
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
          setStep("confirm");
          setPin(["", "", "", "", "", ""]);
          setCurrentIndex(0);
          toast({
            description: "Confirm your 6-digit PIN",
          });
        }, 300);
      }
    }
  };

  const handlePinDelete = () => {
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

  const handleConfirmNumberClick = (num: string) => {
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
              const response = await apiRequest("POST", "/api/auth/verify-signup", {
                email,
                code: verificationCode.join(""),
                firstName,
                lastName,
                dateOfBirth,
                pin: newPin,
              });
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.wallet) {
                  setWallet(data.wallet.id, data.wallet.address);
                }
                
                setStep("success");
                setTimeout(() => {
                  window.location.href = import.meta.env.BASE_URL + "dashboard";
                }, 2000);
              } else {
                const error = await response.json();
                const errorMessage = error.error || error.message || "Failed to create account";
                
                toast({
                  title: "Signup Failed",
                  description: errorMessage,
                  variant: "destructive",
                });
                setLoading(false);
              }
            } catch (error: any) {
              const errorMessage = error?.message || "An error occurred during signup";
              toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
              });
              setLoading(false);
            }
          } else {
            // Trigger shake animation
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
            
            setError("PINs don't match");
            setTimeout(() => {
              setPin(["", "", "", "", "", ""]);
              setCurrentIndex(0);
              setError("");
            }, 1500);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden glass-bg bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF]/12 via-background to-[#2ED8FF]/12" />
      <motion.div 
        className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#1677FF]/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2ED8FF]/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {step === "personal" && (
          <div className="glass-modal p-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mb-6"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
              <p className="text-muted-foreground text-center mb-8">
                Start your secure crypto journey
              </p>

              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-email"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        data-testid="input-firstname"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="pl-10"
                      data-testid="input-dateofbirth"
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:opacity-90"
                  size="lg"
                  disabled={loading}
                  data-testid="button-continue-personal"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-[#1677FF] hover:underline font-medium"
                  data-testid="link-login"
                >
                  Login
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {step === "verification" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-personal"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("personal");
                      setVerificationCode(["", "", "", "", "", ""]);
                      setVerificationIndex(0);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Enter Verification Code</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <h2 className="text-xl mb-8 text-center" data-testid="text-verification-prompt">
                    Enter the 6-digit code sent to {email}
                  </h2>
                  
                  <div 
                    className={`flex gap-3 mb-4 ${isShaking ? 'animate-shake' : ''}`} 
                    data-testid="container-verification-inputs"
                  >
                    {verificationCode.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`verification-code-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${
                          isShaking && digit ? "error" : digit ? "filled" : ""
                        }`}
                      >
                        {digit && "•"}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm mb-4" data-testid="text-verification-error">
                      {error}
                    </p>
                  )}

                  <div className="text-center mb-12">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0 || loading}
                      className="text-sm text-[#1677FF] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-resend-code"
                    >
                      {countdown > 0
                        ? `Resend code in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                        : "Resend Code"}
                    </button>
                  </div>
                </div>

                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-verify-${num}`}
                        onClick={() => handleVerificationNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-verify-0"
                      onClick={() => handleVerificationNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-verify-delete"
                      onClick={handleVerificationDelete}
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

        {step === "pin" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-verification"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("verification");
                      setPin(["", "", "", "", "", ""]);
                      setCurrentIndex(0);
                      setError("");
                      setIsShaking(false);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-medium">Create PIN</h1>
                <div className="w-9"></div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                  <h2 className="text-xl mb-8 text-center" data-testid="text-pin-prompt">
                    Enter your 6-digit PIN
                  </h2>
                  
                  <div 
                    className={`flex gap-3 mb-4 ${isShaking ? 'animate-shake' : ''}`} 
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
                        {digit && "•"}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm mb-12" data-testid="text-error-message">
                      {error}
                    </p>
                  )}
                  {!error && <div className="mb-12"></div>}
                </div>

                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-num-${num}`}
                        onClick={() => handlePinNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-num-0"
                      onClick={() => handlePinNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-delete"
                      onClick={handlePinDelete}
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

        {step === "confirm" && (
          <div className="fixed inset-0 bg-background z-50">
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <button 
                    data-testid="button-back-to-pin"
                    className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-md"
                    onClick={() => {
                      setStep("pin");
                      setPin(["", "", "", "", "", ""]);
                      setCurrentIndex(0);
                      setError("");
                      setIsShaking(false);
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
                    Confirm your 6-digit PIN
                  </h2>
                  
                  <div 
                    className={`flex gap-3 mb-4 ${isShaking ? 'animate-shake' : ''}`} 
                    data-testid="container-confirm-pin-inputs"
                  >
                    {pin.map((digit, index) => (
                      <div
                        key={index}
                        data-testid={`confirm-pin-box-${index}`}
                        className={`glass-pin-box w-12 h-16 flex items-center justify-center text-2xl ${
                          isShaking && digit ? "error" : digit ? "filled" : ""
                        }`}
                      >
                        {digit && "•"}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm mb-12" data-testid="text-confirm-error-message">
                      {error}
                    </p>
                  )}
                  {!error && <div className="mb-12"></div>}
                </div>

                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        data-testid={`button-confirm-num-${num}`}
                        onClick={() => handleConfirmNumberClick(num.toString())}
                        className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="aspect-square w-full"></div>
                    <button
                      data-testid="button-confirm-num-0"
                      onClick={() => handleConfirmNumberClick("0")}
                      className="glass-keypad-btn aspect-square w-full text-xl font-medium"
                    >
                      0
                    </button>
                    <button
                      data-testid="button-confirm-delete"
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

        {step === "success" && (
          <div className="glass-modal p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Account Created!</h1>
              <p className="text-muted-foreground mb-4">
                Redirecting you to wallet setup...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1677FF]" />
            </motion.div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
