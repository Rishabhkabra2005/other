import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { familyMemberSchema } from "@/lib/validations";

export async function GET() {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });
  if (!patient) return jsonError("Patient not found", 404);

  const members = await prisma.familyMember.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
  });
  return jsonSuccess(members);
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const body = await request.json();
  const parsed = familyMemberSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });
  if (!patient) return jsonError("Patient not found", 404);

  const member = await prisma.familyMember.create({
    data: { ...parsed.data, patientId: patient.id },
  });
  return jsonSuccess(member, 201);
}
