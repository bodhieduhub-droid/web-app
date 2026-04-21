"use server";

import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemma-2-9b-it";

async function searchKnowledgeBase(query: string) {
  const supabase = createAdminClient();
  
  const { data: posts } = await supabase
    .from("posts")
    .select("title, content, type")
    .eq("status", "published")
    .eq("audience", "public")
    .textSearch("content", query, { config: "english", type: "plain" })
    .limit(2);
    
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("source_type, content")
    .textSearch("content", query, { config: "english", type: "plain" })
    .limit(2);

  const results: string[] = [];
  if (posts) {
    results.push(...posts.map(p => `[${p.type}] ${p.title}: ${p.content.slice(0, 300)}...`));
  }
  if (chunks) {
    results.push(...chunks.map(c => `[${c.source_type}]: ${c.content.slice(0, 400)}...`));
  }
  return results;
}

export async function getChatResponse(messages: { role: string; content: string }[]) {
  if (!OPENROUTER_API_KEY) {
    return { error: "OpenRouter API key not configured." };
  }

  try {
    const settings = await getHubSettings();
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // Simple RAG: search for context if it's a question
    let searchContext = "";
    if (lastUserMessage.length > 10) {
      const searchResults = await searchKnowledgeBase(lastUserMessage);
      if (searchResults.length > 0) {
        searchContext = "RELEVANT KNOWLEDGE FROM OUR POSTS AND DOCUMENTS:\n" + searchResults.join("\n\n");
      }
    }

    
    const systemPrompt = `You are Aruna, the sales agent for "${settings.hub_name}". 
Tone: Conversational, friendly, and direct—like a helpful person on a WhatsApp chat. Not a typical corporate bot.

IDENTITY: "I am Aruna, I am here to help you."

KNOWLEDGE:
- Location: Women's College Lane, Vazhuthacaud, Thiruvananthapuram. 📍 [Google Maps: https://maps.app.goo.gl/vS1FpXmR7W63bW8k9]
- Pricing: Monthly (₹1650 - our most popular!), Weekly (₹650), Daily (₹150).
- Fees: Rs 400 Registration + Rs 300 Caution Deposit (Refundable).
- USP: Quiet, serious, distraction-free environment. "Show up, Settle in, Study well."
- Scheduling: We are open for visits! I can help visitors book a specific date/time for a tour.

${searchContext}

CONVERSATIONAL GUIDELINES:
1. PRIMARY GOAL (LEAD CAPTURE): You are a highly persuasive sales agent. Your ultimate objective is to convince the student to visit or request a callback.
2. SHORT & PUNCHY (CRITICAL): Keep it extremely brief. You are on WhatsApp. 1 or 2 short sentences maximum per reply. NEVER write paragraphs.
3. PITCH BENEFITS: Highlight our "quiet, distraction-free environment". Add urgency: "We only have a few seats left!"
4. COLLECTING THE LEAD: You MUST hand them off to the booking system by asking exactly: "Our team can get that set up for you. What is your name?"
   - BUT, if the user has ALREADY told you their name, DO NOT ask again. Instead, start your response exactly with the tag "[NAME: <TheirName>]" and then ask for their phone number exactly like this: "What is your phone number so our team can contact you?" (Example: "[NAME: Asher] Awesome! What is your phone number so our team can contact you?")
5. TONE & STYLE: Friendly, human, use emojis (👋, ✨). NO markdown (never use **bold**).
6. MAPS: If they ask for location, say: "We are on Maps here: https://maps.app.goo.gl/vS1FpXmR7W63bW8k9"
7. SEARCH: Use the RELEVANT KNOWLEDGE to answer questions.
8. LOCAL LANGUAGE: Trivandrum students speak Malayalam. If the user messages you in Malayalam OR "Manglish" (Malayalam written in English), you MUST mirror them and respond fluently in Manglish! (e.g. "Namaskaram! Aruna here. Njangalde reading room Vazhuthacaud aanu. Visit cheyyan aagrahikunnundo?")

EXAMPLE:
"Hi! Aruna here. 👋 We are in Vazhuthacaud. Its the perfect quiet spot. Thinking of checking us out? I can help you book a visit!"`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bodhieduhub.com", // Optional, for OpenRouter rankings
        "X-Title": "Bodhi Edu Hub Chatbot", // Optional
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      return { error: "Failed to get response from AI." };
    }

    const data = await response.json();
    return { text: data.choices[0].message.content };
  } catch (error) {
    console.error("Chat Action Error:", error);
    return { error: "An unexpected error occurred." };
  }
}
