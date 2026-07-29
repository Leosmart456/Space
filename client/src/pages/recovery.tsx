import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/Lumirra Logo Design_1761873279867.png";

export default function Recovery() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/send-code", {
        email,
        purpose: "reset"
      });

      if (response.ok) {
        setCountdown(600); // 10 minutes
        toast({
          title: "Recovery Code Sent",
          description: `We've sent a 6-digit code to ${email}`,
        });
        setStep("code");
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
        description: error?.message || "Failed to send recovery code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        code,
        newPassword: password,
      });

      if (response.ok) {
        setStep("success");
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Reset Password",
          description: errorData.error || "Please try again",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to reset password",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1677FF]/10 via-background to-[#2ED8FF]/10" />
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
        <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8">
          {step !== "success" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (step === "email") {
                  setLocation("/login");
                } else if (step === "code") {
                  setStep("email");
                } else if (step === "password") {
                  setStep("code");
                }
              }}
              className="mb-6"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <div className="flex justify-center mb-8">
            <motion.img 
              src={logoImage} 
              alt="Lumirra" 
              className="h-16 w-16"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              data-testid="logo-recovery"
            />
          </div>

          {step === "email" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
              <p className="text-muted-foreground text-center mb-8">
                Enter your email to receive a recovery code
              </p>

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
                      onChange={(e) => setEmail(e.target.value)}
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
                  data-testid="button-send-code"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Recovery Code"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-[#1677FF] hover:underline font-medium"
                  data-testid="link-login"
                >
                  Login
                </button>
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-center mb-2">Enter Code</h1>
              <p className="text-muted-foreground text-center mb-8">
                We sent a 6-digit code to {email}
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Recovery Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    data-testid="input-code"
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:opacity-90"
                  size="lg"
                  data-testid="button-verify-code"
                >
                  Verify Code
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleEmailSubmit(fakeEvent);
                  }}
                  disabled={countdown > 0 || loading}
                  className="text-[#1677FF] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="link-resend"
                >
                  {countdown > 0 ? `Resend in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : "Resend"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-center mb-2">New Password</h1>
              <p className="text-muted-foreground text-center mb-8">
                Create a new strong password
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      data-testid="input-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : ''}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${password === confirmPassword && password ? 'text-green-500' : ''}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Passwords match
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] hover:opacity-90"
                  size="lg"
                  disabled={loading}
                  data-testid="button-reset-password"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
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
              <h1 className="text-3xl font-bold mb-2">Password Reset!</h1>
              <p className="text-muted-foreground mb-4">
                Your password has been successfully reset
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1677FF]" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
