export type RealtimeEventType =
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "reaction.created"
  | "reaction.deleted"
  | "typing.started"
  | "typing.stopped"
  | "presence.updated"
  | "channel.created"
  | "channel.updated"
  | "member.added"
  | "member.removed"
  | "notification.created"
  | "meeting.started"
  | "meeting.ended"
  | "recording.ready"
  | "summary.ready"
  | "document.updated"
  | "whiteboard.updated"
  | "task.created"
  | "task.updated";

export interface RealtimeMessage {
  id: string;
  type: RealtimeEventType;
  organizationId: string;
  channelId?: string;
  senderId?: string;
  timestamp: string;
  payload: any;
}

type RealtimeSubscriber = (msg: RealtimeMessage) => void;

class RealtimeHub {
  private subscribers: Set<RealtimeSubscriber> = new Set();
  private presenceMap: Map<string, { userId: string; name: string; orgId: string; lastSeen: number; status: string }> = new Map();

  subscribe(subscriber: RealtimeSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  broadcast(message: RealtimeMessage): void {
    for (const sub of this.subscribers) {
      try {
        sub(message);
      } catch (err) {
        console.warn("Realtime subscriber error:", err);
      }
    }
  }

  updatePresence(userId: string, name: string, orgId: string, status: string = "online"): void {
    this.presenceMap.set(userId, {
      userId,
      name,
      orgId,
      lastSeen: Date.now(),
      status,
    });

    this.broadcast({
      id: `pres_${Date.now()}_${userId}`,
      type: "presence.updated",
      organizationId: orgId,
      senderId: userId,
      timestamp: new Date().toISOString(),
      payload: {
        userId,
        name,
        status,
        onlineUsers: Array.from(this.presenceMap.values()).filter(
          (u) => u.orgId === orgId && Date.now() - u.lastSeen < 60000
        ),
      },
    });
  }

  getOnlineUsers(orgId: string) {
    const cutoff = Date.now() - 60000;
    return Array.from(this.presenceMap.values()).filter(
      (u) => u.orgId === orgId && u.lastSeen > cutoff
    );
  }
}

// Global singleton across hot-reloads
const globalForRealtime = globalThis as unknown as {
  kollabRealtimeHub?: RealtimeHub;
};

export const realtimeHub = globalForRealtime.kollabRealtimeHub || new RealtimeHub();
if (process.env.NODE_ENV !== "production") {
  globalForRealtime.kollabRealtimeHub = realtimeHub;
}
