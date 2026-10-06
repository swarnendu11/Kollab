import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const globalForDb = globalThis as unknown as {
  dbInstance?: any;
  pgliteInstance?: PGlite;
  initPromise?: Promise<any>;
};

export async function getDb() {
  if (globalForDb.dbInstance) {
    return globalForDb.dbInstance;
  }

  if (globalForDb.initPromise) {
    return await globalForDb.initPromise;
  }

  globalForDb.initPromise = (async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && databaseUrl.trim() !== "") {
      try {
        const client = postgres(databaseUrl, { max: 10 });
        const instance = drizzlePostgres(client, { schema });
        globalForDb.dbInstance = instance;
        return instance;
      } catch (err) {
        console.warn("Could not connect to external PostgreSQL, falling back to local PGlite engine:", err);
      }
    }

    // Local persistent PGlite storage
    const dataDir = path.join(process.cwd(), "data", "kollab-pg");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!globalForDb.pgliteInstance) {
      try {
        const pidFile = path.join(dataDir, "postmaster.pid");
        if (fs.existsSync(pidFile)) {
          try { fs.unlinkSync(pidFile); } catch {}
        }
        const lockFile = path.join(dataDir, ".s.PGSQL.5432.lock.out");
        if (fs.existsSync(lockFile)) {
          try { fs.unlinkSync(lockFile); } catch {}
        }

        const pglite = new PGlite(dataDir);
        await pglite.waitReady;
        await initializeTables(pglite);
        globalForDb.pgliteInstance = pglite;
      } catch (diskErr) {
        console.warn("Could not start PGlite with disk storage, falling back to in-memory:", diskErr);
        const pglite = new PGlite();
        await pglite.waitReady;
        await initializeTables(pglite);
        globalForDb.pgliteInstance = pglite;
      }
    }

    const instance = drizzlePglite(globalForDb.pgliteInstance, { schema });
    globalForDb.dbInstance = instance;
    return instance;
  })();

  return await globalForDb.initPromise;
}

async function initializeTables(client: PGlite) {
  // Better Auth required tables
  await client.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN DEFAULT FALSE NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS session_userId_idx ON "session"(user_id);

    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE INDEX IF NOT EXISTS account_userId_idx ON "account"(user_id);

    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification"(identifier);
  `);

  // App tables
  await client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member' NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      host_id TEXT NOT NULL REFERENCES users(id),
      scheduled_start TIMESTAMP,
      scheduled_end TIMESTAMP,
      actual_start TIMESTAMP,
      actual_end TIMESTAMP,
      status TEXT DEFAULT 'scheduled' NOT NULL,
      passcode TEXT,
      join_code TEXT NOT NULL UNIQUE,
      room_name TEXT NOT NULL,
      waiting_room_enabled BOOLEAN DEFAULT FALSE NOT NULL,
      recording_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      chat_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      screen_share_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meeting_participants (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      display_name TEXT NOT NULL,
      role TEXT DEFAULT 'participant' NOT NULL,
      is_muted BOOLEAN DEFAULT FALSE NOT NULL,
      is_camera_off BOOLEAN DEFAULT FALSE NOT NULL,
      is_hand_raised BOOLEAN DEFAULT FALSE NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      left_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0 NOT NULL,
      file_url TEXT NOT NULL,
      storage_path TEXT,
      file_size_bytes INTEGER DEFAULT 0,
      thumbnail_url TEXT,
      status TEXT DEFAULT 'ready' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
      recording_id TEXT REFERENCES recordings(id) ON DELETE CASCADE,
      full_text TEXT NOT NULL,
      language TEXT DEFAULT 'en' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
      speaker_name TEXT NOT NULL,
      speaker_id TEXT,
      start_time_seconds INTEGER NOT NULL,
      end_time_seconds INTEGER NOT NULL,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meeting_summaries (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      summary_text TEXT NOT NULL,
      key_decisions JSONB DEFAULT '[]',
      topics JSONB DEFAULT '[]',
      important_moments JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meeting_action_items (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      task TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_id TEXT REFERENCES users(id),
      due_date TEXT,
      status TEXT DEFAULT 'todo' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_direct BOOLEAN DEFAULT FALSE NOT NULL,
      organization_id TEXT REFERENCES organizations(id),
      created_by TEXT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      chat_room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      sender_name TEXT NOT NULL,
      sender_avatar TEXT,
      message_text TEXT NOT NULL,
      attachments JSONB DEFAULT '[]',
      parent_message_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_user_id TEXT REFERENCES users(id),
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_avatar TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      timezone TEXT DEFAULT 'UTC' NOT NULL,
      recurrence TEXT,
      reminders JSONB DEFAULT '["15m", "1h"]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id),
      author_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      template_type TEXT DEFAULT 'general',
      is_public BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whiteboards (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id),
      author_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      canvas_data JSONB DEFAULT '[]',
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_category TEXT NOT NULL,
      download_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      owner_name TEXT NOT NULL,
      creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      due_date TEXT,
      priority TEXT DEFAULT 'medium' NOT NULL,
      status TEXT DEFAULT 'todo' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      metadata JSONB DEFAULT '{}',
      ip_address TEXT,
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_usage (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
      storage_bytes INTEGER DEFAULT 0 NOT NULL,
      recording_minutes INTEGER DEFAULT 0 NOT NULL,
      meeting_minutes INTEGER DEFAULT 0 NOT NULL,
      ai_usage_count INTEGER DEFAULT 0 NOT NULL,
      transcript_minutes INTEGER DEFAULT 0 NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Apply column additions if tables already existed
    DO $$ BEGIN
      ALTER TABLE meetings ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id);
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE recordings ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id);
    EXCEPTION WHEN OTHERS THEN NULL; END $$;
  `);

  // Check if workspace organization exists, if not seed workspace
  const res = await client.query("SELECT COUNT(*) FROM organizations;");
  const count = parseInt((res.rows[0] as any)?.count || "0", 10);
  if (count === 0) {
    await seedInitialData(client);
  }
}

