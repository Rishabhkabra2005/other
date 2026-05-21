"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

interface FamilyMember {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  relation: string;
}

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "MALE",
    relation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/patients/family").then((r) => r.json()).then(setMembers);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/patients/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, age: Number(form.age) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to add member");
      return;
    }
    setForm({ fullName: "", age: "", gender: "MALE", relation: "" });
    load();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1>Family Members</h1>
      <p className="text-lg text-slate-700">
        Link family profiles to book appointments on their behalf.
      </p>

      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Add Family Member</CardTitle>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <Input label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <Input label="Relation" placeholder="e.g. Spouse, Son" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} required />
            {error && <p className="text-red-700 font-semibold" role="alert">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Member"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent>
              <p className="text-lg font-bold">{m.fullName}</p>
              <p className="text-base text-slate-700">
                {m.relation} · Age {m.age} · {m.gender}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
