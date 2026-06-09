"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Loader2, ScanLine, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AiSummaryMarkdown } from "@/components/patient/AiSummaryMarkdown";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg";

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrescriptionUploadModal({ isOpen, onClose }: PrescriptionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsDragging(false);
    setIsLoading(false);
    setSummary(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isLoading, handleClose]);

  const selectFile = useCallback((selected: File | null) => {
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Please upload a PNG or JPG/JPEG prescription image.");
      return;
    }

    setError(null);
    setSummary(null);
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      selectFile(dropped ?? null);
    },
    [selectFile]
  );

  async function handleScan() {
    if (!file || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-prescription", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { summary?: string; error?: string };

      if (!res.ok) {
        setError(data.error || "Could not analyze the prescription. Please try again.");
        return;
      }

      if (!data.summary?.trim()) {
        setError("No summary was returned. Please try a clearer photo.");
        return;
      }

      setSummary(data.summary);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-upload-title"
      onClick={() => !isLoading && handleClose()}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <ScanLine className="h-6 w-6 shrink-0" aria-hidden />
            <div>
              <h2 id="prescription-upload-title" className="text-lg font-semibold leading-tight">
                External Prescription Upload
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">AI-powered scan &amp; plain-language summary</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-teal-100 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
              isDragging
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <FileUp className="h-7 w-7" aria-hidden />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-800">
                Drag &amp; drop your prescription photo
              </p>
              <p className="text-sm text-slate-600 mt-1">or click to browse · PNG, JPG, JPEG</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {previewUrl && file && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="max-h-48 w-full object-contain"
                />
                <p className="px-3 py-2 text-xs text-slate-500 border-t border-slate-200 truncate">
                  {file.name}
                </p>
              </div>

              <Button
                type="button"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleScan}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Scanning prescription…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" aria-hidden />
                    Scan &amp; Explain in Simple Terms
                  </>
                )}
              </Button>
            </div>
          )}

          {isLoading && (
            <p className="text-center text-sm text-teal-700 font-medium animate-pulse" role="status">
              AI is reading your prescription image…
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {summary && !isLoading && (
            <div
              className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 px-5 py-5 shadow-inner"
              role="region"
              aria-label="AI prescription summary"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-700" aria-hidden />
                <h3 className="text-base font-bold text-teal-950">Your Easy-to-Understand Summary</h3>
              </div>
              <AiSummaryMarkdown content={summary} />
              <p className="mt-4 text-xs text-teal-800/80 border-t border-teal-200/60 pt-3">
                This summary is AI-generated from your uploaded image for clarity only. Always follow
                your doctor&apos;s written prescription and consult your care team if anything is unclear.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
