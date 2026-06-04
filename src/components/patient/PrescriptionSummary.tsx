"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Loader2, Sparkles, Stethoscope } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { AiSummaryMarkdown } from "@/components/patient/AiSummaryMarkdown";
import {
  parseMedications,
  type Medication,
  type PrescriptionRecord,
} from "@/types/prescription";

function formatSpecialization(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

interface AiSummaryState {
  loading: boolean;
  summary: string | null;
  error: string | null;
}

function PrescriptionCard({ rx }: { rx: PrescriptionRecord }) {
  const [aiState, setAiState] = useState<AiSummaryState>({
    loading: false,
    summary: null,
    error: null,
  });

  const consultationDate = rx.appointment?.scheduledAt ?? rx.dateWritten;

  async function requestAiSummary() {
    setAiState({ loading: true, summary: null, error: null });

    try {
      const res = await fetch("/api/prescriptions/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: rx.medications,
          doctorNotes: rx.doctorNotes ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiState({
          loading: false,
          summary: null,
          error: data.error || "Could not generate summary",
        });
        return;
      }

      setAiState({
        loading: false,
        summary: data.summary as string,
        error: null,
      });
    } catch {
      setAiState({
        loading: false,
        summary: null,
        error: "Network error. Please try again.",
      });
    }
  }

  return (
    <Card className="overflow-hidden border-2 border-teal-100 shadow-md">
      <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-8 w-8 shrink-0 opacity-90" aria-hidden />
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-100">
                Consultation
              </p>
              <CardTitle className="text-xl text-white mt-1">
                {formatDate(consultationDate)}
              </CardTitle>
            </div>
          </div>
          {rx.appointment?.mode && (
            <Badge className="bg-white/20 text-white border-white/30">
              {rx.appointment.mode.replace("_", " ")}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Prescribing Doctor
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">{rx.doctor.fullName}</p>
          <p className="text-base text-slate-700">
            {rx.doctor.qualification} · {formatSpecialization(rx.doctor.specialization)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Prescription dated {formatDate(rx.dateWritten)}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-slate-900">Prescribed Medications</h3>
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200">
            <table className="w-full min-w-[520px] text-left text-base">
              <thead>
                <tr className="bg-teal-50 text-slate-900">
                  <th className="px-4 py-3 font-bold">Medicine</th>
                  <th className="px-4 py-3 font-bold">Dosage</th>
                  <th className="px-4 py-3 font-bold">Frequency</th>
                  <th className="px-4 py-3 font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {rx.medications.map((med: Medication, i: number) => (
                  <tr
                    key={`${rx.id}-${i}`}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{med.name}</td>
                    <td className="px-4 py-3 text-slate-800">{med.dosage}</td>
                    <td className="px-4 py-3 text-slate-800">{med.frequency}</td>
                    <td className="px-4 py-3 text-slate-800">{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {rx.doctorNotes && (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
              Doctor&apos;s Notes & Instructions
            </p>
            <p className="mt-2 text-base text-amber-950 whitespace-pre-wrap leading-relaxed">
              {rx.doctorNotes}
            </p>
          </div>
        )}

        <div className="pt-2 border-t-2 border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto border-indigo-300 text-indigo-900 hover:bg-indigo-50 hover:border-indigo-400"
            onClick={requestAiSummary}
            disabled={aiState.loading}
          >
            {aiState.loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
                ✨ Explain in Simple Terms (AI Summary)
              </>
            )}
          </Button>

          {aiState.loading && (
            <p
              className="mt-4 text-base text-indigo-700 animate-pulse font-medium"
              role="status"
              aria-live="polite"
            >
              AI is translating your prescription…
            </p>
          )}

          {aiState.error && (
            <p className="mt-4 text-base text-red-700 font-medium" role="alert">
              {aiState.error}
            </p>
          )}

          {aiState.summary && !aiState.loading && (
            <div
              className="mt-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 px-6 py-5 shadow-inner"
              role="region"
              aria-label="AI prescription summary"
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-600" aria-hidden />
                <h3 className="text-lg font-bold text-indigo-950">
                  Your Easy-to-Understand Summary
                </h3>
              </div>
              <AiSummaryMarkdown content={aiState.summary} />
              <p className="mt-5 text-sm text-indigo-800/80 border-t border-indigo-200/60 pt-4">
                This summary is AI-generated for clarity only. Always follow your doctor&apos;s
                written prescription and ask your care team if anything is unclear.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PrescriptionSummary() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.patientId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(
          `/api/prescriptions?patientId=${encodeURIComponent(session!.user.patientId!)}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load prescriptions");
          return;
        }
        const records = (Array.isArray(data) ? data : []).map((rx: PrescriptionRecord) => ({
          ...rx,
          medications: parseMedications(rx.medications),
        }));
        setPrescriptions(records);
      } catch {
        setError("Network error. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session?.user?.patientId]);

  if (loading) {
    return (
      <p className="text-lg text-slate-700" role="status">
        Loading your prescriptions…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-lg text-red-700 font-medium" role="alert">
        {error}
      </p>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <FileText className="h-14 w-14 text-slate-400" aria-hidden />
          <div>
            <CardTitle className="text-xl">No prescriptions yet</CardTitle>
            <p className="mt-2 text-base text-slate-700 max-w-md">
              After your doctor completes a consultation and writes a prescription, it will
              appear here for easy reference.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {prescriptions.map((rx) => (
        <PrescriptionCard key={rx.id} rx={rx} />
      ))}
    </div>
  );
}
