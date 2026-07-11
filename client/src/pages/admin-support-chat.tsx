import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Loader2, Search, Send, Pencil, Check, X, ArrowLeft, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import AdminLayout from "@/components/admin-layout";

export default function AdminSupportChat() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedChatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/admin/auth/me"],
    retry: false,
  });

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ["/api/admin/support-chat"],
    refetchInterval: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const allChats = (chatsData as any)?.chats || [];

  const filteredChats = allChats.filter((chat: any) => {
    const searchLower = search.toLowerCase();
    if (!searchLower) return true;
    return (
      chat.user?.firstName?.toLowerCase().includes(searchLower) ||
      chat.user?.lastName?.toLowerCase().includes(searchLower) ||
      chat.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) return;

    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000;
    let isIntentionalClose = false;

    const connect = () => {
      const wsBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "") : window.location.host;
      const wsProtocol = import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.startsWith("https") ? "wss:" : "ws:") : (window.location.protocol === "https:" ? "wss:" : "ws:");
      const wsUrl = `${wsProtocol}//${wsBase}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => { reconnectAttempts = 0; };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "support_chat_message" || data.type === "support_chat_message_edited") {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
            const currentChat = selectedChatRef.current;
            if (currentChat && data.userId === currentChat.userId) {
              fetch(`/api/admin/support-chat/${currentChat.userId}`, { credentials: "include" })
                .then((res) => res.json())
                .then((chatData) => setSelectedChat(chatData))
                .catch(console.error);
            }
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!isIntentionalClose && currentUser?.isAdmin) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [currentUser]);

  useEffect(() => {
    setOptimisticMessages([]);
  }, [selectedChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages, optimisticMessages]);

  const sendMutation = useMutation({
    mutationFn: async ({ optimisticId, userId, content }: { optimisticId: string; userId: string; content: string }) => {
      const formData = new FormData();
      formData.append("content", content);
      const response = await fetch(`/api/admin/support-chat/${userId}/messages`, {
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
    onMutate: async ({ optimisticId, content }) => {
      const optimisticMessage = {
        content,
        senderType: "admin",
        timestamp: new Date().toISOString(),
        optimisticId,
      };
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
      return { optimisticId };
    },
    onSuccess: (data, variables, context) => {
      setOptimisticMessages((prev) => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
      if (selectedChat) {
        fetch(`/api/admin/support-chat/${selectedChat.userId}`, { credentials: "include" })
          .then((res) => res.json())
          .then((data) => setSelectedChat(data))
          .catch(console.error);
      }
    },
    onError: (error: Error, variables, context) => {
      setOptimisticMessages((prev) => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ userId, messageIndex, content }: { userId: string; messageIndex: number; content: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/support-chat/${userId}/messages/${messageIndex}`, { content });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit message");
      }
      return response.json();
    },
    onSuccess: () => {
      setEditingIndex(null);
      setEditingContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
      if (selectedChat) {
        fetch(`/api/admin/support-chat/${selectedChat.userId}`, { credentials: "include" })
          .then((res) => res.json())
          .then((data) => setSelectedChat(data))
          .catch(console.error);
      }
      toast({ title: "Success", description: "Message edited" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await apiRequest("PUT", `/api/admin/support-chats/${chatId}/mark-read`, {});
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
    },
  });

  useEffect(() => {
    if (selectedChat?._id && selectedChat.unreadAdminCount > 0) {
      markReadMutation.mutate(selectedChat._id);
    }
  }, [selectedChat?._id]);

  const handleSend = () => {
    if (!message.trim() || !selectedChat) return;
    const optimisticId = `optimistic-${Date.now()}`;
    sendMutation.mutate({ optimisticId, userId: selectedChat.userId, content: message.trim() });
    setMessage("");
  };

  const handleSelectChat = async (chat: any) => {
    try {
      const response = await fetch(`/api/admin/support-chat/${chat.userId}`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSelectedChat(data);
        setShowMobileSidebar(false);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  const handleMobileBack = () => {
    setShowMobileSidebar(true);
    setSelectedChat(null);
  };

  const allMessages = [...(selectedChat?.messages || []), ...optimisticMessages];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const SidebarPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-chat-search"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No chats found</p>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat: any) => {
              const lastMessage = chat.messages?.[chat.messages.length - 1];
              const unread = chat.messages?.filter((m: any) => !m.isFromAdmin && !m.readByAdmin).length || 0;
              const isSelected = selectedChat?.userId === chat.userId;
              return (
                <div
                  key={chat._id}
                  className={`p-3 cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                  onClick={() => handleSelectChat(chat)}
                  data-testid={`chat-item-${chat.userId}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarFallback className="text-sm font-semibold">
                        {chat.user?.firstName?.[0]}{chat.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">
                          {chat.user?.firstName} {chat.user?.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {lastMessage && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(lastMessage.timestamp)}
                            </span>
                          )}
                          {unread > 0 && (
                            <Badge className="h-5 min-w-5 p-0 px-1 flex items-center justify-center text-xs">
                              {unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMessage?.content || (lastMessage?.imageUrl ? "Image" : "No messages")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const ChatPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleMobileBack}
          data-testid="button-chat-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-sm font-semibold">
            {selectedChat.user?.firstName?.[0]}{selectedChat.user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {selectedChat.user?.firstName} {selectedChat.user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{selectedChat.user?.email}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {allMessages.map((msg: any, index: number) => {
            const isAdmin = msg.senderType === "admin" || msg.isFromAdmin;
            const showDate =
              index === 0 || formatDate(msg.timestamp) !== formatDate(allMessages[index - 1]?.timestamp);

            return (
              <div key={msg.optimisticId || index}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isAdmin ? "order-2" : ""}`}>
                    {editingIndex === index ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              editMutation.mutate({ userId: selectedChat.userId, messageIndex: index, content: editingContent });
                            }
                            if (e.key === "Escape") { setEditingIndex(null); setEditingContent(""); }
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            editMutation.mutate({ userId: selectedChat.userId, messageIndex: index, content: editingContent })
                          }
                          disabled={editMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => { setEditingIndex(null); setEditingContent(""); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="group relative">
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 ${
                            isAdmin
                              ? "bg-[#0084ff] text-white rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          } ${msg.optimisticId ? "opacity-70" : ""}`}
                        >
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="max-w-full rounded-lg mb-1.5"
                            />
                          )}
                          {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                          <p className={`text-[10px] mt-1 ${isAdmin ? "text-white/60" : "text-muted-foreground"}`}>
                            {formatTime(msg.timestamp)}
                            {msg.edited && " · edited"}
                          </p>
                        </div>
                        {isAdmin && !msg.optimisticId && (
                          <button
                            className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            onClick={() => { setEditingIndex(index); setEditingContent(msg.content); }}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            data-testid="button-send-message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Support Chat">
      <div className="h-[calc(100dvh-56px)] flex overflow-hidden">
        {/* Sidebar — always visible on desktop; visible on mobile only when showMobileSidebar */}
        <div
          className={`
            flex-shrink-0 border-r bg-background flex flex-col
            w-full md:w-80
            ${selectedChat && !showMobileSidebar ? "hidden md:flex" : "flex"}
          `}
        >
          <SidebarPanel />
        </div>

        {/* Chat panel — always visible on desktop when chat selected; visible on mobile only when chat selected */}
        <div
          className={`
            flex-1 flex flex-col bg-background min-w-0
            ${!selectedChat ? "hidden md:flex" : "flex"}
            ${showMobileSidebar ? "hidden md:flex" : "flex"}
          `}
        >
          {selectedChat ? (
            <ChatPanel />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
