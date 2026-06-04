"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { emptyMedication, type Medication } from "@/types/prescription";
import { cn } from "@/lib/utils";

export interface WritePrescriptionPatient {
  id: string;
  fullName: string;
  age: number;
  allergies?: string | null;
  existingDiseases?: string | null;
}

interface WritePrescriptionFormProps {
  appointmentId: string;
  patient: WritePrescriptionPatient;
  doctorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WritePrescriptionForm({
  appointmentId,
  patient,
  doctorId,
  onSuccess,
  onCancel,
}: WritePrescriptionFormProps) {
  const [medications, setMedications] = useState<Medication[]>([emptyMedication()]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateMedication(index: number, field: keyof Medication, value: string) {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  }

  function addMedication() {
    setMedications((prev) => [...prev, emptyMedication()]);
  }

  function removeMedication(index: number) {
    if (medications.length <= 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientId: patient.id,
          doctorId,
          medications,
          doctorNotes: doctorNotes.trim() || undefined,
          markCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save prescription");
        return;
      }

      toast.success("Prescription saved successfully. Appointment marked as completed.");
      setMedications([emptyMedication()]);
      setDoctorNotes("");
      onSuccess?.();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardTitle>Write Prescription — {patient.fullName}</CardTitle>

          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-base space-y-2">
            <p>
              <span className="font-semibold">Age:</span> {patient.age}
            </p>
            <p>
              <span className="font-semibold">Allergies:</span>{" "}
              {patient.allergies || "None recorded"}
            </p>
            <p>
              <span className="font-semibold">Conditions:</span>{" "}
              {patient.existingDiseases || "None recorded"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">Medications</h3>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>

            {medications.map((med, index) => (
              <div
                key={index}
                className={cn(
                  "grid gap-4 rounded-xl border-2 border-slate-200 bg-white p-4",
                  "sm:grid-cols-2 lg:grid-cols-4"
                )}
              >
                <Input
                  label="Name"
                  value={med.name}
                  onChange={(e) => updateMedication(index, "name", e.target.value)}
                  placeholder="e.g. Metformin"
                  required
                />
                <Input
                  label="Dosage"
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  placeholder="e.g. 500mg"
                  required
                />
                <Input
                  label="Frequency"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                  placeholder="e.g. Twice daily"
                  required
                />
                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                  <Input
                    label="Duration"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                    placeholder="e.g. 14 days"
                    required
                    className="flex-1"
                  />
                  {medications.length > 1 && (
                    <div className="flex items-end pb-1">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        aria-label={`Remove medication ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label
              htmlFor="doctorNotes"
              className="text-base font-semibold text-slate-900"
            >
              Doctor Notes & Instructions
            </label>
            <textarea
              id="doctorNotes"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={4}
              placeholder='e.g. Take after meals. Avoid alcohol while on this medication.'
              className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Submit Prescription"}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
