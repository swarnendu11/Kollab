"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HardDrive,
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Film,
  Search,
  Check,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
  FileUp,
} from "lucide-react";
import { fetchJsonWithTimeout, fetchWithTimeout } from "@/lib/client-fetch";

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithTimeout<{ files: any[] }>("/api/files");
      setFiles(data.files || []);
    } catch (err: any) {
      console.error("[KOLLAB FILES LOAD]", err);
      setError(err?.message || "Failed to load files from storage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetchWithTimeout("/api/files", {
        method: "POST",
        body: formData,
      }, 30000);

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.file) {
        setFiles((prev) => [data.file, ...prev]);
      }

      setUploadModalOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("[KOLLAB FILE UPLOAD]", err);
      setUploadError(err?.message || "File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchWithTimeout(`/api/files?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      console.error("[KOLLAB FILE DELETE]", err);
      alert("Failed to delete file. Please check your permissions.");
    }
  };

  const filtered = search.trim() === ""
    ? files
    : files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Cloud Storage & Files
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Store, share, and manage workspace documents, assets, and recordings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setUploadModalOpen(true);
                setUploadError(null);
                setSelectedFile(null);
              }}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Real File</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* States: Loading, Error, Success */}
        {loading ? (
          <div className="h-56 bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Loading workspace files...</span>
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Failed to load files</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              className="rounded-xl text-xs gap-1.5 border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <HardDrive className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No files found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search.trim() ? "No files matched your search filter." : "Click Upload Real File above to store assets in your workspace."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Uploaded By</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        {f.fileCategory === "image" ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : f.fileCategory === "video" ? (
                          <Film className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <span className="truncate max-w-xs">{f.name}</span>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell capitalize text-slate-500">
                      {f.fileCategory}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {f.fileSize}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-slate-500">
                      {f.userName || "Workspace Member"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={f.downloadUrl}
                          download={f.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real Multipart File Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Upload to Storage</h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-6 text-center hover:bg-emerald-50/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : "Click to select a file"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${selectedFile.type || "file"}`
                    : "Supports PDF, images, video, ZIP, documents up to 50MB"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl text-xs h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold h-10 gap-2 shadow-sm shadow-emerald-500/20"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? "Uploading..." : "Confirm Upload"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
