"use client";

import { useRef, useState } from "react";
import { FilePenLine, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { AiSummaryMarkdown } from "@/components/patient/AiSummaryMarkdown";
import { fileToBase64 } from "@/lib/file-utils";

const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export function HandwrittenNotesCard() {
  const [handwrittenResult, setHandwrittenResult] = useState<string | null>(null);
  const [isHandwrittenLoading, setIsHandwrittenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a PNG or JPG/JPEG image of the handwritten notes.");
      return;
    }

    setError(null);
    setHandwrittenResult(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setIsHandwrittenLoading(true);

    try {
      const { base64, mimeType } = await fileToBase64(file);

      const res = await fetch("/api/analyze-handwritten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = (await res.json()) as { summary?: string; error?: string };

      if (!res.ok) {
        setError(data.error || "Could not analyze the handwritten notes.");
        return;
      }

      if (!data.summary?.trim()) {
        setError("No readable text was extracted. Please try a clearer photo.");
        return;
      }

      setHandwrittenResult(data.summary);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsHandwrittenLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-stone-50 shadow-md">
      <CardContent className="pt-6 space-y-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <FilePenLine className="h-6 w-6" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl text-amber-950">Analyze Handwritten Doctor Notes</CardTitle>
            <p className="mt-1 text-base text-amber-900/80">
              Upload a photo of messy or illegible doctor handwriting. Our AI scribe will decode
              medicines, shorthand, and instructions into plain language — no appointment required.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-amber-400 text-amber-950 hover:bg-amber-100"
            disabled={isHandwrittenLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isHandwrittenLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Decrypting doctor handwriting…
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" aria-hidden />
                Upload Handwritten Notes
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileChange}
            disabled={isHandwrittenLoading}
          />
          <span className="text-sm text-amber-800/70">PNG, JPG, JPEG · up to 10 MB</span>
        </div>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Handwritten notes preview"
              className="max-h-40 w-full object-contain"
            />
          </div>
        )}

        {isHandwrittenLoading && (
          <p className="text-sm font-medium text-amber-800 animate-pulse" role="status">
            Decrypting doctor handwriting…
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {handwrittenResult && !isHandwrittenLoading && (
          <div
            className="rounded-2xl border-2 border-amber-300/60 bg-amber-50 px-5 py-5 shadow-inner"
            role="region"
            aria-label="Handwritten notes analysis"
          >
            <h3 className="text-base font-bold text-amber-950 mb-3">Decoded Notes Summary</h3>
            <AiSummaryMarkdown content={handwrittenResult} />
            <p className="mt-4 text-xs text-amber-900/70 border-t border-amber-200/80 pt-3">
              AI-generated from handwriting recognition only. Always confirm with your doctor or
              pharmacist before acting on this interpretation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
