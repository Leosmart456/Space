import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Image as ImageIcon, X, MessageSquare, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DefaultAvatar } from "@/components/default-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SupportMessage {
  senderId: string;
  senderType: "user" | "admin";
  senderName: string;
  content: string;
  imageUrl?: string | null;
  timestamp: string;
}

interface SupportChat {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "active" | "closed";
  messages: SupportMessage[];
  unreadUserCount: number;
  unreadAdminCount: number;
  lastMessageAt: string;
}

export default function SupportChat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();

  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<SupportMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const notificationsMarkedRef = useRef(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const { data: chat, isLoading } = useQuery<SupportChat>({
    queryKey: ["/api/support-chat"],
    refetchInterval: 5000, // Poll every 5 seconds for faster updates (WebSocket provides real-time updates as primary method)
    refetchOnMount: true, // Always fetch fresh data when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Mark all support chat notifications as read when user views the chat
  const markSupportChatNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-support-chat-read", {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      return response.json();
    },
    retry: 2, // Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff: 1s, 2s, max 5s
    onSuccess: () => {
      // Mark as successful only after mutation completes
      notificationsMarkedRef.current = true;
      // Invalidate notification queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: (error) => {
      // Log error after all retries exhausted
      console.error("Failed to mark support chat notifications as read after retries:", error);
      // Optionally show a toast to inform user
      toast({
        title: "Unable to mark notifications as read",
        description: "Please refresh the page if notifications still appear unread",
        variant: "destructive",
      });
    },
  });

  // Mark notifications as read when user opens the chat (once per page visit)
  useEffect(() => {
    if (isAuthenticated && !isLoading && chat && !notificationsMarkedRef.current) {
      notificationsMarkedRef.current = true;
      markSupportChatNotificationsReadMutation.mutate();
    }
  }, [isAuthenticated, isLoading, chat?._id]);

  // WebSocket connection for real-time chat updates with auto-reconnect
  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000; // Max 30 seconds
    let reconnectTimeout: NodeJS.Timeout;
    let isIntentionalClose = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for support chat');
        reconnectAttempts = 0; // Reset on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'support_chat_message' || data.type === 'support_chat_message_edited') {
            // Refresh chat data to get the new or edited message
            queryClient.invalidateQueries({ queryKey: ["/api/support-chat"] });
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        
        // Only reconnect if not intentionally closed and still authenticated
        if (!isIntentionalClose && isAuthenticated) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
          reconnectAttempts++;
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages, optimisticMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ optimisticId, content, image }: { optimisticId: string; content: string; image: File | null }) => {
      const formData = new FormData();
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/support-chat/messages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      return response.json();
    },
    onMutate: async ({ optimisticId, content, image }) => {
      // Add optimistic message immediately
      const optimisticMessage: SupportMessage = {
        senderId: "temp",
        senderType: "user",
        senderName: "You",
        content,
        imageUrl: image ? URL.createObjectURL(image) : null,
        timestamp: new Date().toISOString(),
      };
      setOptimisticMessages(prev => [...prev, { ...optimisticMessage, optimisticId } as any]);
      
      return { optimisticId };
    },
    onSuccess: (data, variables, context) => {
      // Remove only the specific optimistic message that got confirmed
      setOptimisticMessages(prev => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      queryClient.invalidateQueries({ queryKey: ["/api/support-chat"] });
    },
    onError: (error: Error, variables, context) => {
      // Remove the failed optimistic message
      setOptimisticMessages(prev => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !selectedImage) || sendMessageMutation.isPending) {
      return;
    }
    const optimisticId = `temp-${Date.now()}`;
    const content = message;
    const image = selectedImage;
    
    // Clear inputs immediately
    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    sendMessageMutation.mutate({ optimisticId, content, image });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover-elevate"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Support Chat
                </h1>
                <p className="text-xs text-muted-foreground">Our team typically responds within 24 hours</p>
              </div>
            </div>
            {chat && chat.status === "active" && (
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container max-w-3xl mx-auto px-4 py-6">
          {!chat || chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Welcome to Support</h2>
              <p className="text-muted-foreground max-w-md mb-2">
                Our dedicated support team is here to help you with any questions or concerns.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>We typically respond within 24 hours</span>
              </div>
              <Card className="mt-8 max-w-md">
                <CardContent className="py-4">
                  <h3 className="font-semibold mb-2 text-sm">How can we help you today?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• Account and wallet questions</li>
                    <li>• Transaction support</li>
                    <li>• Technical issues</li>
                    <li>• General inquiries</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Merge and sort messages chronologically with stable tie-breaker
                const allMessages = [...chat.messages, ...optimisticMessages].sort((a: any, b: any) => {
                  const timeA = new Date(a.timestamp).getTime();
                  const timeB = new Date(b.timestamp).getTime();
                  
                  // Primary sort by timestamp
                  if (timeA !== timeB) {
                    return timeA - timeB;
                  }
                  
                  // Tie-breaker: confirmed messages (no optimisticId) come before optimistic ones
                  const aIsOptimistic = !!a.optimisticId;
                  const bIsOptimistic = !!b.optimisticId;
                  
                  if (aIsOptimistic && !bIsOptimistic) return 1;  // b comes first
                  if (!aIsOptimistic && bIsOptimistic) return -1; // a comes first
                  return 0;
                });
                
                return allMessages.map((msg: any, index) => {
                  const isUser = msg.senderType === "user";
                  const showDate = index === 0 || 
                    new Date(allMessages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                  
                  // Use stable unique key
                  const messageKey = msg.optimisticId || `msg-${msg.senderId}-${msg.timestamp}`;
                  
                  return (
                    <div key={messageKey}>
                    {showDate && (
                      <div className="flex items-center justify-center my-6">
                        <div className="bg-muted px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleDateString([], { 
                              weekday: "short", 
                              month: "short", 
                              day: "numeric",
                              year: new Date(msg.timestamp).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        {!isUser && (
                          <DefaultAvatar
                            profilePhoto={null}
                            firstName="Support"
                            lastName="Team"
                            size="md"
                            className="flex-shrink-0 border-2 border-primary/20"
                          />
                        )}
                        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          {!isUser && (
                            <span className="text-xs font-semibold text-muted-foreground mb-1 px-1">
                              Support Team
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border"
                            }`}
                          >
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Uploaded"
                                className="max-w-full rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: "300px" }}
                                onClick={() => window.open(msg.imageUrl!, "_blank")}
                              />
                            )}
                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 px-1">
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-24 w-24 rounded-lg object-cover border-2 border-border"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover-elevate active-elevate-2"
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending}
              data-testid="button-image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 h-10"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending}
              className="h-10 px-4"
              data-testid="button-send"
            >
              {sendMessageMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
