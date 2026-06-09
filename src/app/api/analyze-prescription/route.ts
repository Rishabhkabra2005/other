export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

const OCR_PROMPT =
  "Read this prescription image carefully, perform OCR to extract all medicine names, dosages, durations, and instructions, and summarize them into simple terms a layperson can understand.";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export async function POST(request: Request) {
  const { error } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError("AI prescription scan is not configured. Please contact support.", 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data");
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return jsonError("A prescription image file is required.");
  }

  if (!ACCEPTED_MIME_TYPES.has(fileEntry.type)) {
    return jsonError("Only PNG, JPG, and JPEG images are supported.");
  }

  if (fileEntry.size > MAX_FILE_SIZE) {
    return jsonError("Image must be 10 MB or smaller.");
  }

  const mimeType = fileEntry.type === "image/jpg" ? "image/jpeg" : fileEntry.type;

  try {
    const buffer = await fileEntry.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: OCR_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini Vision API error:", geminiRes.status, errBody);
      return jsonError("Unable to analyze the prescription right now. Please try again later.", 502);
    }

    const data = (await geminiRes.json()) as GeminiGenerateResponse;

    let aiText = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = data.candidates[0].content.parts[0].text;
    }

    const summary = aiText.trim();
    if (!summary) {
      return jsonError("No summary was returned. Please try a clearer photo.", 502);
    }

    return jsonSuccess({ summary });
  } catch (error) {
    console.error(
      "🔴 SCAN PRESCRIPTION API CRASHED:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error: `System Error: ${error instanceof Error ? error.message : "Request failed"}`,
      },
      { status: 500 }
    );
  }
}
