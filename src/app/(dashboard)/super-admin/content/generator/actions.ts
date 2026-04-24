"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

export async function generateAIBlog(topic: string) {
  if (!GEMINI_API_KEY) {
    return { error: "Gemini API key is not configured." };
  }

  try {
    const systemPrompt = `You are an expert SEO Content Marketer for "Bodhi Edu Hub", a premium reading room and study space in Trivandrum, Kerala.
Your task is to write a highly engaging, SEO-optimized blog post about the following topic: "${topic}".

Format your response strictly in Markdown.

Requirements:
1. Start directly with an H1 title (e.g. # 5 Tips for UPSC Prep).
2. Write an engaging introduction.
3. Use H2 and H3 tags to structure the content.
4. Keep the tone professional, encouraging, and localized (mentioning Trivandrum/Kerala subtly).
5. At the very end, include a call-to-action (CTA) to join Bodhi Edu Hub for a "quiet, distraction-free environment".
6. DO NOT include any introductory or concluding conversational text (e.g., "Here is your article:"). Just return the Markdown content.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nTopic: ${topic}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini Error:", response.status, errText);
      throw new Error(`Gemini Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { content };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function publishAIBlogAction(title: string, markdownContent: string) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase.from("posts").insert({
    title,
    type: "blog",
    content: markdownContent,
    status: "published",
    audience: "public",
    published_at: new Date().toISOString()
  }).select().single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/super-admin/content");
  return { success: true, post: data };
}
