/**
 * Socket Module - Public API
 * 
 * This module provides WebSocket push notification capabilities.
 * 
 * Server-side:
 * - initSocketServer() - Initialize with HTTP server
 * - emitToUser() - Push to specific user
 * - pushNotificationToSocket() - Convenient wrapper for notifications
 * 
 * Client-side:
 * - Use socket.io-client directly (see client hook)
 */

// Server exports
export {
    initSocketServer,
    getSocketServer,
    isSocketServerAvailable,
    emitToUser,
    emitToUsers,
    getConnectedUserCount,
    isUserConnected,
} from "./server";

// Push emitter exports
export {
    pushNotificationToSocket,
} from "./push";

// Type exports
export type {
    SocketNotificationPayload,
    SocketAuthPayload,
    SocketEventMap,
} from "./types";
