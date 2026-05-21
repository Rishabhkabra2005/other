import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { slotSchema } from "@/lib/validations";
import { ConsultationMode } from "@prisma/client";

export async function GET(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  if (!doctor) return jsonError("Doctor profile not found", 404);

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") as ConsultationMode | undefined;

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      doctorId: doctor.id,
      ...(mode ? { mode } : {}),
      date: { gte: new Date() },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return jsonSuccess(slots);
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const body = await request.json();
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid slot");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  if (!doctor) return jsonError("Doctor not found", 404);

  const slot = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctor.id,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      mode: parsed.data.mode,
    },
  });

  return jsonSuccess(slot, 201);
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const { slotId, isBlocked } = await request.json();
  if (!slotId) return jsonError("Slot ID required");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  if (!doctor) return jsonError("Doctor not found", 404);

  const slot = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, doctorId: doctor.id },
  });
  if (!slot) return jsonError("Slot not found", 404);

  const updated = await prisma.availabilitySlot.update({
    where: { id: slotId },
    data: { isBlocked: Boolean(isBlocked) },
  });

  return jsonSuccess(updated);
}
