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
  `);

  // Check if workspace organization exists, if not seed workspace
  const res = await client.query("SELECT COUNT(*) FROM organizations;");
  const count = parseInt((res.rows[0] as any)?.count || "0", 10);
  if (count === 0) {
    await seedInitialData(client);
  }
}

async function seedInitialData(client: PGlite) {
  // Organizations
  await client.exec(`
    INSERT INTO organizations (id, name, slug) VALUES
    ('org_kollab', 'Kollab Workspace', 'kollab-workspace')
    ON CONFLICT DO NOTHING;

    -- Standard Workspace Channels
    INSERT INTO chat_rooms (id, name, is_direct, organization_id) VALUES
    ('channel_general', 'general', FALSE, 'org_kollab'),
    ('channel_announcements', 'announcements', FALSE, 'org_kollab'),
    ('channel_engineering', 'engineering', FALSE, 'org_kollab'),
    ('channel_random', 'random', FALSE, 'org_kollab')
    ON CONFLICT DO NOTHING;
  `);
}

export { schema };
