"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

interface Appointment {
  patient: {
    fullName: string;
    age: number;
    gender: string;
    bloodGroup?: string | null;
    allergies?: string | null;
    existingDiseases?: string | null;
    emergencyContact?: string | null;
    insuranceInfo?: string | null;
  };
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Appointment["patient"][]>([]);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((appts: Appointment[]) => {
        const unique = new Map<string, Appointment["patient"]>();
        appts.forEach((a) => unique.set(a.patient.fullName, a.patient));
        setPatients(Array.from(unique.values()));
      });
  }, []);

  return (
    <div className="space-y-8">
      <h1>Patient Medical History</h1>
      <p className="text-lg text-slate-700">
        View health records for patients you have consulted.
      </p>
      {patients.length === 0 ? (
        <p className="text-base text-slate-700">No patient records yet.</p>
      ) : (
        patients.map((p) => (
          <Card key={p.fullName}>
            <CardContent className="space-y-2 text-base">
              <CardTitle>{p.fullName}</CardTitle>
              <p><strong>Age:</strong> {p.age} · <strong>Gender:</strong> {p.gender}</p>
              <p><strong>Blood Group:</strong> {p.bloodGroup || "—"}</p>
              <p><strong>Allergies:</strong> {p.allergies || "None"}</p>
              <p><strong>Conditions:</strong> {p.existingDiseases || "None"}</p>
              <p><strong>Emergency:</strong> {p.emergencyContact || "—"}</p>
              <p><strong>Insurance:</strong> {p.insuranceInfo || "—"}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