async function seedInitialData(client: PGlite) {
  await client.exec(`
    -- Organizations
    INSERT INTO organizations (id, name, slug) VALUES
    ('org_kollab', 'Kollab Workspace', 'kollab-workspace')
    ON CONFLICT (id) DO NOTHING;

    -- Users
    INSERT INTO users (id, email, full_name, role, status, avatar_url) VALUES
    ('usr_demo_admin', 'alex.rivera@kollab.io', 'Alex Rivera', 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('usr_sarah_chen', 'sarah.chen@kollab.io', 'Sarah Chen', 'admin', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
    ('usr_marcus_vance', 'marcus.v@kollab.io', 'Marcus Vance', 'member', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('usr_priya_sharma', 'priya@kollab.io', 'Priya Sharma', 'member', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    ('usr_david_kim', 'david.k@kollab.io', 'David Kim', 'member', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
    ON CONFLICT (id) DO NOTHING;

    -- Organization Members
    INSERT INTO organization_members (id, organization_id, user_id, role) VALUES
    ('om_1', 'org_kollab', 'usr_demo_admin', 'admin'),
    ('om_2', 'org_kollab', 'usr_sarah_chen', 'admin'),
    ('om_3', 'org_kollab', 'usr_marcus_vance', 'member'),
    ('om_4', 'org_kollab', 'usr_priya_sharma', 'member'),
    ('om_5', 'org_kollab', 'usr_david_kim', 'member')
    ON CONFLICT (id) DO NOTHING;

    -- Standard Workspace Channels
    INSERT INTO chat_rooms (id, name, is_direct, organization_id, created_by) VALUES
    ('channel_general', 'general', FALSE, 'org_kollab', 'usr_demo_admin'),
    ('channel_announcements', 'announcements', FALSE, 'org_kollab', 'usr_demo_admin'),
    ('channel_engineering', 'engineering', FALSE, 'org_kollab', 'usr_marcus_vance'),
    ('channel_design', 'design', FALSE, 'org_kollab', 'usr_sarah_chen'),
    ('channel_product', 'product', FALSE, 'org_kollab', 'usr_priya_sharma'),
    ('channel_random', 'random', FALSE, 'org_kollab', 'usr_demo_admin')
    ON CONFLICT (id) DO NOTHING;

    -- Chat Messages
    INSERT INTO chat_messages (id, chat_room_id, sender_id, sender_name, sender_avatar, message_text) VALUES
    ('msg_1', 'channel_general', 'usr_sarah_chen', 'Sarah Chen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Welcome to Kollab 2.0! The new UI with multi-color themes and live audio filters is looking stunning.'),
    ('msg_2', 'channel_general', 'usr_marcus_vance', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'WebRTC sub-second latency is verified on all streams. Ready for today''s product review sync!'),
    ('msg_3', 'channel_general', 'usr_demo_admin', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Great work everyone! Let''s make sure to test the whiteboard and screen share during the meeting.'),
    ('msg_4', 'channel_engineering', 'usr_marcus_vance', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'PostgreSQL PGlite embedded engine is online and ultra fast.'),
    ('msg_5', 'channel_engineering', 'usr_david_kim', 'David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Hardware check and audio level monitoring are functioning smoothly.')
    ON CONFLICT (id) DO NOTHING;

    -- Contacts
    INSERT INTO contacts (id, user_id, contact_user_id, contact_name, contact_email, contact_avatar, phone, status) VALUES
    ('cnt_1', 'usr_demo_admin', 'usr_sarah_chen', 'Sarah Chen', 'sarah.chen@kollab.io', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '+1 (555) 234-5678', 'active'),
    ('cnt_2', 'usr_demo_admin', 'usr_marcus_vance', 'Marcus Vance', 'marcus.v@kollab.io', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '+1 (555) 345-6789', 'active'),
    ('cnt_3', 'usr_demo_admin', 'usr_priya_sharma', 'Priya Sharma', 'priya@kollab.io', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '+1 (555) 456-7890', 'active'),
    ('cnt_4', 'usr_demo_admin', 'usr_david_kim', 'David Kim', 'david.k@kollab.io', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '+1 (555) 567-8901', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Meetings
    INSERT INTO meetings (id, title, description, host_id, scheduled_start, scheduled_end, status, join_code, room_name, waiting_room_enabled, recording_enabled, chat_enabled, screen_share_enabled) VALUES
    ('meet_product_sync', 'Weekly Product Design Sync', 'Reviewing UI components, design tokens, and next release milestones with design & engineering.', 'usr_demo_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', 'scheduled', 'klb-design-q4', 'room_klb_design_q4', FALSE, TRUE, TRUE, TRUE),
    ('meet_eng_standup', 'Engineering Sprint Standup', 'Daily technical alignment on media pipelines, database indexes, and real-time socket connections.', 'usr_marcus_vance', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '3 hours', 'scheduled', 'klb-eng-daily', 'room_klb_eng_daily', FALSE, TRUE, TRUE, TRUE),
    ('meet_ai_brainstorm', 'AI Workflow & Architecture Brainstorm', 'Exploring live transcription, intelligent meeting summaries, and automated action item extraction.', 'usr_sarah_chen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', 'live', 'klb-ai-brainstorm', 'room_klb_ai_brainstorm', FALSE, TRUE, TRUE, TRUE),
    ('meet_q3_retrospective', 'Q3 Platform Retrospective', 'Quarterly retrospective on platform stability, client adoption, and feedback reviews.', 'usr_demo_admin', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '23 hours', 'ended', 'klb-retro-q3', 'room_klb_retro_q3', FALSE, TRUE, TRUE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Meeting Summaries & Action Items
    INSERT INTO meeting_summaries (id, meeting_id, summary_text, key_decisions, topics, important_moments) VALUES
    ('sum_retro', 'meet_q3_retrospective', 'The Q3 platform review highlighted massive gains in meeting connection speeds and stability. The team finalized the migration to the new vibrant 3-color palette (Indigo, Emerald, Coral) and agreed on autonomous action item workflows.',
     '["Standardize on Indigo for primary navigation, Emerald for live active indicators, Coral for alerts & CTAs", "Enable in-meeting collaborative whiteboard as a default feature", "Roll out Web Audio sound effects for celebratory reactions"]'::jsonb,
     '["WebRTC Media Pipeline", "Design System Revamp", "PGlite Storage Persistence", "AI Note Generation"]'::jsonb,
     '["00:04:12 - Demo of real-time camera lighting enhancement", "00:15:30 - Consensus on 3-color theme adoption", "00:28:45 - LiveKit WebRTC peer audio latency validation"]'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO meeting_action_items (id, meeting_id, task, owner_name, owner_id, status) VALUES
    ('act_1', 'meet_q3_retrospective', 'Deploy live hardware device check modal with speaker chime test', 'David Kim', 'usr_david_kim', 'completed'),
    ('act_2', 'meet_q3_retrospective', 'Integrate interactive collaborative whiteboard drawer directly into call room', 'Sarah Chen', 'usr_sarah_chen', 'completed'),
    ('act_3', 'meet_q3_retrospective', 'Publish Q4 product roadmap document for team access', 'Alex Rivera', 'usr_demo_admin', 'completed')
    ON CONFLICT (id) DO NOTHING;

    -- Calendar Events
    INSERT INTO calendar_events (id, user_id, meeting_id, title, description, start_time, end_time) VALUES
    ('cal_1', 'usr_demo_admin', 'meet_product_sync', 'Weekly Product Design Sync', 'Reviewing UI components, design tokens, and next release milestones.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    ('cal_2', 'usr_demo_admin', 'meet_eng_standup', 'Engineering Sprint Standup', 'Daily technical alignment on media pipelines and database indexes.', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '3 hours'),
    ('cal_3', 'usr_demo_admin', 'meet_ai_brainstorm', 'AI Workflow & Architecture Brainstorm', 'Exploring live transcription and intelligent meeting summaries.', CURRENT_TIMESTAMP + INTERVAL '5 hours', CURRENT_TIMESTAMP + INTERVAL '6 hours')
    ON CONFLICT (id) DO NOTHING;

    -- Documents
    INSERT INTO documents (id, organization_id, author_id, title, content, template_type, is_public) VALUES
    ('doc_q4_plan', 'org_kollab', 'usr_demo_admin', 'Q4 Product Roadmap & Vision', '# Kollab Q4 Product Roadmap & Architecture Vision

## Executive Summary
Kollab delivers an all-in-one unified workspace combining HD video conferencing, real-time team chat, smart calendar scheduling, collaborative documents, visual whiteboards, and AI meeting intelligence.

---

### Core Pillars
1. **Ultra-Low Latency Video & Audio**: WebRTC peer-to-peer and SFU infrastructure with adaptive bitrate and AI noise reduction.
2. **Autonomous AI Meeting Assistant**: Automatic live captions, speaker diarization, instant takeaways, and action item synchronization.
3. **Harmonious Modern Design**: A vibrant 3-color design system featuring Electric Indigo, Vibrant Emerald, and Warm Sunset Coral.
4. **Zero-Friction Collaboration**: One-click instant rooms, mobile QR code entry, and integrated drawing tools.

---

### Upcoming Milestones
- [x] Multi-color visual design refresh & user-friendly controls
- [x] Audio/Video device diagnostic & testing suite
- [x] In-meeting collaborative whiteboard drawer
- [x] PGlite local database persistence
- [ ] Mobile native applications (iOS / Android)
', 'specs', TRUE),
    ('doc_eng_guidelines', 'org_kollab', 'usr_marcus_vance', 'WebRTC Architecture & Media Pipeline', '# WebRTC Architecture & Security Protocols

## Media Pipeline Overview
- **Video Codecs**: VP9 / VP8 with automatic SVC (Scalable Video Coding)
- **Audio Codecs**: Opus 48kHz stereo with dynamic DTX
- **Encryption**: DTLS-SRTP end-to-end media encryption

## Real-Time Audio Filtering
- Hardware-accelerated Web Audio API nodes
- Real-time frequency binning for speaking indicators
- Automatic gain control and echo cancellation
', 'engineering', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Whiteboards
    INSERT INTO whiteboards (id, organization_id, author_id, title, canvas_data) VALUES
    ('wb_arch', 'org_kollab', 'usr_demo_admin', 'Cloud & WebRTC Architecture Diagram', '[]'::jsonb),
    ('wb_wireframe', 'org_kollab', 'usr_sarah_chen', 'Product Design Sprint Wireframes', '[]'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- Files
    INSERT INTO files (id, organization_id, user_id, name, file_path, file_size, mime_type, file_category, download_url) VALUES
    ('file_1', 'org_kollab', 'usr_demo_admin', 'Kollab_Pitch_Deck_2026.pdf', '/files/pitch-deck.pdf', '4.8 MB', 'application/pdf', 'document', '#'),
    ('file_2', 'org_kollab', 'usr_sarah_chen', 'Design_Tokens_and_Colors.json', '/files/tokens.json', '48 KB', 'application/json', 'code', '#'),
    ('file_3', 'org_kollab', 'usr_marcus_vance', 'WebRTC_Latency_Benchmarks.xlsx', '/files/benchmarks.xlsx', '1.2 MB', 'application/vnd.ms-excel', 'spreadsheet', '#'),
    ('file_4', 'org_kollab', 'usr_demo_admin', 'Brand_Identity_Guidelines.pdf', '/files/branding.pdf', '8.5 MB', 'application/pdf', 'document', '#')
    ON CONFLICT (id) DO NOTHING;

    -- Recordings
    INSERT INTO recordings (id, meeting_id, title, duration_seconds, file_url, storage_path, file_size_bytes, thumbnail_url, status) VALUES
    ('rec_1', 'meet_q3_retrospective', 'Q3 Platform Retrospective & Roadmap Session', 2140, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'recordings/rec_1.mp4', 145000000, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80', 'ready'),
    ('rec_2', 'meet_product_sync', 'Design System & UI Color Tokens Review', 1320, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'recordings/rec_2.mp4', 85000000, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80', 'ready')
    ON CONFLICT (id) DO NOTHING;
  `);
}

export { schema };
