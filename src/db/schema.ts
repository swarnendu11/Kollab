import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index } from "drizzle-orm/pg-core";

// Users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("member"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations / Workspaces
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // 'owner' | 'admin' | 'member' | 'guest'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Meetings
export const meetings = pgTable("meetings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  hostId: text("host_id").notNull().references(() => users.id),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'live' | 'ended' | 'cancelled'
  passcode: text("passcode"),
  joinCode: text("join_code").notNull().unique(),
  roomName: text("room_name").notNull(),
  waitingRoomEnabled: boolean("waiting_room_enabled").default(false).notNull(),
  recordingEnabled: boolean("recording_enabled").default(true).notNull(),
  chatEnabled: boolean("chat_enabled").default(true).notNull(),
  screenShareEnabled: boolean("screen_share_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("meeting_host_idx").on(table.hostId),
  index("meeting_code_idx").on(table.joinCode),
]);

export const meetingParticipants = pgTable("meeting_participants", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("participant"), // 'host' | 'co-host' | 'participant' | 'viewer'
  isMuted: boolean("is_muted").default(false).notNull(),
  isCameraOff: boolean("is_camera_off").default(false).notNull(),
  isHandRaised: boolean("is_hand_raised").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const meetingInvites = pgTable("meeting_invites", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  status: text("status").default("pending").notNull(), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingSessions = pgTable("meeting_sessions", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const meetingEvents = pgTable("meeting_events", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingSettings = pgTable("meeting_settings", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
});

// Recordings & Transcripts
export const recordings = pgTable("recordings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  fileUrl: text("file_url").notNull(),
  storagePath: text("storage_path"),
  fileSizeBytes: integer("file_size_bytes").default(0),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").default("ready").notNull(), // 'processing' | 'ready' | 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recordingParticipants = pgTable("recording_participants", {
  id: text("id").primaryKey(),
  recordingId: text("recording_id").notNull().references(() => recordings.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
  recordingId: text("recording_id").references(() => recordings.id, { onDelete: "cascade" }),
  fullText: text("full_text").notNull(),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptSegments = pgTable("transcript_segments", {
  id: text("id").primaryKey(),
  transcriptId: text("transcript_id").notNull().references(() => transcripts.id, { onDelete: "cascade" }),
  speakerName: text("speaker_name").notNull(),
  speakerId: text("speaker_id"),
  startTimeSeconds: integer("start_time_seconds").notNull(),
  endTimeSeconds: integer("end_time_seconds").notNull(),
  text: text("text").notNull(),
});

// AI Meeting Summaries & Action Items
export const meetingSummaries = pgTable("meeting_summaries", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  summaryText: text("summary_text").notNull(),
  keyDecisions: jsonb("key_decisions").$type<string[]>().default([]),
  topics: jsonb("topics").$type<string[]>().default([]),
  importantMoments: jsonb("important_moments").$type<{ time: string; title: string; note: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingActionItems = pgTable("meeting_action_items", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  task: text("task").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerId: text("owner_id").references(() => users.id),
  dueDate: text("due_date"),
  status: text("status").default("todo").notNull(), // 'todo' | 'in_progress' | 'done'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat & Channels
export const chatRooms = pgTable("chat_rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "general", "engineering", or "Direct Message"
  isDirect: boolean("is_direct").default(false).notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMembers = pgTable("chat_members", {
  id: text("id").primaryKey(),
  chatRoomId: text("chat_room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  lastReadAt: timestamp("last_read_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  chatRoomId: text("chat_room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderAvatar: text("sender_avatar"),
  messageText: text("message_text").notNull(),
  attachments: jsonb("attachments").$type<{ name: string; url: string; size: string }[]>().default([]),
  parentMessageId: text("parent_message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatThreads = pgTable("chat_threads", {
  id: text("id").primaryKey(),
  parentMessageId: text("parent_message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  replyCount: integer("reply_count").default(0).notNull(),
  lastReplyAt: timestamp("last_reply_at").defaultNow(),
});

export const chatReactions = pgTable("chat_reactions", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactUserId: text("contact_user_id").references(() => users.id),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactAvatar: text("contact_avatar"),
  phone: text("phone"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  recurrence: text("recurrence"),
  reminders: jsonb("reminders").$type<string[]>().default(["15m", "1h"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  templateType: text("template_type").default("general"), // 'meeting_notes' | 'agenda' | 'project_brief' | 'general'
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentVersions = pgTable("document_versions", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  savedBy: text("saved_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentComments = pgTable("document_comments", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  commentText: text("comment_text").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Whiteboards
export const whiteboards = pgTable("whiteboards", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  canvasData: jsonb("canvas_data").$type<any[]>().default([]),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whiteboardObjects = pgTable("whiteboard_objects", {
  id: text("id").primaryKey(),
  whiteboardId: text("whiteboard_id").notNull().references(() => whiteboards.id, { onDelete: "cascade" }),
  objectType: text("object_type").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  properties: jsonb("properties").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files
export const files = pgTable("files", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: text("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileCategory: text("file_category").notNull(), // 'document' | 'video' | 'image' | 'archive' | 'audio'
  downloadUrl: text("download_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'meeting_invitation' | 'meeting_starting' | 'chat_message' | 'recording_ready'
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Conversations & Messages
export const aiConversations = pgTable("ai_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Device Sessions (for session handoff)
export const deviceSessions = pgTable("device_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // 'desktop' | 'mobile' | 'tablet'
  activeMeetingId: text("active_meeting_id"),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// User Settings & Preferences
export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system").notNull(),
  audioInputDevice: text("audio_input_device"),
  audioOutputDevice: text("audio_output_device"),
  videoInputDevice: text("video_input_device"),
  noiseSuppression: text("noise_suppression").default("standard").notNull(), // 'off' | 'standard' | 'strong'
  autoLighting: boolean("auto_lighting").default(true).notNull(),
  virtualBackground: text("virtual_background").default("none").notNull(),
});

export const meetingPreferences = pgTable("meeting_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  defaultMute: boolean("default_mute").default(false).notNull(),
  defaultCameraOff: boolean("default_camera_off").default(false).notNull(),
  autoRecord: boolean("auto_record").default(false).notNull(),
});

// Subscriptions & Plans
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceMonthly: integer("price_monthly").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  recordingHours: integer("recording_hours").notNull(),
  storageGb: integer("storage_gb").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status").default("active").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
});

// Tasks & Action Items Tracking
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  ownerName: text("owner_name").notNull(),
  creatorId: text("creator_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: text("due_date"),
  priority: text("priority").default("medium").notNull(), // 'low' | 'medium' | 'high' | 'urgent'
  status: text("status").default("todo").notNull(), // 'todo' | 'in_progress' | 'done' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tasks_org_idx").on(table.organizationId),
  index("tasks_owner_idx").on(table.ownerId),
]);

// Immutable Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("audit_org_idx").on(table.organizationId),
  index("audit_action_idx").on(table.action),
]);

// Workspace Usage Metering
export const workspaceUsage = pgTable("workspace_usage", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  storageBytes: integer("storage_bytes").default(0).notNull(),
  recordingMinutes: integer("recording_minutes").default(0).notNull(),
  meetingMinutes: integer("meeting_minutes").default(0).notNull(),
  aiUsageCount: integer("ai_usage_count").default(0).notNull(),
  transcriptMinutes: integer("transcript_minutes").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

