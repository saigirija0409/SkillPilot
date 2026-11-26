"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button, SkillChip, StatusLabel, Textarea } from "@/components/ui";
import {
  extractSkillsFromTextApi,
  uploadAndParseResumeApi,
} from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import {
  fetchCatalogData,
  fetchUserProfileBundle,
  saveInferredSkillsFromCatalog,
} from "@/services/profile";
import {
  createResumeSignedUrl,
  deletePrivateResume,
  validatePdfResumeFile,
} from "@/services/resumes";
import type { ExtractedSkillDto } from "@/types/api";
import type { ResumeRecord, Skill } from "@/types/database";

interface ResumeManagerCardProps {
  userId: string;
  resumes: ResumeRecord[];
  onResumesChanged: (nextResumes: ResumeRecord[]) => void;
  onSkillsSaved?: () => void;
  targetRoleHint?: string | null;
}

export function ResumeManagerCard({
  userId,
  resumes,
  onResumesChanged,
  onSkillsSaved,
  targetRoleHint,
}: ResumeManagerCardProps) {
  const [uploading, setUploading] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [savingMatched, setSavingMatched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [showTextExtractor, setShowTextExtractor] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkillDto[]>(
    []
  );
  const [parsedSummary, setParsedSummary] = useState<string>("");
  const [matchedCatalogSkills, setMatchedCatalogSkills] = useState<
    Array<{ skill: Skill; proficiency: number; confidence: number }>
  >([]);

  async function matchExtractedSkillsToCatalog(
    extracted: ExtractedSkillDto[]
  ) {
    const catalog = await fetchCatalogData();
    const matched: Array<{
      skill: Skill;
      proficiency: number;
      confidence: number;
    }> = [];
    const seen = new Set<string>();

    for (const item of extracted) {
      const lower = item.name.trim().toLowerCase();
      const found = catalog.skills.find(
        (s) =>
          s.name.toLowerCase() === lower ||
          s.slug.toLowerCase() === lower ||
          s.name.toLowerCase().includes(lower) ||
          lower.includes(s.name.toLowerCase())
      );
      if (found && !seen.has(found.id)) {
        seen.add(found.id);
        matched.push({
          skill: found,
          proficiency: item.proficiency,
          confidence: item.confidence,
        });
      }
    }

    setMatchedCatalogSkills(matched);
  }

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
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        throw new Error("Active session expired. Sign in again to upload.");
      }

      // Prefix file name so repeated uploads of the same filename do not hit the
      // PostgreSQL UNIQUE constraint on resumes.storage_path.
      const uniquePrefix =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8)
          : String(Date.now());
      const uniqueFile = new File([file], `${uniquePrefix}-${file.name}`, {
        type: file.type || "application/pdf",
      });

      const parsed = await uploadAndParseResumeApi(uniqueFile, token);
      setExtractedSkills(parsed.skills);
      setParsedSummary(parsed.summary || "");
      await matchExtractedSkillsToCatalog(parsed.skills);

      const bundle = await fetchUserProfileBundle(userId);
      onResumesChanged(bundle.resumes);

      if (parsed.skills.length === 0) {
        setError(
          `Uploaded "${file.name}" securely, but AI skill extraction returned 0 skills (Gemini AI may be unavailable or returned no structured matches). Your PDF is safely stored.`
        );
      } else {
        setStatusMessage(
          `Uploaded and parsed "${file.name}" (${parsed.skills.length} skills extracted from ${parsed.extracted_text_length.toLocaleString("en-IN")} characters).`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Backend PDF upload & Gemini parsing failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleExtractFromText() {
    if (resumeText.trim().length < 20) {
      setError("Paste at least 20 characters of resume text to analyze.");
      return;
    }
    setExtractingText(true);
    setError(null);
    setStatusMessage(null);

    try {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        throw new Error("Active session expired. Sign in again.");
      }
      const res = await extractSkillsFromTextApi(
        resumeText,
        targetRoleHint ?? undefined,
        token
      );
      setExtractedSkills(res.skills);
      setParsedSummary(
        res.suggested_target_roles.length > 0
          ? `Suggested roles: ${res.suggested_target_roles.join(", ")}`
          : ""
      );
      await matchExtractedSkillsToCatalog(res.skills);
      if (res.skills.length === 0) {
        setError(
          "No skills were extracted (Gemini AI may be unavailable for the configured model). Try adjusting resume text or select skills directly in Onboarding / Settings."
        );
      } else {
        setStatusMessage(
          `Extracted ${res.skills.length} skills from text via FastAPI.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Text skill extraction failed."
      );
    } finally {
      setExtractingText(false);
    }
  }

  async function handleSaveMatchedSkills() {
    if (matchedCatalogSkills.length === 0) return;
    setSavingMatched(true);
    setError(null);

    try {
      await saveInferredSkillsFromCatalog(
        userId,
        matchedCatalogSkills.map((m) => ({
          skill_id: m.skill.id,
          proficiency: m.proficiency,
          confidence: m.confidence,
        }))
      );
      setStatusMessage(
        `Saved ${matchedCatalogSkills.length} inferred skill(s) to your Supabase profile ledger (non-verified until assessed).`
      );
      onSkillsSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save inferred skills to Supabase."
      );
    } finally {
      setSavingMatched(false);
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
            Private PDF Resume Vault &amp; AI Skill Extractor
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            PDF only, max 5 MB. Uploads securely and extracts structured skills
            using FastAPI PyMuPDF + Gemini parsing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusLabel tone="verified" label="Live AI Extraction API" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowTextExtractor((v) => !v)}
          >
            {showTextExtractor ? "Hide Text Paste" : "Paste Resume Text"}
          </Button>
        </div>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => void handleDrop(e)}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${dragging
          ? "border-forest bg-forest-soft"
          : "border-line-strong bg-canvas/70 hover:border-forest/60 hover:bg-surface-muted/50"
          }`}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-forest">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-ink">
          {uploading
            ? "Uploading & parsing PDF with FastAPI + Gemini..."
            : "Drag & drop your PDF resume here, or click to upload & parse"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Maximum file size 5 MB • Private bucket + automated NLP extraction
        </p>
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={uploading}
          onChange={(e) => void handleFileChange(e)}
          className="hidden"
        />
      </label>

      {showTextExtractor ? (
        <div className="space-y-3 rounded-2xl border border-line bg-canvas p-4">
          <Textarea
            label="Paste Resume Summary / Work History"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste bullet points from your resume or project descriptions (min 20 characters)..."
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            loading={extractingText}
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={() => void handleExtractFromText()}
          >
            Extract Skills via API
          </Button>
        </div>
      ) : null}

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

      {/* Extracted Skills Preview + Save to Profile */}
      {extractedSkills.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-[#C7BDE4] bg-[#DDD6F3]/35 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink">
                AI Extracted Skills ({extractedSkills.length})
              </p>
              {parsedSummary ? (
                <p className="mt-0.5 text-xs text-muted">{parsedSummary}</p>
              ) : null}
            </div>
            {matchedCatalogSkills.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                loading={savingMatched}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => void handleSaveMatchedSkills()}
              >
                Save {matchedCatalogSkills.length} Catalog Match(es)
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {extractedSkills.map((sk) => (
              <SkillChip
                key={`${sk.name}-${sk.category}`}
                name={`${sk.name} (${Math.round(sk.confidence * 100)}%)`}
                level={sk.proficiency}
                status="inferred"
              />
            ))}
          </div>

          <p className="text-xs sm:text-[13px] text-muted">
            Matched catalog skills save as{" "}
            <strong className="text-ink">inferred</strong> proficiency — never
            marked verified without assessment.
          </p>
        </div>
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
