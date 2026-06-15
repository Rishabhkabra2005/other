export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

const OCR_PROMPT =
  "Perform OCR on this prescription image carefully. Extract all medicine names, dosages, durations, and doctor instructions. Then summarize the extracted medical data into simple, plain terms that a layperson can easily understand. Use clear headings and bullet points.";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function POST(request: Request) {
  const { error } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const apiKey = process.env.GROQ_API_KEY;
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
    const base64Data = Buffer.from(buffer).toString("base64");

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("Groq Vision API error:", groqRes.status, errBody);
      return jsonError("Unable to analyze the prescription right now. Please try again later.", 502);
    }

    const data = (await groqRes.json()) as GroqChatResponse;

    let aiText = "";
    if (data?.choices?.[0]?.message?.content) {
      aiText = data.choices[0].message.content;
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
