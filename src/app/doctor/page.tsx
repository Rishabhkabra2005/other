"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WritePrescriptionForm } from "@/components/doctor/WritePrescriptionForm";
import { DoctorProfileEditor } from "@/components/doctor/DoctorProfileEditor";
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
  id: string;
  consultationFee: number;
  fullName: string;
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  async function loadAppointments() {
    const updated = await fetch("/api/appointments").then((r) => r.json());
    setAppointments(updated);
  }

  useEffect(() => {
    loadAppointments();
    fetch("/api/doctors/profile")
      .then((r) => r.json())
      .then((p: DoctorProfile) => {
        setProfile(p);
      });
  }, []);

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

      <DoctorProfileEditor />

      <Card>
        <CardContent className="flex flex-wrap gap-4 items-center justify-between">
          <CardTitle className="mb-0">Upcoming Schedule</CardTitle>
          <Link href="/doctor/slots">
            <Button variant="outline">Manage Time Slots</Button>
          </Link>
        </CardContent>
        <CardContent className="pt-0">
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
                    disabled={!profile}
                  >
                    Write Prescription
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selectedAppt && profile && (
        <WritePrescriptionForm
          appointmentId={selectedAppt.id}
          patient={selectedAppt.patient}
          doctorId={profile.id}
          onSuccess={() => {
            setSelectedAppt(null);
            loadAppointments();
          }}
          onCancel={() => setSelectedAppt(null)}
        />
      )}
    </div>
  );
}
