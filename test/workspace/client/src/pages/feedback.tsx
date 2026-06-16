import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Feedback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState("general");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });
      setIsSubmitting(false);
      setFeedback("");
      setTimeout(() => {
        setLocation("/settings/about");
      }, 1000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/about")}
              data-testid="button-back"
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">Give Us Feedback</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-2xl">
        {/* Introduction */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            We'd love to hear your thoughts! Your feedback helps us improve the Lumirra App experience.
          </p>
        </div>

        {/* Feedback Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Feedback Type
          </label>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger data-testid="select-feedback-type">
              <SelectValue placeholder="Select feedback type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Feedback</SelectItem>
              <SelectItem value="bug">Report a Bug</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="ui">UI/UX Improvement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feedback Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Your Feedback
          </label>
          <Textarea
            placeholder="Share your thoughts, suggestions, or report issues..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[200px] resize-none"
            data-testid="textarea-feedback"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {feedback.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !feedback.trim()}
          data-testid="button-submit-feedback"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>

        {/* Info */}
        <div className="mt-8 p-4 bg-card rounded-xl">
          <h3 className="font-medium mb-2">Response Time</h3>
          <p className="text-sm text-muted-foreground">
            We typically review feedback within 1-3 business days. For urgent issues, please contact our support team directly.
          </p>
        </div>
      </div>
    </div>
  );
}
