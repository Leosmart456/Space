import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWallet } from "@/contexts/wallet-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const addTokenSchema = z.object({
  chainId: z.string().min(1, "Chain is required"),
  contractAddress: z.string().min(1, "Contract address is required"),
});

type AddTokenForm = z.infer<typeof addTokenSchema>;

interface AddTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTokenDialog({ open, onOpenChange }: AddTokenDialogProps) {
  const { walletId } = useWallet();
  const { toast } = useToast();
  const [validatedToken, setValidatedToken] = useState<{
    name: string;
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: chains = [] } = useQuery<any[]>({
    queryKey: ["/api/chains"],
  });

  const form = useForm<AddTokenForm>({
    resolver: zodResolver(addTokenSchema),
    defaultValues: {
      chainId: "",
      contractAddress: "",
    },
  });

  const validateTokenMutation = useMutation({
    mutationFn: async (data: AddTokenForm) => {
      const response = await apiRequest("POST", "/api/tokens/validate", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setValidatedToken({
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
      });
      toast({
        title: "Token validated",
        description: `Found ${data.symbol} - ${data.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Validation failed",
        description: "Invalid token contract address or unsupported chain",
        variant: "destructive",
      });
    },
  });

  const addTokenMutation = useMutation({
    mutationFn: async () => {
      if (!validatedToken) return;
      
      const data = {
        chainId: form.getValues("chainId"),
        contractAddress: form.getValues("contractAddress"),
        symbol: validatedToken.symbol,
        name: validatedToken.name,
        decimals: validatedToken.decimals,
      };

      const response = await apiRequest("POST", `/api/wallet/${walletId}/tokens`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "tokens"] });
      
      toast({
        title: "Token added",
        description: `${validatedToken?.symbol} has been added to your wallet`,
      });
      
      // Reset and close
      form.reset();
      setValidatedToken(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      // Check if it's a duplicate token error
      const errorMessage = error.message || "";
      if (errorMessage.includes("Token already added to wallet")) {
        toast({
          title: "Token already exists",
          description: `${validatedToken?.symbol} is already in your wallet`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Failed to add token",
        description: "Could not add token to wallet",
        variant: "destructive",
      });
    },
  });

  const handleValidate = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsValidating(true);
    validateTokenMutation.mutate(form.getValues());
    setIsValidating(false);
  };

  const handleAddToken = () => {
    addTokenMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setValidatedToken(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-add-token">
        <DialogHeader>
          <DialogTitle>Add Custom Token</DialogTitle>
          <DialogDescription>
            Enter a token contract address to add it to your wallet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="chainId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Network</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!validatedToken}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-chain">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chains.map((chain: any) => (
                        <SelectItem
                          key={chain.id}
                          value={chain.id}
                          data-testid={`option-chain-${chain.id}`}
                        >
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0x..."
                      disabled={!!validatedToken}
                      data-testid="input-contract-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {validatedToken && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Token Validated</span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p data-testid="text-token-name">
                    <span className="font-medium">Name:</span> {validatedToken.name}
                  </p>
                  <p data-testid="text-token-symbol">
                    <span className="font-medium">Symbol:</span> {validatedToken.symbol}
                  </p>
                  <p data-testid="text-token-decimals">
                    <span className="font-medium">Decimals:</span> {validatedToken.decimals}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!validatedToken ? (
                <Button
                  type="button"
                  onClick={handleValidate}
                  disabled={isValidating || validateTokenMutation.isPending}
                  className="flex-1"
                  data-testid="button-validate-token"
                >
                  {isValidating || validateTokenMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate Token"
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValidatedToken(null)}
                    className="flex-1"
                    data-testid="button-change-token"
                  >
                    Change Token
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddToken}
                    disabled={addTokenMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-add-token"
                  >
                    {addTokenMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Token"
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
