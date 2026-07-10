import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/useUser";

export default function VerifyPage() {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.accreditedStatus === "pending") {
      navigate("/onboarding");
    } else {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return null;
}
