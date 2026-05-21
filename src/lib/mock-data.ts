export interface MockClinicDistance {
  clinicId: string;
  distanceKm: number;
  travelMinutes: number;
}

export function getMockDistance(clinicId: string): MockClinicDistance {
  const hash = clinicId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    clinicId,
    distanceKm: 1.2 + (hash % 80) / 10,
    travelMinutes: 8 + (hash % 25),
  };
}

export const CALL_MASKING_INFO = {
  title: "Secure Call Masking",
  description:
    "Your real phone number is never shared with the doctor. Our system routes calls through a temporary masked number that expires after your consultation.",
  features: [
    "End-to-end encrypted call routing",
    "Automatic number expiry after appointment",
    "Call recording available with consent",
    "Emergency fallback to clinic line",
  ],
};

export const VIDEO_ROOM_INFO = {
  title: "Secure Video Consultation",
  description:
    "HIPAA-aligned video room with encrypted streams, in-session chat, and live digital prescription drafting.",
};
