import { useLocation } from "wouter";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Large 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <div className="relative -mt-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-muted-foreground/30" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation("/dashboard")}
            className="min-w-[140px]"
            data-testid="button-go-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="min-w-[140px]"
            data-testid="button-go-back"
          >
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          If you think this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
