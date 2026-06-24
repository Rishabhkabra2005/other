import { redirect } from "next/navigation";

export default function LegacyVerificationRedirect() {
  redirect("/admin/doctors");
}
