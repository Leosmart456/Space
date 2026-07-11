import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";

export default function SettingsAbout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
              data-testid="button-back"
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">About</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-2xl">
        {/* App Logo and Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl font-semibold mb-1">Lumirra App</h2>
          <p className="text-sm text-muted-foreground">V4.9.2</p>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-xl mb-4">
          <button
            onClick={() => toast({ 
              title: "Version Update", 
              description: "Version 4.10.3 available" 
            })}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-t-xl border-b border-border"
            data-testid="button-version-update"
          >
            <span className="text-foreground">Version Update</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm text-muted-foreground">4.10.3</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
          
          <button
            onClick={() => setLocation("/feedback")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 border-b border-border"
            data-testid="button-feedback"
          >
            <span className="text-foreground">Give Us Feedback</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => setLocation("/terms-of-use")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-b-xl"
            data-testid="button-terms"
          >
            <span className="text-foreground">Term of Use</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-12">
          © 2025 Lumirra
        </div>
      </div>
    </div>
  );
}
