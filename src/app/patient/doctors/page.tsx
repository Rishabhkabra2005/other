"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DoctorCard, DoctorCardData } from "@/components/DoctorCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SPECIALIZATIONS, CONSULTATION_MODES } from "@/lib/constants";
import { Specialization } from "@prisma/client";

export default function DoctorsListingPage() {
  const [doctors, setDoctors] = useState<DoctorCardData[]>([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [mode, setMode] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (specialization) params.set("specialization", specialization);
    if (mode) params.set("mode", mode);
    if (minFee) params.set("minFee", minFee);
    if (maxFee) params.set("maxFee", maxFee);
    if (search) params.set("search", search);

    setLoading(true);
    fetch(`/api/doctors?${params}`)
      .then((r) => r.json())
      .then((data) => setDoctors(data))
      .finally(() => setLoading(false));
  }, [specialization, mode, minFee, maxFee, search]);

  const categories = useMemo(
    () => [{ value: "", label: "All Specializations" }, ...SPECIALIZATIONS.map((s) => ({ value: s.value, label: s.label }))],
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h1>Find a Doctor</h1>
        <p className="text-lg text-slate-700 mt-2">
          Browse specialists by category, consultation mode, and fee range.
        </p>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500" />
          <Input
            className="pl-14"
            placeholder="Search by doctor name or qualification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search doctors"
          />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            options={categories}
          />
          <Select
            label="Consultation Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={[
              { value: "", label: "All Modes" },
              ...CONSULTATION_MODES.map((m) => ({ value: m.value, label: m.label })),
            ]}
          />
          <Input
            label="Min Fee (₹)"
            type="number"
            value={minFee}
            onChange={(e) => setMinFee(e.target.value)}
          />
          <Input
            label="Max Fee (₹)"
            type="number"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SPECIALIZATIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() =>
              setSpecialization(
                specialization === s.value ? "" : (s.value as Specialization)
              )
            }
            className={`rounded-full px-4 py-2 text-base font-semibold border-2 min-h-[44px] ${
              specialization === s.value
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white text-slate-800 border-slate-300 hover:border-teal-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-lg text-center py-12">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p className="text-lg text-center py-12 text-slate-700">No doctors match your filters.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      )}
    </div>
  );
}
