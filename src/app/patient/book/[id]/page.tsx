"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Video,
  Clock,
  Shield,
} from "lucide-react";
import { ConsultationMode } from "@prisma/client";
import { BookingCalendar, SlotOption } from "@/components/BookingCalendar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { SPECIALIZATION_LABELS, CONSULTATION_MODES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getMockDistance, CALL_MASKING_INFO, VIDEO_ROOM_INFO } from "@/lib/mock-data";

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface DoctorDetail {
  id: string;
  fullName: string;
  qualification: string;
  specialization: keyof typeof SPECIALIZATION_LABELS;
  consultationFee: number;
  modes: ConsultationMode[];
  clinics: Clinic[];
  availability: SlotOption[];
}

type Step = "mode" | "details" | "confirm";

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<ConsultationMode | "">("");
  const [clinicId, setClinicId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [family, setFamily] = useState<{ id: string; fullName: string; relation: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`)
      .then((r) => r.json())
      .then(setDoctor);
    fetch("/api/patients/family")
      .then((r) => r.json())
      .then(setFamily);
  }, [doctorId]);

  const filteredSlots = useMemo(() => {
    if (!doctor || !mode) return [];
    return doctor.availability
      .filter((s) => s.mode === mode)
      .map((s) => ({
        ...s,
        date: typeof s.date === "string" ? s.date : new Date(s.date).toISOString(),
      }));
  }, [doctor, mode]);

  async function confirmBooking() {
    if (!doctor || !mode || !slotId) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctor.id,
        mode,
        slotId,
        clinicId: mode === "ON_SITE" ? clinicId : undefined,
        familyMemberId: familyMemberId || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Booking failed");
      return;
    }

    router.push("/patient/appointments?booked=1");
  }

  if (!doctor) {
    return <p className="text-lg text-center py-12">Loading doctor details...</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1>Book with {doctor.fullName}</h1>
        <p className="text-lg text-slate-700 mt-1">
          {SPECIALIZATION_LABELS[doctor.specialization]} · {formatCurrency(doctor.consultationFee)}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["mode", "details", "confirm"] as Step[]).map((s, i) => (
          <Badge
            key={s}
            variant={step === s ? "success" : "default"}
          >
            Step {i + 1}: {s === "mode" ? "Consultation Type" : s === "details" ? "Schedule" : "Confirm"}
          </Badge>
        ))}
      </div>

      {step === "mode" && (
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Choose Consultation Mode</CardTitle>
            <div className="grid gap-4">
              {CONSULTATION_MODES.filter((m) => doctor.modes.includes(m.value)).map((m) => {
                const Icon =
                  m.value === "ON_SITE" ? Building2 : m.value === "PHONE" ? Phone : Video;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMode(m.value);
                      setStep("details");
                    }}
                    className="flex items-center gap-4 p-6 rounded-xl border-2 border-slate-300 hover:border-teal-600 hover:bg-teal-50 text-left w-full min-h-[80px]"
                  >
                    <Icon className="h-10 w-10 text-teal-700 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{m.label}</p>
                      <p className="text-base text-slate-700">{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "details" && mode && (
        <div className="space-y-6">
          {family.length > 0 && (
            <Select
              label="Book for (optional)"
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              options={[
                { value: "", label: "Myself (primary account)" },
                ...family.map((f) => ({
                  value: f.id,
                  label: `${f.fullName} (${f.relation})`,
                })),
              ]}
            />
          )}

          {mode === "ON_SITE" && (
            <Card>
              <CardContent className="space-y-4">
                <CardTitle>Select Clinic</CardTitle>
                {doctor.clinics.map((clinic) => {
                  const dist = getMockDistance(clinic.id);
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => setClinicId(clinic.id)}
                      className={`w-full text-left p-5 rounded-xl border-2 ${
                        clinicId === clinic.id
                          ? "border-teal-700 bg-teal-50"
                          : "border-slate-300 hover:border-teal-500"
                      }`}
                    >
                      <p className="text-lg font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-teal-700" />
                        {clinic.name}
                      </p>
                      <p className="text-base text-slate-700 mt-2">
                        {clinic.address}, {clinic.city}
                      </p>
                      <p className="text-base font-semibold text-teal-800 mt-2 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {dist.distanceKm.toFixed(1)} km away · ~{dist.travelMinutes} min travel
                      </p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {mode === "PHONE" && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-10 w-10 text-teal-700" />
                  <CardTitle>{CALL_MASKING_INFO.title}</CardTitle>
                </div>
                <p className="text-base text-slate-700">{CALL_MASKING_INFO.description}</p>
                <ul className="list-disc pl-6 space-y-2 text-base text-slate-800">
                  {CALL_MASKING_INFO.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {mode === "VIDEO" && (
            <Card>
              <CardContent className="space-y-4">
                <CardTitle>{VIDEO_ROOM_INFO.title}</CardTitle>
                <p className="text-base text-slate-700">{VIDEO_ROOM_INFO.description}</p>
                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-900 text-white rounded-lg p-6 min-h-[120px] flex items-center justify-center text-base font-semibold md:col-span-2">
                    Video Feed Area
                  </div>
                  <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 min-h-[120px] text-base font-semibold text-slate-800">
                    Live Chat Sidebar
                  </div>
                  <div className="md:col-span-3 bg-teal-50 border-2 border-teal-200 rounded-lg p-4 text-base text-teal-900 font-semibold">
                    Digital Prescription Panel (doctor fills during call)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <CardTitle className="mb-4">Select Time Slot</CardTitle>
              <BookingCalendar
                slots={filteredSlots}
                selectedSlotId={slotId}
                onSelect={setSlotId}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setStep("mode")}>
              Back
            </Button>
            <Button
              onClick={() => setStep("confirm")}
              disabled={!slotId || (mode === "ON_SITE" && !clinicId)}
            >
              Review Booking
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Confirm Appointment</CardTitle>
            <p className="text-base"><strong>Doctor:</strong> {doctor.fullName}</p>
            <p className="text-base"><strong>Mode:</strong> {mode}</p>
            <p className="text-base"><strong>Fee:</strong> {formatCurrency(doctor.consultationFee)}</p>
            {error && (
              <p className="text-red-700 bg-red-50 p-4 rounded-lg border-2 border-red-200" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button onClick={confirmBooking} disabled={loading} size="lg">
                {loading ? "Booking..." : "Confirm Appointment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
