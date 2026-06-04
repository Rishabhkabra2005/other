import { PrescriptionSummary } from "@/components/patient/PrescriptionSummary";

export default function PatientPrescriptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Prescription Summary</h1>
        <p className="text-lg text-slate-700 mt-2">
          View medications and care instructions from your completed consultations.
        </p>
      </div>
      <PrescriptionSummary />
    </div>
  );
}
