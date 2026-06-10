import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";
import session from "express-session";
import type { Server } from "http";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private sessionParser: any;

  constructor(server: Server, sessionParser: any) {
    this.sessionParser = sessionParser;
    this.wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket upgrade - ONLY for /ws endpoint (not Vite HMR)
    server.on('upgrade', (request: IncomingMessage, socket, head) => {
      const url = parse(request.url || '', true);
      
      // Only handle /ws path - let Vite HMR and other WebSocket requests pass through
      if (url.pathname !== '/ws') {
        return; // Let other handlers (like Vite) deal with it
      }
      
      console.log('WebSocket upgrade request received for /ws');
      
      // Parse session from cookie
      this.sessionParser(request, {} as any, () => {
        const req = request as IncomingMessage & { session?: any };
        
        if (!req.session || !req.session.userId) {
          console.log('WebSocket upgrade rejected: no session');
          // Properly close the socket without sending HTTP response to WebSocket stream
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          const authWs = ws as AuthenticatedWebSocket;
          authWs.userId = req.session.userId;
          authWs.userEmail = req.session.userEmail;
          authWs.isAdmin = req.session.isAdmin;
          authWs.role = req.session.role;
          authWs.isAlive = true;

          this.wss.emit('connection', authWs, request);
        });
      });
    });

    // Handle new connections
    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      console.log(`WebSocket connected: userId=${ws.userId}, role=${ws.role}`);

      // Add to clients map
      if (ws.userId) {
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, new Set());
        }
        this.clients.get(ws.userId)!.add(ws);
      }

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: ws.userId,
        role: ws.role,
      }));

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`WebSocket disconnected: userId=${ws.userId}`);
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Heartbeat to detect dead connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (authWs.isAlive === false) {
          console.log(`Terminating dead WebSocket connection: userId=${authWs.userId}`);
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Send message to a specific user (all their connections)
  sendToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const messageStr = JSON.stringify(message);
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
      console.log(`Sent WebSocket message to user ${userId}:`, message.type);
    }
  }

  // Broadcast to all connected users (excluding admins if specified)
  broadcast(message: any, excludeAdmins = true) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((userClients, userId) => {
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          if (!excludeAdmins || !ws.isAdmin) {
            ws.send(messageStr);
          }
        }
      });
    });
    console.log(`Broadcast WebSocket message:`, message.type);
  }

  // Get connected user count
  getConnectedUsersCount(): number {
    return this.clients.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export let wsService: WebSocketService;

export function initializeWebSocket(server: Server, sessionParser: any) {
  wsService = new WebSocketService(server, sessionParser);
  console.log('WebSocket service initialized');
  return wsService;
}
