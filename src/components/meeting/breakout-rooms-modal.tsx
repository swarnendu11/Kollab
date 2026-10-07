"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Plus, Radio, ArrowRight, Check, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoomParticipantState } from "@/lib/use-livekit-room";

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  participants: RoomParticipantState[];
  isHost: boolean;
}

export function BreakoutRoomsModal({
  isOpen,
  onClose,
  meetingId,
  participants,
  isHost,
}: BreakoutRoomsModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeNotification, setActiveNotification] = useState("");

  const loadRooms = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/breakout-rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) loadRooms();
  }, [isOpen, meetingId]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newRoomName.trim() }),
      });
      setNewRoomName("");
      loadRooms();
    } catch {}
    setLoading(false);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", broadcastText: broadcastMessage.trim() }),
      });
      setBroadcastMessage("");
      setActiveNotification("Broadcast sent to all breakout rooms!");
      setTimeout(() => setActiveNotification(""), 3000);
    } catch {}
  };

  const handleCloseAll = async () => {
    if (!confirm("Close all breakout rooms and return everyone to the main meeting?")) return;
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close_all" }),
      });
      loadRooms();
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-[#253047] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#253047] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Breakout Rooms</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {/* Create Room Form (Host only) */}
          {isHost && (
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <Input
                placeholder="New Room Name (e.g. Brainstorming)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="bg-[#151D2E] border-[#253047] text-xs text-white"
              />
              <Button
                type="submit"
                disabled={loading || !newRoomName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 text-xs font-semibold gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Room
              </Button>
            </form>
          )}

          {/* Rooms List */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Rooms ({rooms.length})
            </div>

            {rooms.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#151D2E]/60 border border-[#253047] text-center text-slate-400">
                No breakout rooms created yet.
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3.5 rounded-2xl bg-[#151D2E] border border-[#253047] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{room.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {room.assignedParticipants?.length || 0} participants assigned
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    room.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    {room.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Broadcast to all rooms (Host only) */}
          {isHost && rooms.length > 0 && (
            <div className="pt-2 border-t border-[#253047] space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Broadcast Message to All Breakout Rooms
              </div>
              <form onSubmit={handleBroadcast} className="flex gap-2">
                <Input
                  placeholder="e.g. 5 minutes remaining, wrap up!"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="bg-[#151D2E] border-[#253047] text-xs text-white"
                />
                <Button
                  type="submit"
                  disabled={!broadcastMessage.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Broadcast
                </Button>
              </form>
              {activeNotification && (
                <p className="text-emerald-400 text-[11px] font-semibold">{activeNotification}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isHost && rooms.length > 0 && (
          <div className="px-6 py-3.5 border-t border-[#253047] bg-[#151D2E]/40 flex justify-between items-center">
            <Button
              onClick={handleCloseAll}
              variant="outline"
              className="text-xs bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600/20"
            >
              Close All Breakout Rooms
            </Button>
            <Button onClick={onClose} className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
