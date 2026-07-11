import { ArrowUpRight, ArrowDownLeft, Repeat, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionRowProps {
  type: "send" | "receive" | "swap";
  status: "pending" | "confirmed" | "failed";
  amount: string;
  tokenSymbol: string;
  timestamp: string;
  to?: string;
  from?: string;
  hash: string;
  onClick?: () => void;
}

export function TransactionRow({
  type,
  status,
  amount,
  tokenSymbol,
  timestamp,
  hash,
  onClick
}: TransactionRowProps) {
  const getIcon = () => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="h-4 w-4" />;
      case "receive":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "swap":
        return <Repeat className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="gap-1 text-success border-success/50">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="gap-1 text-destructive border-destructive/50">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-lg hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`row-transaction-${hash}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          type === "send" ? "bg-destructive/10 text-destructive" :
          type === "receive" ? "bg-success/10 text-success" :
          "bg-accent/10 text-accent"
        }`}>
          {getIcon()}
        </div>
        <div>
          <p className="font-medium capitalize">{type}</p>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p className="font-semibold">
          {type === "send" ? "-" : "+"}{amount} {tokenSymbol}
        </p>
        {getStatusBadge()}
      </div>
    </div>
  );
}
