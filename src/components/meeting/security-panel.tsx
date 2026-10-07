"use client";

import React from "react";
import { X, Shield, Lock, Unlock, Users, MessageSquare, Monitor, Smile, Sparkles, FileText } from "lucide-react";

interface SecurityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  waitingRoomEnabled: boolean;
  onToggleWaitingRoom: () => void;
  chatEnabled: boolean;
  onToggleChat: () => void;
  screenShareEnabled: boolean;
  onToggleScreenShare: () => void;
  allowReactions: boolean;
  onToggleReactions: () => void;
  allowAiCopilot: boolean;
  onToggleAiCopilot: () => void;
  passcode?: string | null;
}

export function SecurityPanel({
  isOpen,
  onClose,
  isLocked,
  onToggleLock,
  waitingRoomEnabled,
  onToggleWaitingRoom,
  chatEnabled,
  onToggleChat,
  screenShareEnabled,
  onToggleScreenShare,
  allowReactions,
  onToggleReactions,
  allowAiCopilot,
  onToggleAiCopilot,
  passcode,
}: SecurityPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 sm:w-96 bg-[#0F172A] border-l border-[#253047] flex flex-col h-full z-20 animate-in slide-in-from-right duration-200 text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-[#253047] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm">Meeting Security & Permissions</h3>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings list */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
        {/* Meeting Lock */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#151D2E] border border-[#253047]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLocked ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"}`}>
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-slate-200">Lock Meeting</div>
              <div className="text-[11px] text-slate-400">
                {isLocked ? "No new participants can join" : "Anyone with the link can join"}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleLock}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              isLocked ? "bg-red-600" : "bg-slate-800"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isLocked ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Waiting Room */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#151D2E] border border-[#253047]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Enable Waiting Room</div>
              <div className="text-[11px] text-slate-400">Admit participants individually</div>
            </div>
          </div>
          <button
            onClick={onToggleWaitingRoom}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              waitingRoomEnabled ? "bg-emerald-500" : "bg-slate-800"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                waitingRoomEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Participant Privileges
          </div>

          <div className="space-y-2">
            {/* Allow Chat */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151D2E]/70 border border-[#253047]">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Allow Chat
              </span>
              <button
                onClick={onToggleChat}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  chatEnabled ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    chatEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Allow Screen Share */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151D2E]/70 border border-[#253047]">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                Allow Screen Sharing
              </span>
              <button
                onClick={onToggleScreenShare}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  screenShareEnabled ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    screenShareEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Allow Reactions */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151D2E]/70 border border-[#253047]">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Smile className="w-3.5 h-3.5 text-slate-400" />
                Allow Emoji Reactions
              </span>
              <button
                onClick={onToggleReactions}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  allowReactions ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    allowReactions ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Allow AI Copilot */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#151D2E]/70 border border-[#253047]">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Allow In-Meeting AI Copilot
              </span>
              <button
                onClick={onToggleAiCopilot}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  allowAiCopilot ? "bg-purple-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    allowAiCopilot ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Passcode display if set */}
        {passcode && (
          <div className="p-3.5 rounded-2xl bg-[#151D2E] border border-[#253047]">
            <div className="text-[11px] text-slate-400 mb-1">Meeting Passcode</div>
            <div className="font-mono text-sm font-bold text-slate-200 tracking-wider">{passcode}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
