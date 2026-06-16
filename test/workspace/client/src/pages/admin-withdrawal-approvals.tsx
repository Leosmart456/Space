import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, ArrowUpRight, User, Hash } from "lucide-react";

interface Approval {
  _id: string;
  amount: string;
  tokenSymbol: string;
  chainId: string;
  toAddress: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  userId?: { email: string; firstName: string; lastName: string };
  walletId?: { address: string; chainType: string };
  transactionId?: { hash: string; status: string };
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isPending,
}: {
  approval: Approval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}) {
  const isPendingStatus = approval.status === "pending";

  return (
    <Card data-testid={`card-withdrawal-${approval._id}`} className="mb-3">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-base">
              {approval.amount} {approval.tokenSymbol}
            </span>
            <Badge variant="outline" className="text-xs">
              {approval.chainId}
            </Badge>
          </div>
          <Badge
            variant={
              approval.status === "approved"
                ? "default"
                : approval.status === "rejected"
                ? "destructive"
                : "secondary"
            }
          >
            {approval.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {approval.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
            {approval.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
            {approval.status}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm">
          {approval.userId && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {approval.userId.firstName} {approval.userId.lastName} — {approval.userId.email}
              </span>
            </div>
          )}
          <div className="flex items-start gap-2 text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span className="break-all text-xs font-mono">{approval.toAddress}</span>
          </div>
          {approval.transactionId && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Hash className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span className="break-all text-xs font-mono">{approval.transactionId.hash}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(approval.createdAt).toLocaleString()}
          </p>
          {approval.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              Reviewed: {new Date(approval.reviewedAt).toLocaleString()}
            </p>
          )}
        </div>

        {isPendingStatus && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onApprove(approval._id)}
              disabled={isPending}
              data-testid={`button-approve-${approval._id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(approval._id)}
              disabled={isPending}
              data-testid={`button-reject-${approval._id}`}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminWithdrawalApprovals() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["/api/admin/withdrawal-approvals", "pending"],
    queryFn: () => fetch("/api/admin/withdrawal-approvals?status=pending").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ["/api/admin/withdrawal-approvals", "all"],
    queryFn: () => fetch("/api/admin/withdrawal-approvals?status=all").then((r) => r.json()),
    enabled: activeTab === "all",
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/admin/withdrawal-approvals/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-approvals"] });
      toast({ title: "Withdrawal approved", description: "Transaction marked as confirmed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve withdrawal.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/admin/withdrawal-approvals/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-approvals"] });
      toast({ title: "Withdrawal rejected", description: "Balance has been restored to the user." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject withdrawal.", variant: "destructive" });
    },
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending;
  const pendingApprovals: Approval[] = pendingData?.approvals || [];
  const allApprovals: Approval[] = allData?.approvals || [];

  return (
    <AdminLayout title="Pending Withdrawals">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Withdrawal Approvals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve or reject user withdrawal requests.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4" data-testid="tabs-withdrawal-approvals">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending
              {pendingApprovals.length > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingPending ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending withdrawals</p>
                <p className="text-sm mt-1">All withdrawal requests have been reviewed.</p>
              </div>
            ) : (
              <div>
                {pendingApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval._id}
                    approval={approval}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={(id) => rejectMutation.mutate(id)}
                    isPending={isMutating}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {loadingAll ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : allApprovals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No withdrawal requests yet</p>
              </div>
            ) : (
              <div>
                {allApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval._id}
                    approval={approval}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={(id) => rejectMutation.mutate(id)}
                    isPending={isMutating}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
