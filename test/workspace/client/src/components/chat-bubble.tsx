import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { FaFacebookMessenger } from "react-icons/fa";

interface SupportChatUnreadCount {
  unreadCount: number;
}

export function ChatBubble() {
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  // Fetch unread count (use separate endpoint that doesn't reset count)
  // WebSocket updates handled by global WebSocketProvider
  const { data: chatData } = useQuery<SupportChatUnreadCount>({
    queryKey: ["/api/support-chat/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/support-chat/unread-count", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    refetchInterval: 60000, // Fallback polling every 60 seconds (WebSocket is primary)
  });

  // Initialize position to right edge
  useEffect(() => {
    const savedPosition = localStorage.getItem("chatBubblePosition");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default to right edge, vertically centered
      const defaultX = window.innerWidth - 80; // 80px from right
      const defaultY = window.innerHeight / 2 - 32; // Centered vertically
      setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chatBubblePosition", JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Don't start drag if clicking the X button
    }
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Don't start drag if touching the X button
    }
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Constrain to viewport bounds
    const maxX = window.innerWidth - 64; // 64px bubble width
    const maxY = window.innerHeight - 64; // 64px bubble height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.current.x;
    const newY = touch.clientY - dragOffset.current.y;
    
    // Constrain to viewport bounds
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const snapToEdge = () => {
    const centerX = position.x + 32; // Center of bubble
    const centerY = position.y + 32;
    
    const margin = 16; // Distance from edge
    
    // Calculate distances to each edge
    const distToLeft = centerX;
    const distToRight = window.innerWidth - centerX;
    const distToTop = centerY;
    const distToBottom = window.innerHeight - centerY;
    
    // Find the closest edge
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    
    let snapX, snapY;
    
    if (minDist === distToLeft) {
      // Snap to left edge
      snapX = margin;
      snapY = position.y; // Keep current Y position
    } else if (minDist === distToRight) {
      // Snap to right edge
      snapX = window.innerWidth - 64 - margin;
      snapY = position.y; // Keep current Y position
    } else if (minDist === distToTop) {
      // Snap to top edge
      snapX = position.x; // Keep current X position
      snapY = margin;
    } else {
      // Snap to bottom edge
      snapX = position.x; // Keep current X position
      snapY = window.innerHeight - 64 - margin;
    }
    
    // Ensure the bubble stays within bounds on the other axis
    if (minDist === distToLeft || minDist === distToRight) {
      // Snapping to left or right - constrain Y
      const maxY = window.innerHeight - 64 - margin;
      snapY = Math.max(margin, Math.min(snapY, maxY));
    } else {
      // Snapping to top or bottom - constrain X
      const maxX = window.innerWidth - 64 - margin;
      snapX = Math.max(margin, Math.min(snapX, maxX));
    }
    
    setPosition({ x: snapX, y: snapY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      snapToEdge();
      setIsDragging(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Don't navigate if clicking the X button
    }
    
    // Check if this was a drag or a click
    const dragDistance = Math.sqrt(
      Math.pow(dragStartPos.current.x - e.clientX, 2) +
      Math.pow(dragStartPos.current.y - e.clientY, 2)
    );
    
    // If moved less than 5px, consider it a click
    if (dragDistance < 5) {
      setLocation("/support-chat");
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, position]);

  // Only show when there are unread messages
  const unreadCount = chatData?.unreadCount || 0;
  if (unreadCount === 0) return null;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 cursor-grab active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      data-testid="chat-bubble"
    >
      <div className="relative">
        {/* Main Chat Bubble - Messenger Style */}
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center hover-elevate active-elevate-2 transition-transform duration-200">
          <FaFacebookMessenger className="h-8 w-8 text-white" />
        </div>
        
        {/* Unread Badge */}
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
          data-testid="chat-bubble-unread-badge"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      </div>
    </div>
  );
}
