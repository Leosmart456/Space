import { Delete } from "lucide-react";

interface NumericKeyboardProps {
  pin: string[];
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  pinLength?: number;
  title?: string;
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
}

export function NumericKeyboard({
  pin,
  onNumberClick,
  onDelete,
  pinLength = 6,
  title = "Enter PIN",
  showForgotPassword = false,
  onForgotPassword,
}: NumericKeyboardProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-between p-4 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
          <h2 className="text-xl mb-8" data-testid="text-pin-prompt">
            {title}
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

          {showForgotPassword && (
            <button
              data-testid="button-forgot-password"
              onClick={onForgotPassword}
              className="text-primary hover-elevate active-elevate-2 px-4 py-2 rounded-md"
            >
              Forgot Password
            </button>
          )}
        </div>

        <div className="w-full max-w-md">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                data-testid={`button-num-${num}`}
                onClick={() => onNumberClick(num.toString())}
                className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 text-xl font-medium"
              >
                {num}
              </button>
            ))}
            <div className="h-16"></div>
            <button
              data-testid="button-num-0"
              onClick={() => onNumberClick("0")}
              className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 text-xl font-medium"
            >
              0
            </button>
            <button
              data-testid="button-delete"
              onClick={onDelete}
              className="h-16 rounded-lg bg-muted hover-elevate active-elevate-2 flex items-center justify-center"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
