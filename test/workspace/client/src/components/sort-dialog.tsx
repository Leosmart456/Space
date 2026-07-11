import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, MoreVertical } from "lucide-react";

interface SortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

export function SortDialog({
  open,
  onOpenChange,
  selectedSort,
  onSortChange,
}: SortDialogProps) {
  const sortOptions = [
    { id: "custom", label: "Custom Sorting" },
    { id: "value", label: "By Value" },
    { id: "name", label: "By Name" },
    { id: "amount", label: "By Amount" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Sort</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
              data-testid="button-close-sort"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSortChange(option.id);
                onOpenChange(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                selectedSort === option.id
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted/50 border-2 border-transparent hover:bg-muted"
              }`}
              data-testid={`button-sort-${option.id}`}
            >
              <span className="font-medium">{option.label}</span>
              <div className="flex items-center gap-2">
                {selectedSort === option.id && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                {option.id === "custom" && selectedSort === option.id && (
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
