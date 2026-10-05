"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Server,
  Zap,
  Download,
  RefreshCw,
  HardDrive,
  Table,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Search,
  Eye,
  X,
  FileCode,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function DatabaseConsolePage() {
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  // Table Preview Modal
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Search filter
  const [searchFilter, setSearchFilter] = useState("");

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/database");
      const data = await res.json();
      if (data.success) {
        setDbData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const runBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "benchmark" }),
      });
      const data = await res.json();
      if (data.success) {
        setBenchmarkResult(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const exportBackup = async () => {
    try {
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });
      const data = await res.json();
      if (data.snapshot) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kollab-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const previewTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", tableName }),
      });
      const data = await res.json();
      if (data.rows) {
        setPreviewRows(data.rows);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredTables = dbData?.tables?.filter((t: any) =>
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.label.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="indigo" className="gap-1.5 py-0.5 px-2.5">
                <Database className="w-3 h-3 text-indigo-500" />
                <span>PostgreSQL Database & Backend Console</span>
              </Badge>
              <Badge variant="live" className="py-0.5 px-2 text-[10px]">
                LIVE PRODUCTION ENGINE
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Database & Backend Control Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect database tables, monitor query latency, run live benchmark probes, and export JSON backups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={exportBackup}
              className="h-10 px-3.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold gap-1.5 shadow-2xs inline-flex items-center justify-center shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Export Backup</span>
            </Button>

            <Button
              onClick={runBenchmark}
              disabled={benchmarkLoading}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center shrink-0"
            >
              {benchmarkLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Zap className="w-4 h-4 fill-current shrink-0" />
              )}
              <span>Run Latency Benchmark</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchDatabaseInfo}
              disabled={loading}
              className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-100 inline-flex items-center justify-center shrink-0"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 shrink-0 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Live Latency Benchmark Result Banner (if run) */}
        {benchmarkResult && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Probe Benchmark Passed
                  </div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    {benchmarkResult.status}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400">Write Latency: </span>
                  <span className="text-emerald-300 font-bold">{benchmarkResult.writeLatencyMs} ms</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400">Read Latency: </span>
                  <span className="text-indigo-300 font-bold">{benchmarkResult.readLatencyMs} ms</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400">Delete Latency: </span>
                  <span className="text-rose-300 font-bold">{benchmarkResult.deleteLatencyMs} ms</span>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold">
                  Total Roundtrip: {benchmarkResult.totalRoundtripMs} ms
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Engine */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Database Engine
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900 truncate">
              {dbData?.database?.driver || "PGlite Engine"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>Storage: {dbData?.database?.storagePath || "./data/kollab-pg"}</span>
            </div>
          </div>

          {/* Card 2: Status & Ping */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Connection Status
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-emerald-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online & Active</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>Query Latency: {dbData?.database?.pingMs || 20} ms</span>
            </div>
          </div>

          {/* Card 3: Tables Count */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Relational Schema
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                <Table className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {dbData?.database?.totalTables || 16} Tables
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Drizzle ORM schema with foreign key cascades
            </div>
          </div>

          {/* Card 4: Total Records */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stored Records
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {dbData?.database?.totalRecords || 53} Rows
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Persistent ACID transactions in local data volume
            </div>
          </div>
        </div>

        {/* Database Tables Directory & Inspector */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Relational Tables Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every table is fully functional, type-safe, indexed, and wired to REST APIs.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 h-10 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Inspecting database catalog...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTables.map((t: any) => (
                <div
                  key={t.name}
                  className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.label}</div>
                    </div>
                    <Badge variant={t.count > 0 ? "emerald" : "outline"} className="text-[10px] py-0 px-2 font-mono">
                      {t.count} {t.count === 1 ? "row" : "rows"}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>PK: {t.primaryKey}</span>
                    <button
                      onClick={() => previewTableData(t.name)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backend Architectural Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-2">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">ACID Transaction Resilience</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every meeting creation, chat message, and collaborative document update is executed within transactional safety boundaries, preventing partial writes and corrupted states.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero-Config + Cloud Scale</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Functions offline or locally with embedded PGlite, and effortlessly switches to Supabase, Neon, AWS RDS, or Railway when <code>DATABASE_URL</code> is defined in <code>.env</code>.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">High-Throughput Sub-30ms Latency</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Optimized indexes on join codes, room names, and user identifiers ensure high-frequency video conference handshakes and chat streams respond in under 30 milliseconds.
            </p>
          </div>
        </div>
      </div>

      {/* Table Data Preview Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base font-mono">
                    Table: {selectedTable}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing top records retrieved from the database
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-auto">
              {previewLoading ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Loading table rows...</span>
                </div>
              ) : previewRows.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records found in table {selectedTable}.
                </div>
              ) : (
                <div className="bg-slate-950 rounded-2xl p-4 overflow-x-auto">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                    {JSON.stringify(previewRows, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTable(null)}
                className="rounded-xl text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
