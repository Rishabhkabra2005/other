"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  status: string;
  mode: string;
  scheduledAt: string;
  patient: {
    id: string;
    fullName: string;
    age: number;
    existingDiseases?: string | null;
    allergies?: string | null;
  };
}

interface DoctorProfile {
  consultationFee: number;
  fullName: string;
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [fee, setFee] = useState("");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [rx, setRx] = useState({ diagnosis: "", medications: "", instructions: "" });

  useEffect(() => {
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
    fetch("/api/doctors/profile")
      .then((r) => r.json())
      .then((p: DoctorProfile) => {
        setProfile(p);
        setFee(String(p.consultationFee));
      });
  }, []);

  async function updateFee() {
    await fetch("/api/doctors/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationFee: Number(fee) }),
    });
    alert("Consultation fee updated.");
  }

  async function submitPrescription() {
    if (!selectedAppt) return;
    await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppt.id,
        patientId: selectedAppt.patient.id,
        ...rx,
      }),
    });
    setRx({ diagnosis: "", medications: "", instructions: "" });
    setSelectedAppt(null);
    const updated = await fetch("/api/appointments").then((r) => r.json());
    setAppointments(updated);
    alert("Prescription saved and appointment marked completed.");
  }

  const upcoming = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1>Doctor Dashboard</h1>
        <p className="text-lg text-slate-700 mt-2">
          Welcome{profile ? `, ${profile.fullName}` : ""}. Manage your schedule and consultations.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <Input
            label="Consultation Fee (₹)"
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={updateFee}>Update Fee</Button>
          <Link href="/doctor/slots">
            <Button variant="outline">Manage Time Slots</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Upcoming Schedule</CardTitle>
          {upcoming.length === 0 ? (
            <p className="text-base text-slate-700">No upcoming appointments.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((a) => (
                <li
                  key={a.id}
                  className="border-b-2 border-slate-100 pb-4 flex flex-wrap justify-between gap-3"
                >
                  <div>
                    <p className="text-lg font-bold">{a.patient.fullName}</p>
                    <p className="text-base text-slate-700">
                      {formatDate(a.scheduledAt)} · {a.mode}
                    </p>
                    <Badge className="mt-2">{a.status}</Badge>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedAppt(a)}
                  >
                    Write Prescription
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selectedAppt && (
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>
              Digital Prescription — {selectedAppt.patient.fullName}
            </CardTitle>
            <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200 text-base space-y-2">
              <p><strong>Age:</strong> {selectedAppt.patient.age}</p>
              <p><strong>Allergies:</strong> {selectedAppt.patient.allergies || "None recorded"}</p>
              <p><strong>Conditions:</strong> {selectedAppt.patient.existingDiseases || "None recorded"}</p>
            </div>
            <Input
              label="Diagnosis"
              value={rx.diagnosis}
              onChange={(e) => setRx({ ...rx, diagnosis: e.target.value })}
            />
            <Input
              label="Medications"
              value={rx.medications}
              onChange={(e) => setRx({ ...rx, medications: e.target.value })}
            />
            <Input
              label="Instructions"
              value={rx.instructions}
              onChange={(e) => setRx({ ...rx, instructions: e.target.value })}
            />
            <div className="flex gap-3">
              <Button onClick={submitPrescription}>Save Prescription</Button>
              <Button variant="secondary" onClick={() => setSelectedAppt(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
