import { redirect } from "next/navigation";

export default function LegacyAddDoctorRedirect() {
  redirect("/admin/doctors");
}
