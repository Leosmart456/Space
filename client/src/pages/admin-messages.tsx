import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Loader2, Search, Send, Reply, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

export default function AdminMessages() {
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendUserPreview, setSendUserPreview] = useState<any>(null);

  const queryParams = {
    page,
    limit,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(search && { search }),
  };

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["/api/admin/messages", queryParams],
    queryFn: async () => {
      const queryString = new URLSearchParams(
        Object.entries(queryParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      const response = await fetch(`/api/admin/messages?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  const messages = (messagesData as any)?.messages || [];
  const pagination = (messagesData as any)?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  useEffect(() => {
    const fetchSendUserPreview = async () => {
      const input = sendEmail.trim();
      if (input.length > 0) {
        try {
          const response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.users && data.users.length > 0) {
              setSendUserPreview(data.users[0]);
            } else {
              setSendUserPreview(null);
            }
          } else {
            setSendUserPreview(null);
          }
        } catch (error) {
          setSendUserPreview(null);
        }
      } else {
        setSendUserPreview(null);
      }
    };

    const debounce = setTimeout(fetchSendUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [sendEmail]);

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, replyMessage }: { messageId: string; replyMessage: string }) => {
      const res = await apiRequest("POST", `/api/admin/messages/${messageId}/reply`, { replyMessage });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send reply");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Reply sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedMessage(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ email, subject, message }: { email: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/admin/messages/send", { email, subject, message });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Message sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setSendDialogOpen(false);
      setSendEmail("");
      setSendSubject("");
      setSendBody("");
      setSendUserPreview(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/messages/${messageId}/status`, { status });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "destructive",
      read: "secondary",
      replied: "default",
      resolved: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <AdminLayout title="Messages">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Contact Messages</CardTitle>
                <CardDescription className="text-xs">Manage user inquiries and feedback</CardDescription>
              </div>
              <Button onClick={() => setSendDialogOpen(true)} data-testid="button-send-message">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-3 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages found</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg: any) => (
                  <Card key={msg._id} className="hover-elevate">
                    <CardContent className="py-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm truncate">{msg.subject || "No Subject"}</p>
                              {getStatusBadge(msg.status)}
                              <Badge variant="outline" className="text-xs">{msg.type || "contact"}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{msg.email}</p>
                            {msg.userId && (
                              <p className="text-xs text-muted-foreground">
                                User: {msg.userId.firstName} {msg.userId.lastName}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm line-clamp-2">{msg.message}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMessage(msg);
                              setReplyDialogOpen(true);
                            }}
                            className="h-7"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Select
                            value={msg.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ messageId: msg._id, status })}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="read">Read</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Message</DialogTitle>
              <DialogDescription>
                Replying to: {selectedMessage?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedMessage?.subject}</p>
                <p className="text-sm mt-1">{selectedMessage?.message}</p>
              </div>
              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => replyMutation.mutate({ messageId: selectedMessage._id, replyMessage })}
                disabled={replyMutation.isPending || !replyMessage.trim()}
              >
                {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Direct Message</DialogTitle>
              <DialogDescription>
                Send an email to a user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User Email</Label>
                <Input
                  placeholder="user@example.com"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                />
                {sendUserPreview && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {sendUserPreview.firstName?.[0]}{sendUserPreview.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{sendUserPreview.firstName} {sendUserPreview.lastName}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Message subject"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message..."
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => sendMutation.mutate({ email: sendEmail, subject: sendSubject, message: sendBody })}
                disabled={sendMutation.isPending || !sendEmail.trim() || !sendSubject.trim() || !sendBody.trim()}
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
