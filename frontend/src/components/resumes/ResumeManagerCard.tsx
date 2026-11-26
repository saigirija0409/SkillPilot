"use client";

import React, { useState } from "react";
import { FileText, Lock, Trash2, Upload, ExternalLink } from "lucide-react";

import {
  createResumeSignedUrl,
  deletePrivateResume,
  uploadPrivateResume,
  validatePdfResumeFile,
} from "@/services/resumes";
import type { ResumeRecord } from "@/types/database";

interface ResumeManagerCardProps {
  userId: string;
  resumes: ResumeRecord[];
  onResumesChanged: (nextResumes: ResumeRecord[]) => void;
}

export function ResumeManagerCard({
  userId,
  resumes,
  onResumesChanged,
}: ResumeManagerCardProps) {
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validatePdfResumeFile(file);
    if (validationError) {
      setError(validationError);
      setStatusMessage(null);
      return;
    }

    setUploading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const created = await uploadPrivateResume(userId, file);
      const updatedList = [
        created,
        ...resumes.map((r) => ({ ...r, is_active: false })),
      ];
      onResumesChanged(updatedList);
      setStatusMessage(
        `Uploaded "${created.file_name}" to private user-scoped storage.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenSigned(resume: ResumeRecord) {
    setBusyId(resume.id);
    setError(null);
    try {
      const signedUrl = await createResumeSignedUrl(resume.storage_path);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate signed URL."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(resume: ResumeRecord) {
    setBusyId(resume.id);
    setError(null);
    setStatusMessage(null);
    try {
      await deletePrivateResume(resume.id, resume.storage_path);
      onResumesChanged(resumes.filter((item) => item.id !== resume.id));
      setStatusMessage(`Deleted "${resume.file_name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete resume.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lock className="h-4 w-4 text-emerald-600" />
            Private PDF Resume Storage
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            PDF only, max 5 MB. Stored in a private Supabase Storage bucket
            scoped to your account (AI extraction runs in Phase 3).
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload PDF"}
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {statusMessage}
        </p>
      ) : null}

      {resumes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          No resume uploaded yet. Uploading a resume is optional during
          onboarding.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {resumes.map((resume) => (
            <li
              key={resume.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="font-medium text-slate-900">
                    {resume.file_name}{" "}
                    {resume.is_active ? (
                      <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Active
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(resume.file_size_bytes / 1024).toFixed(1)} KB • Status:{" "}
                    {resume.parse_status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === resume.id}
                  onClick={() => void handleOpenSigned(resume)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Private View
                </button>
                <button
                  type="button"
                  disabled={busyId === resume.id}
                  onClick={() => void handleDelete(resume)}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
