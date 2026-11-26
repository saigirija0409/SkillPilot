import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ResumeRecord } from "@/types/database";

const RESUME_BUCKET = "resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(fileName: string): string {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.endsWith(".pdf") ? cleaned : `${cleaned || "resume"}.pdf`;
}

export function validatePdfResumeFile(file: File): string | null {
  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    return "Only PDF files (.pdf) are accepted for resume uploads.";
  }
  if (file.size <= 0) {
    return "The selected PDF file appears to be empty.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "Resume file size exceeds the 5 MB limit.";
  }
  return null;
}

export async function uploadPrivateResume(
  userId: string,
  file: File
): Promise<ResumeRecord> {
  const validationError = validatePdfResumeFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createSupabaseBrowserClient();
  const safeName = sanitizeFilename(file.name);
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  const storagePath = `${userId}/${uniqueId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Mark previous active resumes inactive before inserting new active resume record
  const { error: deactivateErr } = await supabase
    .from("resumes")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (deactivateErr) {
    await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
    throw new Error(deactivateErr.message);
  }

  const { data, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      storage_bucket: RESUME_BUCKET,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: "application/pdf",
      file_size_bytes: file.size,
      parse_status: "uploaded",
      is_active: true,
      share_with_manager: false,
    })
    .select("*")
    .single();

  if (insertError) {
    await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  return data as ResumeRecord;
}

export async function createResumeSignedUrl(
  storagePath: string
): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Unable to create private signed URL");
  }
  return data.signedUrl;
}

export async function deletePrivateResume(
  resumeId: string,
  storagePath: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error: storageError } = await supabase.storage
    .from(RESUME_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(`Failed to remove resume file: ${storageError.message}`);
  }

  const { error: dbError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId);

  if (dbError) {
    throw new Error(dbError.message);
  }
}
