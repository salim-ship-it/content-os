"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "vl.chat.conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function autoTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";
  const text = first.content.replace(/\n/g, " ").trim();
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}

const COMMANDS = [
  {
    label: "Suggest ideas",
    icon: "💡",
    prompt: "Suggest me 5 content ideas I can write about this week. Pick from the top-performing posts in my database and give me a unique angle for each one.",
  },
  {
    label: "Write in creator style",
    icon: "✍️",
    prompt: "Write a LinkedIn post in the style of ",
    partial: true,
  },
  {
    label: "Score my post",
    icon: "📊",
    prompt: "Score this post using the 6-dimension rubric (AI Smell, Hook, CTA, Format, Structure, Storytelling). Give me the score out of 60 and one fix per dimension:\n\n",
    partial: true,
  },
  {
    label: "Iterate post",
    icon: "🔄",
    prompt: "Take this post and improve it based on my voice profile. Keep what works, fix what doesn't:\n\n",
    partial: true,
  },
  {
    label: "Change the hook",
    icon: "🎣",
    prompt: "Give me 10 hook variations for this post idea. Mix emotional triggers (Desire, Curiosity, Fear). Each hook should be under 10 words:\n\n",
    partial: true,
  },
  {
    label: "Create a lead magnet",
    icon: "🧲",
    prompt: "I want to create a lead magnet LinkedIn post. First, fetch my saved lead magnet posts from /api/lead-magnets to see what's been working in my swipe file. Then help me create a new lead magnet post by:\n\n1. Ask me what topic/resource I want to offer (playbook, template, checklist, vault, etc.)\n2. Show me 3 post structures inspired by the highest-engagement lead magnet posts in my swipe file\n3. Write the full post draft using the winning patterns: strong hook, clear value stack, social proof if I have it, and a comment-trigger CTA\n4. Score it against the best lead magnets in my database\n\nStart by pulling my lead magnet swipe file and telling me what patterns are winning.",
  },
];

