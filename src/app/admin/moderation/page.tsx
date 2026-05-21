"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  status: string;
  mode: string;
  scheduledAt: string;
  patient: { fullName: string };
  doctor: { fullName: string };
}

export default function AdminModerationPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .catch(() => [])
      .then(setAppointments);
  }, []);

  return (
    <div className="space-y-8">
      <h1>Moderation</h1>
      <p className="text-lg text-slate-700">
        Monitor platform activity. Appointment moderation uses status controls managed by patients and doctors.
      </p>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Platform Guidelines</CardTitle>
          <ul className="list-disc pl-6 space-y-2 text-base text-slate-800">
            <li>Verify all new doctor profiles before they appear in patient search.</li>
            <li>Review cancelled appointments for abuse patterns.</li>
            <li>Ensure prescription records are completed after video/phone consultations.</li>
            <li>Contact support for disputes — escalation workflow integrates with your CRM.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Recent Activity Log</CardTitle>
          {appointments.length === 0 ? (
            <p className="text-base text-slate-700">
              Sign in as patient or doctor to populate appointments, or run database seed.
            </p>
          ) : (
            <ul className="space-y-3">
              {appointments.slice(0, 20).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-3 text-base"
                >
                  <span>
                    {a.patient.fullName} → {a.doctor.fullName}
                  </span>
                  <span className="text-slate-600">{formatDate(a.scheduledAt)}</span>
                  <Badge>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button variant="secondary" onClick={() => window.location.href = "/admin"}>
        Back to Overview
      </Button>
    </div>
  );
}
