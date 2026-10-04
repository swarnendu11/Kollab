"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  MessageSquare,
  Video,
  Calendar,
  Phone,
  Search,
  Check,
  Loader2,
  X,
} from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => {
        if (d.contacts) setContacts(d.contacts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: name.trim(),
          contactEmail: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (data.contact) {
        setContacts((prev) => [...prev, data.contact]);
      }
      setAddModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = search.trim() === ""
    ? contacts
    : contacts.filter(
        (c) =>
          c.contactName.toLowerCase().includes(search.toLowerCase()) ||
          c.contactEmail.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Contacts & Colleagues
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Start direct chats, 1:1 video meetings, or schedule appointments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAddModalOpen(true)}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No contacts found</h3>
            <p className="text-xs text-slate-500 mt-1">Add colleagues to start instant collaboration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={c.contactAvatar} />
                    <AvatarFallback>{c.contactName[0]}</AvatarFallback>
                  </Avatar>
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

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link href="/chat" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold rounded-xl h-8 text-[#10B981] border-emerald-100 hover:bg-emerald-50 gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </Button>
                  </Link>

                  <Link href="/meeting/new" className="flex-1">
                    <Button
                      size="sm"
                      className="w-full text-xs font-semibold rounded-xl h-8 bg-[#10B981] hover:bg-[#059669] text-white gap-1.5 shadow-sm shadow-emerald-500/20"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  placeholder="e.g. Sarah Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. sarah.chen@kollab.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                disabled={!name.trim() || !email.trim()}
                className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs mt-2 shadow-sm shadow-emerald-500/20"
              >
                Add Contact
              </Button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
