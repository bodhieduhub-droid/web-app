"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageCircle, Mic, Send, Sparkles, User, X } from "lucide-react";

import { submitEnquiry, updateEnquiryEmail } from "@/app/register/actions";
import { getChatResponse } from "@/app/(dashboard)/chat-actions";

type ChatPhase = "welcome" | "intent" | "name" | "phone" | "email" | "scheduling_date" | "scheduling_time" | "done";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  imageUrl?: string;
  timestamp: Date;
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
  "Talk on WhatsApp",
  "Talk to the team",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const welcomeMessages: Message[] = [
  {
    id: "welcome-1",
    role: "assistant",
    text: "Hi, I am Bhanu. I am here to help you find the perfect study environment at Bodhi.",
    timestamp: new Date(),
  },
  {
    id: "welcome-2",
    role: "assistant",
    text: "How can I assist you today?",
    timestamp: new Date(),
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
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bhanu_chat_state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.messages && parsed.messages.length > 0) {
            setMessages(parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            if (parsed.phase) setPhase(parsed.phase);
            if (parsed.enquiryId) setEnquiryId(parsed.enquiryId);
            if (parsed.selectedIntent) setSelectedIntent(parsed.selectedIntent);
            if (parsed.name) setName(parsed.name);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.visitDate) setVisitDate(parsed.visitDate);
            if (parsed.visitTime) setVisitTime(parsed.visitTime);
          }
        } catch (e) {}
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(
        "bhanu_chat_state",
        JSON.stringify({ messages, phase, enquiryId, selectedIntent, name, phone, visitDate, visitTime })
      );
    }
  }, [messages, phase, enquiryId, selectedIntent, name, phone, visitDate, visitTime, isInitialized]);

  useEffect(() => {
    if (isInitialized && !isOpen && messages.length <= 2 && !hasShownPopup && pathname) {
      let customMessage = "";
      if (pathname === "/register") {
        customMessage = "Hi! Let me know if you need help with your registration or have questions about our plans.";
      } else if (pathname === "/pricing" || pathname === "/services") {
        customMessage = "Hello! I can help you decide which study plan is right for you.";
      } else if (pathname.includes("/blogs") || pathname.includes("/notes")) {
        customMessage = "Are you preparing for exams? Let me know if you want to visit our quiet reading room!";
      }

      if (customMessage) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasShownPopup(true);
          setMessages((current) => [
            ...current,
            { id: makeId(), role: "assistant", text: customMessage, timestamp: new Date() },
          ]);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isInitialized, isOpen, messages.length, hasShownPopup]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

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
    setMessages((current) => [...current, { id: makeId(), role: "assistant", text, timestamp: new Date() }]);
  }

  function pushUser(text: string) {
    setMessages((current) => [...current, { id: makeId(), role: "user", text, timestamp: new Date() }]);
  }

  function resetConversation() {
    setPhase("welcome");
    setMessages(welcomeMessages);
    setInput("");
    setSelectedIntent("");
    setName("");
    setPhone("");
    setVisitDate("");
    setVisitTime("");
    setEnquiryId(null);
    setStatusMessage("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("bhanu_chat_state");
    }
  }

  function askForName(intent: string) {
    setSelectedIntent(intent);
    setPhase("name");
    pushAssistant(
      `I can help with ${intent.toLowerCase()}. Share your name first and I’ll get your enquiry ready for the team.`,
    );
  }

  async function handleIntent(intent: string) {
    const normalized = intent.toLowerCase();

    // Check for explicit interest in visiting or callback to trigger structured flow
    if (normalized.includes("visit") || normalized.includes("call") || normalized.includes("talk")) {
      const target = normalized.includes("visit") ? "visiting the reading room" : "a callback from the Bodhi team";
      askForName(target);
      return;
    }

    // Otherwise, use AI for general questions
    const history = messages
      .filter((m) => m.id !== "welcome-1" && m.id !== "welcome-2") // Skip welcome markers if they are static
      .map((m) => ({
        role: m.role,
        content: m.text,
      }));

    // Add current user message to history if not already there
    // Actually handleFlow already pushed it to messages state
    
    startTransition(async () => {
      const result = await getChatResponse([...history, { role: "user", content: intent }]);
      
      if (result.error) {
        pushAssistant("I am having trouble connecting to my brain right now. Please try again or choose an option below.");
        return;
      }

    if (result.text) {
        let processedText = result.text;
        
        // Extract dynamically pushed Name from AI (if user already provided it)
        const nameMatch = processedText.match(/\[NAME:\s*(.+?)\]/i);
        let extractedName = "";
        if (nameMatch) {
          extractedName = nameMatch[1].trim();
          processedText = processedText.replace(/\[NAME:\s*.+?\]/i, "");
        }

        // Detect image URLs in the text
        const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
        const match = processedText.match(imgRegex);
        processedText = processedText.replace(imgRegex, "").trim();
        
        setMessages((current) => [
          ...current,
          { 
            id: makeId(), 
            role: "assistant", 
            text: processedText,
            imageUrl: match ? match[0] : undefined,
            timestamp: new Date()
          }
        ]);

        const text = processedText.toLowerCase();
        
        // Check for handoff triggers
        if (extractedName) {
          setName(extractedName);
          setPhase("phone");
          setSelectedIntent("scheduling a visit");
        } else if (text.includes("what is your name") || text.includes("what's your name") || text.includes("whats your name") || text.includes("share your name") || text.includes("can i get your name")) {
          setPhase("name");
          setSelectedIntent("scheduling a visit");
        }
      }
    });
  }

  function handleQuickReply(reply: string) {
    setIsOpen(true);
    
    if (reply === "Talk on WhatsApp") {
      window.open(`https://wa.me/919999999999?text=Hi%20Bhanu,%20I%20would%20like%20to%20know%20more%20about%20the%20reading%20room.`, "_blank");
      return;  
    }
    
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
        // If we were already in a flow, continue
        if (selectedIntent.includes("visit") && phase === "welcome") {
           askForName("visiting");
           return;
        }
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
      if (selectedIntent.includes("visit")) {
        setPhase("scheduling_date");
        pushAssistant("Got it. Which date would you like to visit us? (Type e.g., Tomorrow, Monday, or a specific date)");
      } else {
        setPhase("email");
        pushAssistant("Optional: share your email too. If you prefer not to, type skip.");
        // Submit draft lead
        startTransition(async () => {
          const result = await submitEnquiry({ name, phone: trimmed });
          if (result.id) setEnquiryId(result.id);
        });
      }
      return;
    }

    if (phase === "scheduling_date") {
      setVisitDate(trimmed);
      setPhase("scheduling_time");
      pushAssistant("What time works for you? We are open from 6:00 AM to 10:00 PM.");
      return;
    }

    if (phase === "scheduling_time") {
      setVisitTime(trimmed);
      setPhase("email");
      pushAssistant("Almost done! Optional: share your email too. If you prefer not to, type skip.");
      // Submit draft lead with visit context
      startTransition(async () => {
        const result = await submitEnquiry({ name, phone, visit_date: visitDate, visit_time: trimmed });
        if (result.id) setEnquiryId(result.id);
      });
      return;
    }

    if (phase === "email") {
      const emailValue = trimmed.toLowerCase() === "skip" ? "" : trimmed;
      
      startTransition(async () => {
        if (emailValue && enquiryId) {
          await updateEnquiryEmail(enquiryId, emailValue);
        } else if (!enquiryId) {
          // Fallback if draft failed
          const result = await submitEnquiry({
            name,
            phone,
            email: emailValue || undefined,
            visit_date: visitDate,
            visit_time: visitTime,
          });
          if (result.error) {
            setStatusMessage(result.error);
            pushAssistant("I couldn’t submit that enquiry right now. Please try again in a moment.");
            return;
          }
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
          <div className="relative overflow-hidden border-b border-white/20 bg-white/70 backdrop-blur-xl px-5 py-5 text-[#1b3022] shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(40,70,50,0.05)_0%,rgba(40,70,50,0.15)_100%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#284632]/10 bg-white/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#284632]">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Bhanu — Sales Assistant
                </div>
                <div>
                  <p className="font-serif text-2xl leading-tight">Bodhi Chat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[#284632]/10 bg-white/60 p-2 text-[#284632] transition hover:bg-white/90"
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
                className={`flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex flex-col ${message.role === "assistant" ? "items-start" : "items-end"} max-w-[85%]`}>
                  <div
                    className={`flex items-start gap-3 px-4 py-3 text-sm leading-6 shadow-sm transition-all ${
                      message.role === "assistant"
                        ? "rounded-2xl rounded-bl-sm border border-[#dde3d5] bg-white text-[#1b3022]"
                        : "rounded-2xl rounded-br-sm bg-[linear-gradient(135deg,#1f3828_0%,#284632_100%)] text-white"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        message.role === "assistant" ? "bg-[#e9eddc] text-[#1b3022]" : "bg-white/12 text-white"
                      }`}
                    >
                      {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      {message.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={message.imageUrl}
                          alt="Chat attachment"
                          className="h-auto max-w-full rounded-lg border border-[#dde3d5]"
                        />
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#7a8775] mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isPending && phase !== "email" && (
              <div className="flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 justify-start">
                <div className="flex max-w-[85%] items-start gap-3 rounded-2xl rounded-bl-sm border border-[#dde3d5] bg-white px-4 py-3 text-sm leading-6 shadow-sm">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e9eddc] text-[#1b3022]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 justify-center h-7">
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7a8775] [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7a8775] [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7a8775]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      : phase === "scheduling_date"
                        ? "Which date? (e.g. Tomorrow)"
                        : phase === "scheduling_time"
                          ? "What time? (e.g. 10 AM)"
                        : phase === "email"
                          ? "Type your email or skip"
                        : "Ask a question or choose an option"
                }
                className="h-11 flex-1 bg-transparent px-1 text-sm text-[#1b3022] outline-none placeholder:text-[#7a8775]"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-transparent text-[#7a8775] hover:bg-black/5 hover:text-[#1b3022]"}`}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
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
