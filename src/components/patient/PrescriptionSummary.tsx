"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Stethoscope } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  parseMedications,
  type PrescriptionRecord,
} from "@/types/prescription";

function formatSpecialization(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
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
              After your doctor completes a consultation and writes a prescription,
              it will appear here for easy reference.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {prescriptions.map((rx) => {
        const consultationDate =
          rx.appointment?.scheduledAt ?? rx.dateWritten;

        return (
          <Card
            key={rx.id}
            className="overflow-hidden border-2 border-teal-100 shadow-md"
          >
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
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {rx.doctor.fullName}
                </p>
                <p className="text-base text-slate-700">
                  {rx.doctor.qualification} ·{" "}
                  {formatSpecialization(rx.doctor.specialization)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Prescription dated {formatDate(rx.dateWritten)}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-bold text-slate-900">
                  Prescribed Medications
                </h3>
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
                      {rx.medications.map((med, i) => (
                        <tr
                          key={`${rx.id}-${i}`}
                          className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {med.name}
                          </td>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
