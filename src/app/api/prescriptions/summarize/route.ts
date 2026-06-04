import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { prescriptionSummarizeSchema } from "@/lib/validations";

const SYSTEM_PROMPT = `You are an empathetic, friendly family health assistant. Translate the provided medical prescription into simple, everyday, human language for the patient. Explain what each medicine generally does in friendly terms, lay out the schedule clearly, and break down the doctor's instructions into practical, comforting bullet points. Avoid complex medical jargon. Speak directly to the patient.`;

const GEMINI_MODEL = "gemini-2.5-flash";

function buildUserMessage(
  medications: { name: string; dosage: string; frequency: string; duration: string }[],
  doctorNotes?: string
): string {
  const medList = medications
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} — Dosage: ${m.dosage}, Frequency: ${m.frequency}, Duration: ${m.duration}`
    )
    .join("\n");

  const notes = doctorNotes?.trim()
    ? `\n\nDoctor's notes and instructions:\n${doctorNotes.trim()}`
    : "\n\nDoctor's notes: None provided.";

  return `Please explain this prescription in simple, comforting language:\n\nMedications:\n${medList}${notes}\n\nFormat your response in clear markdown with headings and bullet points.`;
}

export async function POST(request: Request) {
  const { error } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError("AI summary is not configured. Please contact support.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = prescriptionSummarizeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid prescription data");
  }

  const { medications, doctorNotes } = parsed.data;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: buildUserMessage(medications, doctorNotes) }],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);
      return jsonError("Unable to generate summary right now. Please try again later.", 502);
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      return jsonError("No summary was returned. Please try again.", 502);
    }

    return jsonSuccess({ summary });
  } catch (e) {
    console.error("Prescription summarize error:", e);
    return jsonError("Unable to generate summary right now. Please try again later.", 500);
  }
}