export function ChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    const convos = loadConversations();
    setConversations(convos);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const persist = useCallback(
    (id: string, msgs: Message[]) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === id);
        let next: Conversation[];
        if (existing) {
          next = prev.map((c) =>
            c.id === id
              ? { ...c, messages: msgs, title: autoTitle(msgs), updatedAt: new Date().toISOString() }
              : c,
          );
        } else {
          next = [
            {
              id,
              title: autoTitle(msgs),
              messages: msgs,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        saveConversations(next);
        return next;
      });
    },
    [],
  );

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setShowHistory(false);
  }

  function loadConversation(id: string) {
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      setActiveId(convo.id);
      setMessages(convo.messages);
      setShowHistory(false);
    }
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveConversations(next);
      return next;
    });
    if (activeId === id) startNewChat();
  }

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const convoId = activeId || generateId();
    if (!activeId) setActiveId(convoId);
    persist(convoId, nextMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const withReply = [...nextMessages, { role: "assistant" as const, content: data.reply }];
      setMessages(withReply);
      persist(convoId, withReply);
    } catch (e: unknown) {
      const errMsg = [...nextMessages, { role: "assistant" as const, content: `Error: ${e instanceof Error ? e.message : "Something went wrong"}` }];
      setMessages(errMsg);
      persist(convoId, errMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleCommand(cmd: (typeof COMMANDS)[number]) {
    if (cmd.partial) {
      setInput(cmd.prompt);
      inputRef.current?.focus();
    } else {
      send(cmd.prompt);
    }
  }

  function translateLastToArabic() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant || loading) return;
    const prompt = `Translate the post below into natural conversational Lebanese Arabic — the everyday spoken dialect Lebanese people actually write on LinkedIn. NOT classical فصحى.

Rules:
- Use spoken Lebanese words: هيدا، هيك، شو، ليش، بدي، فيك، منيح، كتير، عنجد، هلأ، لازم، بقدر، عم، رح، مش، ما، لحتى، حتى.
- Keep it casual, direct, conversational — like a friend talking.
- Preserve the original meaning, structure, line breaks, hooks, lists, and CTAs.
- Keep brand names, links, hashtags, and English product names in English.
- Do NOT add commentary or explanation. Output the translated post only.

Post to translate:

${lastAssistant.content}`;
    send(prompt);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0;
  const hasHistory = mounted && conversations.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      {/* Top bar — new chat + history toggle */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--vl-border)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={startNewChat}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "var(--vl-accent)", color: "white" }}
          >
            + New chat
          </button>
          {activeId && (
            <span className="text-xs font-medium truncate max-w-xs" style={{ color: "var(--vl-text-muted)" }}>
              {conversations.find((c) => c.id === activeId)?.title || "Current"}
            </span>
          )}
        </div>
        {hasHistory && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-semibold"
            style={{ color: "var(--vl-accent)" }}
          >
            {showHistory ? "Hide history" : `History (${conversations.length})`}
          </button>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <div
          className="shrink-0 border-b overflow-y-auto"
          style={{ borderColor: "var(--vl-border)", maxHeight: 280, background: "white" }}
        >
          <div className="px-6 py-3 space-y-1">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--vl-bg-card)]"
                style={{
                  background: convo.id === activeId ? "var(--vl-accent-glow)" : "transparent",
                }}
                onClick={() => loadConversation(convo.id)}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: convo.id === activeId ? "var(--vl-accent-hover)" : "var(--vl-text-heading)" }}
                  >
                    {convo.title}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--vl-text-muted)" }}>
                    {convo.messages.length} messages · {new Date(convo.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(convo.id);
                  }}
                  className="text-sm px-1 transition-colors hover:text-[#ef4444]"
                  style={{ color: "var(--vl-text-muted)" }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="max-w-2xl w-full text-center">
              <div className="text-[11px] uppercase tracking-[0.22em] mb-4" style={{ color: "var(--vl-accent)" }}>
                Content OS
              </div>
              <h1
                className="text-4xl font-bold mb-3"
                style={{ color: "var(--vl-text-heading)", letterSpacing: "-0.02em" }}
              >
                What do you want to write?
              </h1>
              <p className="text-lg mb-10" style={{ color: "var(--vl-text-muted)" }}>
                Search ideas, imitate a post, draft content, score your writing.
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    onClick={() => handleCommand(cmd)}
                    className="px-4 py-2.5 rounded-full border text-sm font-medium transition-all hover:shadow-sm"
                    style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-heading)", background: "white" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--vl-accent)";
                      e.currentTarget.style.color = "var(--vl-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--vl-border)";
                      e.currentTarget.style.color = "var(--vl-text-heading)";
                    }}
                  >
                    {cmd.icon} {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                  style={
                    msg.role === "user"
                      ? { background: "var(--vl-accent)", color: "#fff" }
                      : { background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }
                  }
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        hr: () => <hr className="my-3 border-gray-200" />,
                        h2: ({ children }) => <h2 className="font-semibold text-base mt-3 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-semibold mt-2 mb-1">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-md px-5 py-3.5 text-sm"
                  style={{ background: "white", color: "var(--vl-text-muted)", border: "1px solid var(--vl-border)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-6 pb-4">
        <div className="max-w-3xl mx-auto">
          {!isEmpty && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleCommand(cmd)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)", background: "white" }}
                >
                  {cmd.icon} {cmd.label}
                </button>
              ))}
              {messages.some((m) => m.role === "assistant") && (
                <button
                  onClick={translateLastToArabic}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ borderColor: "var(--vl-accent)", color: "var(--vl-accent)", background: "white" }}
                  title="Translate the last reply into Lebanese Arabic"
                >
                  🌐 Translate to Arabic
                </button>
              )}
            </div>
          )}

          <div className="relative bg-white rounded-2xl border shadow-sm" style={{ borderColor: "var(--vl-border)" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search ideas, imitate a post, draft content..."
              rows={1}
              className="w-full resize-none px-5 py-4 pr-14 rounded-2xl text-sm outline-none"
              style={{ color: "var(--vl-text)", background: "transparent", minHeight: 52, maxHeight: 200 }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
              style={{
                background: input.trim() ? "var(--vl-accent)" : "var(--vl-bg-card)",
                color: input.trim() ? "#fff" : "var(--vl-text-muted)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a.5.5 0 01.5.5v10.793l3.146-3.147a.5.5 0 01.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 12.793V2a.5.5 0 01.5-.5z" transform="rotate(180 8 8)" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--vl-text-muted)" }}>
              <span style={{ fontSize: 14 }}>✦</span>
              Claude Sonnet 4.6
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
