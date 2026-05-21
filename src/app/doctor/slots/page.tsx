"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/utils";
import { CONSULTATION_MODES } from "@/lib/constants";

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  isBlocked: boolean;
  booked: boolean;
}

export default function DoctorSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "09:30",
    mode: "ON_SITE",
  });

  function load() {
    fetch("/api/doctors/slots").then((r) => r.json()).then(setSlots);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/doctors/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  }

  async function toggleBlock(slotId: string, isBlocked: boolean) {
    await fetch("/api/doctors/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, isBlocked: !isBlocked }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      <h1>Manage Time Slots</h1>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Add New Slot</CardTitle>
          <form onSubmit={addSlot} className="grid md:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Select
              label="Mode"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              options={CONSULTATION_MODES.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
            <Button type="submit" className="md:col-span-2">
              Add Slot
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {slots.slice(0, 30).map((s) => (
          <Card key={s.id}>
            <CardContent className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="text-lg font-bold">
                  {formatDate(s.date)} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </p>
                <p className="text-base text-slate-700">{s.mode}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.booked && <Badge variant="warning">Booked</Badge>}
                {s.isBlocked && <Badge variant="danger">Blocked</Badge>}
                {!s.booked && (
                  <Button
                    size="sm"
                    variant={s.isBlocked ? "primary" : "danger"}
                    onClick={() => toggleBlock(s.id, s.isBlocked)}
                  >
                    {s.isBlocked ? "Unblock" : "Block"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
