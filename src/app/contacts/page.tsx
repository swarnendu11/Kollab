"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import {
  Users,
  Plus,
  MessageSquare,
  Video,
  Calendar,
  Search,
  Check,
  Loader2,
  X,
  UserPlus,
  Trash2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { fetchJsonWithTimeout } from "@/lib/client-fetch";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dbSearchResults, setDbSearchResults] = useState<any[]>([]);
  const [searchingDb, setSearchingDb] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedContactForSchedule, setSelectedContactForSchedule] = useState<any>(null);

  // Add Contact Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Schedule Meeting Form State
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Load existing contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ contacts: any[] }>("/api/contacts");
      setContacts(data.contacts || []);
    } catch (err: any) {
      console.error("[Contacts] Load error:", err);
      setError(err?.message || "Failed to load contacts directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Modal Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (addModalOpen) setAddModalOpen(false);
        if (scheduleModalOpen) setScheduleModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addModalOpen, scheduleModalOpen]);

  // Live database search for users by email or username
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setDbSearchResults([]);
      setSearchingDb(false);
      return;
    }

    setSearchingDb(true);
    const timeout = setTimeout(async () => {
      try {
        const d = await fetchJsonWithTimeout<{ users: any[] }>(
          `/api/contacts/search?q=${encodeURIComponent(search.trim())}`
        );
        setDbSearchResults(d.users || []);
      } catch {
        setDbSearchResults([]);
      } finally {
        setSearchingDb(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  // Save a found user directly to contacts
  const handleSaveFoundUser = async (user: any) => {
    setActionError(null);
    try {
      const data = await fetchJsonWithTimeout<{ contact: any }>("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: user.fullName,
          contactEmail: user.email,
          contactUserId: user.id,
        }),
      });
      if (data.contact) {
        setContacts((prev) => {
          if (prev.some((c) => c.id === data.contact.id)) return prev;
          return [data.contact, ...prev];
        });
        setDbSearchResults((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isSaved: true } : u))
        );
      }
    } catch (e: any) {
      console.error("[Contacts] Save user error:", e);
      setActionError(e?.message || "Failed to save contact.");
    }
  };

  // Add contact via form
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setAddError(null);
    try {
      const data = await fetchJsonWithTimeout<{ contact: any }>("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: name.trim(),
          contactEmail: email.trim(),
          phone: phone.trim(),
        }),
      });
      if (data.contact) {
        setContacts((prev) => [data.contact, ...prev]);
      }
      setAddModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
    } catch (e: any) {
      console.error("[Contacts] Add error:", e);
      setAddError(e?.message || "Failed to save contact.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to remove this contact?")) return;
    setActionError(null);
    try {
      await fetchJsonWithTimeout(`/api/contacts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      console.error("[Contacts] Delete error:", e);
      setActionError(e?.message || "Failed to delete contact.");
    }
  };

  // Start instant 1:1 chat
  const handleStartChat = async (contact: any) => {
    try {
      if (contact.contactUserId) {
        const data = await fetchJsonWithTimeout<{ channel: any }>("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDirect: true,
            recipientId: contact.contactUserId,
            name: contact.contactName,
          }),
        });
        if (data.channel?.id) {
          router.push(`/chat?channel=${data.channel.id}`);
          return;
        }
      }
      router.push("/chat");
    } catch {
      router.push("/chat");
    }
  };

  // Start instant 1:1 video call
  const handleStartCall = async (contact: any) => {
    try {
      const data = await fetchJsonWithTimeout<{ meeting: any }>("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Call with ${contact.contactName}`,
          isInstant: true,
        }),
      });
      if (data.meeting?.id) {
        if (contact.contactUserId) {
          fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isDirect: true,
              recipientId: contact.contactUserId,
              name: contact.contactName,
            }),
          })
            .then((r) => r.json())
            .then((cd) => {
              if (cd.channel?.id) {
                fetch(`/api/chat/${cd.channel.id}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    text: `📞 Started a video call. Join here: /meeting/${data.meeting.id}/prejoin (Join Code: ${data.meeting.joinCode})`,
                  }),
                });
              }
            })
            .catch(() => {});
        }
        router.push(`/meeting/${data.meeting.id}/prejoin`);
      } else {
        router.push("/meeting/new");
      }
    } catch {
      router.push("/meeting/new");
    }
  };

  // Schedule meeting with contact
  const handleOpenSchedule = (contact: any) => {
    setSelectedContactForSchedule(contact);
    setMeetingTitle(`Meeting with ${contact.contactName}`);
    setScheduleError(null);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !selectedContactForSchedule) return;

    setIsScheduling(true);
    setScheduleError(null);
    try {
      const startTime = new Date(`${meetingDate}T${meetingTime}:00`);
      const endTime = new Date(startTime.getTime() + parseInt(meetingDuration) * 60000);

      // Create meeting
      const meetData = await fetchJsonWithTimeout<{ meeting: any }>("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          description: `Scheduled meeting with ${selectedContactForSchedule.contactName} (${selectedContactForSchedule.contactEmail})`,
          scheduledStart: startTime,
          scheduledEnd: endTime,
        }),
      });

      // Create calendar event
      await fetchJsonWithTimeout("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          description: `Meeting with ${selectedContactForSchedule.contactName}`,
          startTime,
          endTime,
          meetingId: meetData.meeting?.id,
        }),
      });

      // Post invite notification to DM chat if registered user
      if (selectedContactForSchedule.contactUserId) {
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDirect: true,
            recipientId: selectedContactForSchedule.contactUserId,
            name: selectedContactForSchedule.contactName,
          }),
        })
          .then((r) => r.json())
          .then((cd) => {
            if (cd.channel?.id) {
              fetch(`/api/chat/${cd.channel.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `📅 Scheduled meeting "${meetingTitle}" for ${new Date(startTime).toLocaleString()}. Join Code: ${meetData.meeting?.joinCode}`,
                }),
              });
            }
          })
          .catch(() => {});
      }

      setScheduleModalOpen(false);
      setSelectedContactForSchedule(null);
      router.push("/calendar");
    } catch (e: any) {
      console.error("[Contacts] Schedule error:", e);
      setScheduleError(e?.message || "Failed to schedule meeting.");
    } finally {
      setIsScheduling(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Contacts & Colleagues
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Find contacts by email or username, chat in real-time, start calls, or schedule meetings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setAddError(null);
                setAddModalOpen(true);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Contact</span>
            </Button>
          </div>
        </div>

        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Bar with Live Database Directory Lookup */}
        <div className="space-y-3">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Search or find any user by email address or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl border-slate-200 bg-white shadow-2xs"
            />
            {searchingDb && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Database Directory Search Results */}
          {search.trim().length >= 2 && dbSearchResults.length > 0 && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5 max-w-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Found in Kollab Directory ({dbSearchResults.length})</span>
                </span>
                <span className="text-[11px] font-normal text-emerald-600">Save to your contacts</span>
              </div>

              <div className="space-y-1.5">
                {dbSearchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.fullName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {user.isSaved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                        <Check className="w-3 h-3" />
                        <span>Saved</span>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSaveFoundUser(user)}
                        className="h-7 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Save Contact</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacts Content States: Loading | Error | Success */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load contacts"
            message={error}
            onRetry={fetchContacts}
          />
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No contacts saved yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Search by email or username above to find colleagues and save them to your database, or add them manually.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={c.contactAvatar} />
                          <AvatarFallback>{c.contactName?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {c.contactName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {c.contactEmail}
                        </p>
                        {c.phone && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.phone}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteContact(c.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
                      title="Remove Contact"
                      aria-label="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Chat, Call, Schedule */}
                <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartChat(c)}
                    className="text-xs font-semibold rounded-xl h-8.5 text-emerald-700 border-emerald-200/80 hover:bg-emerald-50 gap-1 px-2 shadow-2xs"
                    title="Open Direct Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleStartCall(c)}
                    className="text-xs font-semibold rounded-xl h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2 shadow-sm shadow-emerald-500/20"
                    title="Start Live Video Call"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSchedule(c)}
                    className="text-xs font-semibold rounded-xl h-8.5 text-indigo-700 border-indigo-200/80 hover:bg-indigo-50 gap-1 px-2 shadow-2xs"
                    title="Schedule Meeting"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Schedule</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Add New Contact</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If this email belongs to a registered user, their account will be automatically linked.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (optional)
                </label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={!name.trim() || !email.trim() || isSubmitting}
                className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Contact to Database
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting with Contact Modal */}
      {scheduleModalOpen && selectedContactForSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setScheduleModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Schedule Meeting</h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
              <Avatar className="w-9 h-9">
                <AvatarImage src={selectedContactForSchedule.contactAvatar} />
                <AvatarFallback>{selectedContactForSchedule.contactName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">{selectedContactForSchedule.contactName}</p>
                <p className="text-[11px] text-slate-500 truncate">{selectedContactForSchedule.contactEmail}</p>
              </div>
            </div>

            {scheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title
                </label>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={!meetingTitle.trim() || isScheduling}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs mt-2 shadow-sm shadow-indigo-500/20"
              >
                {isScheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm & Schedule Meeting
              </Button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
