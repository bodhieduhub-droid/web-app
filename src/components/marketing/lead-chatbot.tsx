"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, Sparkles, User, X } from "lucide-react";

import { submitEnquiry } from "@/app/register/actions";

type ChatPhase = "welcome" | "intent" | "name" | "phone" | "email" | "done";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const publicChatPaths = new Set([
  "/",
  "/services",
  "/testimonials",
  "/blogs",
  "/notes",
  "/job-opportunities",
  "/contact-us",
  "/register",
  "/login",
]);

const starterReplies = [
  "I need pricing",
  "I want to visit first",
  "Tell me about the monthly plan",
  "I want a call from your team",
];

const followUpReplies = [
  "Monthly plan",
  "Visit the reading room",
  "Talk to the team",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const welcomeMessages: Message[] = [
  {
    id: "welcome-1",
    role: "assistant",
    text: "Hi, I’m the Bodhi assistant. I can answer common questions and collect your details for a callback.",
  },
  {
    id: "welcome-2",
    role: "assistant",
    text: "What do you want help with first?",
  },
];

export function LeadChatbot() {
  const pathname = usePathname();
  const shouldShow = pathname ? publicChatPaths.has(pathname) : false;
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>("welcome");
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [input, setInput] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const quickReplies = useMemo(() => {
    if (phase === "welcome" || phase === "intent") {
      return selectedIntent ? followUpReplies : starterReplies;
    }

    if (phase === "done") {
      return ["Start again"];
    }

    return [];
  }, [phase, selectedIntent]);

  if (!shouldShow) {
    return null;
  }

  function pushAssistant(text: string) {
    setMessages((current) => [...current, { id: makeId(), role: "assistant", text }]);
  }

  function pushUser(text: string) {
    setMessages((current) => [...current, { id: makeId(), role: "user", text }]);
  }

  function resetConversation() {
    setPhase("welcome");
    setMessages(welcomeMessages);
    setInput("");
    setSelectedIntent("");
    setName("");
    setPhone("");
    setStatusMessage("");
  }

  function askForName(intent: string) {
    setSelectedIntent(intent);
    setPhase("name");
    pushAssistant(
      `I can help with ${intent.toLowerCase()}. Share your name first and I’ll get your enquiry ready for the team.`,
    );
  }

  function handleIntent(intent: string) {
    const normalized = intent.toLowerCase();

    if (normalized.includes("pricing")) {
      setSelectedIntent("pricing and plans");
      setPhase("intent");
      pushAssistant(
        "The current reading room plans shown on the site are Daily at Rs.150, Weekly at Rs.650, and Monthly at Rs.1650.",
      );
      pushAssistant("If you want, I can also ask the team to call you and help you choose the right plan.");
      return;
    }

    if (normalized.includes("visit")) {
      askForName("visiting the reading room");
      return;
    }

    if (normalized.includes("monthly")) {
      setSelectedIntent("the monthly plan");
      setPhase("intent");
      pushAssistant(
        "The monthly plan is the most chosen option for students who want a stable daily study routine and full reading room access.",
      );
      pushAssistant("If you want a callback about the monthly plan, I can take your details now.");
      return;
    }

    askForName("a callback from the Bodhi team");
  }

  function handleQuickReply(reply: string) {
    setIsOpen(true);
    pushUser(reply);

    if (reply === "Start again") {
      resetConversation();
      return;
    }

    if (phase === "welcome" || phase === "intent") {
      if (
        selectedIntent &&
        reply !== "Monthly plan" &&
        reply !== "Visit the reading room" &&
        reply !== "Talk to the team"
      ) {
        askForName(selectedIntent);
        return;
      }

      if (reply === "Monthly plan") {
        askForName("the monthly plan");
        return;
      }

      if (reply === "Visit the reading room") {
        askForName("visiting the reading room");
        return;
      }

      if (reply === "Talk to the team") {
        askForName("a callback from the Bodhi team");
        return;
      }

      handleIntent(reply);
    }
  }

  function handleFlow(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setIsOpen(true);
    pushUser(trimmed);
    setInput("");
    setStatusMessage("");

    if (phase === "welcome" || phase === "intent") {
      handleIntent(trimmed);
      return;
    }

    if (phase === "name") {
      setName(trimmed);
      setPhase("phone");
      pushAssistant("Thanks. What phone number should the team use?");
      return;
    }

    if (phase === "phone") {
      setPhone(trimmed);
      setPhase("email");
      pushAssistant("Optional: share your email too. If you prefer not to, type skip.");
      return;
    }

    if (phase === "email") {
      const emailValue = trimmed.toLowerCase() === "skip" ? "" : trimmed;
      startTransition(async () => {
        const result = await submitEnquiry({
          name,
          phone,
          email: emailValue || undefined,
        });

        if (result.error) {
          setStatusMessage(result.error);
          pushAssistant("I couldn’t submit that enquiry right now. Please try again in a moment.");
          return;
        }

        setPhase("done");
        setStatusMessage("Lead captured successfully.");
        pushAssistant("Done. Your enquiry has been sent to the team.");
        pushAssistant("They’ll contact you shortly. If you want to leave another lead, tap Start again.");
      });
    }
  }

  return (
    <>
      {isOpen ? (
        <section className="fixed right-4 bottom-4 z-[70] flex h-[36rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-[#cfd5c7] bg-[#fffdf7] shadow-[0_30px_80px_rgba(24,40,29,0.22)]">
          <div className="relative overflow-hidden border-b border-[#d8ddcf] bg-[linear-gradient(135deg,#1f3828_0%,#284632_55%,#36553d_100%)] px-5 py-5 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,230,210,0.24),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/75">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Lead Assistant
                </div>
                <div>
                  <p className="font-serif text-2xl leading-tight">Bodhi Chat</p>
                  <p className="text-sm leading-6 text-white/75">
                    Quick answers, plan guidance, and enquiry capture.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/10 bg-white/10 p-2 text-white/85 transition hover:bg-white/16"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f9f5eb_0%,#fdfcf8_100%)] px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`flex max-w-[85%] items-start gap-3 rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "assistant"
                      ? "border border-[#dde3d5] bg-white text-[#1b3022]"
                      : "bg-[#1f3828] text-white"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      message.role === "assistant" ? "bg-[#e9eddc] text-[#1b3022]" : "bg-white/12 text-white"
                    }`}
                  >
                    {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}

            {quickReplies.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleQuickReply(reply)}
                    className="rounded-full border border-[#d5dccb] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#294231] transition hover:border-[#1f3828] hover:bg-[#eef3e5]"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            ) : null}

            {statusMessage ? (
              <div className="rounded-[1.4rem] border border-[#d9dfd2] bg-[#f2f6ec] px-4 py-3 text-sm font-semibold text-[#294231]">
                {statusMessage}
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isPending) {
                return;
              }
              handleFlow(input);
            }}
            className="border-t border-[#d8ddcf] bg-white px-4 py-4"
          >
            <div className="flex items-center gap-3 rounded-[1.4rem] border border-[#d8ddcf] bg-[#fbfaf4] px-3 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  phase === "name"
                    ? "Type your name"
                    : phase === "phone"
                      ? "Type your phone number"
                      : phase === "email"
                        ? "Type your email or skip"
                        : "Ask a question or choose an option"
                }
                className="h-11 flex-1 bg-transparent px-1 text-sm text-[#1b3022] outline-none placeholder:text-[#7a8775]"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f3828] text-white transition hover:bg-[#294633] disabled:cursor-not-allowed disabled:bg-[#95a18f]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-[65] flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3828] text-white shadow-[0_20px_50px_rgba(24,40,29,0.24)] transition hover:-translate-y-0.5 hover:bg-[#294633]"
          aria-label="Open chat"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      ) : null}
    </>
  );
}
