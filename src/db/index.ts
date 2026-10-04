import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let dbInstance: any = null;
let pgliteInstance: PGlite | null = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== "") {
    try {
      const client = postgres(databaseUrl, { max: 10 });
      dbInstance = drizzlePostgres(client, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Could not connect to external PostgreSQL, falling back to local PGlite engine:", err);
    }
  }

  // Local persistent PGlite storage
  const dataDir = path.join(process.cwd(), "data", "kollab-pg");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  pgliteInstance = new PGlite(dataDir);
  await pgliteInstance.waitReady;

  // Initialize tables
  await initializeTables(pgliteInstance);

  dbInstance = drizzlePglite(pgliteInstance, { schema });
  return dbInstance;
}

async function initializeTables(client: PGlite) {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
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
  `);

  // Check if initial users exist, if not seed
  const res = await client.query("SELECT COUNT(*) FROM users;");
  const count = parseInt((res.rows[0] as any)?.count || "0", 10);
  if (count === 0) {
    await seedInitialData(client);
  }
}

async function seedInitialData(client: PGlite) {
  // Users
  await client.exec(`
    INSERT INTO users (id, email, full_name, avatar_url, role) VALUES
    ('user_alex', 'alex.morgan@kollab.io', 'Alex Morgan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin'),
    ('user_sarah', 'sarah.chen@kollab.io', 'Sarah Chen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'member'),
    ('user_david', 'david.kim@kollab.io', 'David Kim', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'member'),
    ('user_elena', 'elena.rostova@kollab.io', 'Elena Rostova', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'member');

    INSERT INTO organizations (id, name, slug) VALUES
    ('org_kollab', 'Kollab Core Team', 'kollab-team');

    INSERT INTO organization_members (id, organization_id, user_id, role) VALUES
    ('om_1', 'org_kollab', 'user_alex', 'owner'),
    ('om_2', 'org_kollab', 'user_sarah', 'admin'),
    ('om_3', 'org_kollab', 'user_david', 'member'),
    ('om_4', 'org_kollab', 'user_elena', 'member');

    -- Meetings
    INSERT INTO meetings (id, title, description, host_id, scheduled_start, scheduled_end, status, join_code, room_name) VALUES
    ('meet_product_sync', 'Weekly Product Design Sync', 'Review Q4 roadmap, video calling UX, and user test feedback.', 'user_alex', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'scheduled', 'klb-sync-q4', 'room_klb_sync_q4'),
    ('meet_standup', 'Engineering Daily Standup', 'Unblockers, PR reviews, WebRTC pipeline optimizations.', 'user_alex', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '4 hours 30 minutes', 'scheduled', 'klb-eng-daily', 'room_klb_eng_daily'),
    ('meet_all_hands', 'Company All-Hands & Demo Day', 'Company-wide updates, live AI feature demos, and open Q&A.', 'user_alex', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'scheduled', 'klb-all-hands', 'room_klb_all_hands');

    -- Past Meeting & Recording
    INSERT INTO meetings (id, title, description, host_id, actual_start, actual_end, status, join_code, room_name) VALUES
    ('meet_past_launch', 'Kollab 2.0 Launch Strategy', 'Finalizing go-to-market plan, marketing launch, and target dates.', 'user_alex', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', 'ended', 'klb-launch-review', 'room_launch_review');

    INSERT INTO recordings (id, meeting_id, title, duration_seconds, file_url, file_size_bytes, thumbnail_url, status) VALUES
    ('rec_1', 'meet_past_launch', 'Kollab 2.0 Launch Strategy - Session Recording', 2700, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 184500000, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600', 'ready');

    INSERT INTO transcripts (id, meeting_id, recording_id, full_text, language) VALUES
    ('tr_1', 'meet_past_launch', 'rec_1', '00:02 Sarah: Let us review the launch timeline. We want the WebRTC media pipeline verified by Friday. 00:35 Alex: I agree, October 21 is our target demo date. 01:12 David: I will handle the background effects and real-time captioning pipeline.', 'en');

    INSERT INTO transcript_segments (id, transcript_id, speaker_name, start_time_seconds, end_time_seconds, text) VALUES
    ('ts_1', 'tr_1', 'Sarah Chen', 2, 28, 'Let us review the launch timeline. We want the WebRTC media pipeline verified by Friday.'),
    ('ts_2', 'tr_1', 'Alex Morgan', 35, 65, 'I agree, October 21 is our target demo date. Audio cancellation and lighting filters are ready.'),
    ('ts_3', 'tr_1', 'David Kim', 72, 110, 'I will handle the background effects and real-time captioning pipeline.');

    INSERT INTO meeting_summaries (id, meeting_id, summary_text, key_decisions, topics, important_moments) VALUES
    ('sum_1', 'meet_past_launch', 'The team aligned on the Kollab 2.0 release date. WebRTC media streaming and AI summaries have passed performance benchmarks. Noise cancellation standard mode is enabled by default.', 
     '["Target launch date finalized for October 21", "Noise suppression default set to Standard", "Realtime captioning enabled across all meeting tiers"]'::jsonb,
     '["Launch Strategy", "WebRTC Media Performance", "AI Summaries Rollout"]'::jsonb,
     '[{"time": "00:02", "title": "Opening & Roadmap Review", "note": "Sarah presented the Q4 milestones"}, {"time": "00:35", "title": "Launch Date Decision", "note": "Alex confirmed October 21 target"}]'::jsonb);

    INSERT INTO meeting_action_items (id, meeting_id, task, owner_name, due_date, status) VALUES
    ('ai_1', 'meet_past_launch', 'Benchmark WebRTC audio quality on high packet-loss networks', 'David Kim', 'Tomorrow, 5:00 PM', 'in_progress'),
    ('ai_2', 'meet_past_launch', 'Finalize marketing announcement copy and social banners', 'Sarah Chen', 'Friday, 12:00 PM', 'todo'),
    ('ai_3', 'meet_past_launch', 'Deploy live database migrations and verify S3 storage bucket policies', 'Alex Morgan', 'Today, 8:00 PM', 'done');

    -- Chat channels
    INSERT INTO chat_rooms (id, name, is_direct, organization_id, created_by) VALUES
    ('channel_general', 'general', FALSE, 'org_kollab', 'user_alex'),
    ('channel_engineering', 'engineering', FALSE, 'org_kollab', 'user_alex'),
    ('channel_design', 'design', FALSE, 'org_kollab', 'user_sarah'),
    ('channel_product', 'product', FALSE, 'org_kollab', 'user_sarah'),
    ('channel_random', 'random', FALSE, 'org_kollab', 'user_david');

    INSERT INTO chat_messages (id, chat_room_id, sender_id, sender_name, sender_avatar, message_text) VALUES
    ('msg_1', 'channel_general', 'user_alex', 'Alex Morgan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Welcome to Kollab! Excited to collaborate with everyone across meetings, chat, docs, and whiteboards.'),
    ('msg_2', 'channel_general', 'user_sarah', 'Sarah Chen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'The new UI palette and meeting controls feel super snappy. Loving the AI summaries!'),
    ('msg_3', 'channel_engineering', 'user_david', 'David Kim', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'WebRTC peer connection and audio filter pass-through are live. Testing screen sharing now.');

    -- Contacts
    INSERT INTO contacts (id, user_id, contact_user_id, contact_name, contact_email, contact_avatar, phone) VALUES
    ('cont_1', 'user_alex', 'user_sarah', 'Sarah Chen', 'sarah.chen@kollab.io', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '+1 (555) 234-5678'),
    ('cont_2', 'user_alex', 'user_david', 'David Kim', 'david.kim@kollab.io', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+1 (555) 345-6789'),
    ('cont_3', 'user_alex', 'user_elena', 'Elena Rostova', 'elena.rostova@kollab.io', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '+1 (555) 456-7890');

    -- Documents
    INSERT INTO documents (id, organization_id, author_id, title, content, template_type) VALUES
    ('doc_q4_plan', 'org_kollab', 'user_alex', 'Q4 Product Roadmap & Vision', '# Q4 Product Roadmap & Vision\n\n## 1. Executive Summary\nKollab is the unified AI workspace combining video meetings, team chat, calendar, collaborative documents, whiteboards, and intelligent action item management.\n\n## 2. Core Pillars\n- **Crystal-Clear Meetings**: WebRTC HD video, noise cancellation, lighting enhancement.\n- **Autonomous Intelligence**: Summaries, transcripts, meeting preparation, and message rewriting.\n- **Integrated Collaboration**: Whiteboards, live docs, and instant files.', 'project_brief'),
    ('doc_spec', 'org_kollab', 'user_sarah', 'WebRTC Media Pipeline Architecture', '# WebRTC Media Pipeline Architecture\n\n## Architecture Overview\n1. Participant Video Track -> Video Canvas Enhancement (low-light correction, blur)\n2. Participant Audio Track -> Web Audio Biquad/DynamicsCompressor (noise gate, cancellation)\n3. Recording Engine -> MediaRecorder API to WebM/MP4 -> Object Storage\n4. Realtime Speech -> Web Speech Recognition -> Realtime Subtitles + Translation.', 'general');

    -- Whiteboards
    INSERT INTO whiteboards (id, organization_id, author_id, title, canvas_data) VALUES
    ('wb_arch', 'org_kollab', 'user_alex', 'Kollab Architecture Diagram', '[{"type":"rect","x":100,"y":120,"width":200,"height":90,"color":"#635BFF","label":"Next.js App Router"},{"type":"rect","x":380,"y":120,"width":200,"height":90,"color":"#10B981","label":"PostgreSQL + Drizzle"},{"type":"rect","x":660,"y":120,"width":200,"height":90,"color":"#3B82F6","label":"LiveKit WebRTC"},{"type":"arrow","fromX":300,"fromY":165,"toX":380,"toY":165},{"type":"arrow","fromX":580,"fromY":165,"toX":660,"toY":165}]'::jsonb);

    -- Notifications
    INSERT INTO notifications (id, user_id, type, title, message, link) VALUES
    ('notif_1', 'user_alex', 'meeting_starting', 'Weekly Product Design Sync starts in 1 hour', 'Your scheduled meeting is coming up. Prejoin is available now.', '/meeting/meet_product_sync/prejoin'),
    ('notif_2', 'user_alex', 'recording_ready', 'Recording Ready: Kollab 2.0 Launch Strategy', 'The recording and AI transcript for your launch meeting are ready for review.', '/recordings'),
    ('notif_3', 'user_alex', 'chat_message', 'Sarah Chen sent a message in #general', 'The new UI palette and meeting controls feel super snappy!', '/chat');

    -- Files
    INSERT INTO files (id, organization_id, user_id, name, file_path, file_size, mime_type, file_category, download_url) VALUES
    ('file_1', 'org_kollab', 'user_alex', 'Kollab_Brand_Guidelines_2026.pdf', '/files/kollab_brand.pdf', '3.4 MB', 'application/pdf', 'document', '#'),
    ('file_2', 'org_kollab', 'user_sarah', 'Product_Architecture_Diagram.png', '/files/product_arch.png', '1.8 MB', 'image/png', 'image', '#'),
    ('file_3', 'org_kollab', 'user_david', 'WebRTC_Latency_Benchmark_Report.csv', '/files/latency_report.csv', '480 KB', 'text/csv', 'document', '#');

    -- Calendar events
    INSERT INTO calendar_events (id, user_id, meeting_id, title, description, start_time, end_time, timezone) VALUES
    ('cal_1', 'user_alex', 'meet_product_sync', 'Weekly Product Design Sync', 'Review Q4 roadmap and UX designs', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'America/New_York'),
    ('cal_2', 'user_alex', 'meet_standup', 'Engineering Daily Standup', 'Daily sprint sync and PR reviews', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '4 hours 30 minutes', 'America/New_York');
  `);
}

export { schema };
