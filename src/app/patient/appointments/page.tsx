"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  status: string;
  mode: string;
  scheduledAt: string;
  doctor: { fullName: string };
  clinic?: { name: string; address: string } | null;
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const booked = searchParams.get("booked");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
  }, []);

  async function cancel(id: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    const updated = await fetch("/api/appointments").then((r) => r.json());
    setAppointments(updated);
  }

  return (
    <div className="space-y-8">
      <h1>My Appointments</h1>
      {booked && (
        <p className="text-lg bg-green-100 border-2 border-green-300 text-green-900 p-4 rounded-lg font-semibold">
          Appointment booked successfully!
        </p>
      )}
      {appointments.length === 0 ? (
        <p className="text-lg text-slate-700">No appointments yet.</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl">{a.doctor.fullName}</CardTitle>
                  <p className="text-base text-slate-700 mt-2">{formatDate(a.scheduledAt)}</p>
                  <p className="text-base text-slate-700">Mode: {a.mode}</p>
                  {a.clinic && (
                    <p className="text-base text-slate-700">
                      {a.clinic.name} — {a.clinic.address}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 items-end">
                  <Badge
                    variant={
                      a.status === "COMPLETED"
                        ? "success"
                        : a.status === "CANCELLED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {a.status}
                  </Badge>
                  {(a.status === "CONFIRMED" || a.status === "PENDING") && (
                    <Button variant="danger" size="sm" onClick={() => cancel(a.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<p className="text-lg">Loading appointments...</p>}>
      <AppointmentsContent />
    </Suspense>
  );
}
