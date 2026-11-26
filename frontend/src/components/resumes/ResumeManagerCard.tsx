"use client";

import React, { useState } from "react";
import { ExternalLink, FileText, Lock, Trash2, UploadCloud } from "lucide-react";

import { Button, StatusLabel } from "@/components/ui";
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
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function processFile(file: File | undefined) {
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await processFile(file);
  }

  async function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    await processFile(file);
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
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-ink">
            <Lock className="h-4 w-4 text-forest" />
            Private PDF Resume Storage
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            PDF only, max 5 MB. Stored in your private Supabase bucket scoped to
            your account (AI skill extraction arrives in Phase 3).
          </p>
        </div>
        <StatusLabel tone="verified" label="Owner-Only Bucket" />
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => void handleDrop(e)}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging
            ? "border-forest bg-forest-soft"
            : "border-line-strong bg-canvas/70 hover:border-forest/60 hover:bg-surface-muted/50"
        }`}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-forest">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-ink">
          {uploading
            ? "Uploading PDF securely..."
            : "Drag & drop your PDF resume here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Maximum file size 5 MB • Never exposed via public URLs
        </p>
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={uploading}
          onChange={(e) => void handleFileChange(e)}
          className="hidden"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-attention-text)]"
        >
          {error}
        </p>
      ) : null}

      {statusMessage ? (
        <p
          role="status"
          className="rounded-xl border border-[var(--status-verified-border)] bg-[var(--status-verified-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-verified-text)]"
        >
          {statusMessage}
        </p>
      ) : null}

      {resumes.length === 0 ? (
        <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-xs text-muted">
          No resume uploaded yet. Uploading a PDF is optional during onboarding.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {resumes.map((resume) => (
            <li
              key={resume.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-forest" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {resume.file_name}
                    </span>
                    {resume.is_active ? (
                      <StatusLabel tone="verified" label="Active" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    {(resume.file_size_bytes / 1024).toFixed(1)} KB • Status:{" "}
                    {resume.parse_status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === resume.id}
                  leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() => void handleOpenSigned(resume)}
                >
                  Private View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === resume.id}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-[#8C371C] hover:bg-[var(--status-attention-bg)]"
                  onClick={() => void handleDelete(resume)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
