import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Meetings Operations
 */
export async function createMeetingFirestore(data: {
  title: string;
  type: string;
  scheduledStart: Date | string;
  scheduledEnd?: Date | string;
  hostId: string;
  hostName: string;
  roomCode: string;
  joinCode: string;
}) {
  const meetingId = `meet_${Date.now()}`;
  const meetingRef = doc(db, "meetings", meetingId);
  const meetingPayload = {
    id: meetingId,
    title: data.title,
    type: data.type || "scheduled",
    status: "upcoming",
    scheduledStart: typeof data.scheduledStart === "string" ? data.scheduledStart : data.scheduledStart.toISOString(),
    scheduledEnd: data.scheduledEnd ? (typeof data.scheduledEnd === "string" ? data.scheduledEnd : data.scheduledEnd.toISOString()) : null,
    hostId: data.hostId,
    hostName: data.hostName,
    roomCode: data.roomCode,
    joinCode: data.joinCode,
    livekitRoom: `room-${data.roomCode}`,
    createdAt: serverTimestamp(),
  };

  await setDoc(meetingRef, meetingPayload);
  return meetingPayload;
}

export async function getMeetingsFirestore() {
  try {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (err) {
    console.warn("Firestore getMeetings fallback:", err);
    return [];
  }
}

/**
 * Realtime Chat Messages
 */
export async function sendChatMessageFirestore(channelId: string, message: {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
}) {
  const messagesRef = collection(db, "channels", channelId, "messages");
  const payload = {
    ...message,
    channelId,
    timestamp: new Date().toISOString(),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(messagesRef, payload);
  return { id: docRef.id, ...payload };
}

export function subscribeChannelMessages(channelId: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, "channels", channelId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(msgs);
  });
}

/**
 * Documents Firestore Sync
 */
export async function saveDocumentFirestore(docId: string, data: {
  title: string;
  content: string;
  authorId: string;
}) {
  const docRef = doc(db, "documents", docId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

export async function getDocumentFirestore(docId: string) {
  const docRef = doc(db, "documents", docId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Whiteboards Firestore Sync
 */
export async function saveWhiteboardFirestore(boardId: string, data: {
  title: string;
  strokes: any[];
  authorId: string;
}) {
  const boardRef = doc(db, "whiteboards", boardId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await setDoc(boardRef, payload, { merge: true });
  return payload;
}

export async function getWhiteboardFirestore(boardId: string) {
  const boardRef = doc(db, "whiteboards", boardId);
  const snap = await getDoc(boardRef);
  return snap.exists() ? snap.data() : null;
}
