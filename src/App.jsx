import { useEffect, useMemo, useRef, useState } from "react";
import {
  LoaderCircle,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { requestAssistantReply } from "./chatApi";

const STORAGE_KEY = "haqqai-session-chats-v1";
const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL?.trim() || "";

const theme = {
  cream: "#FBF7EF",
  ink: "#1F2A30",
  inkSoft: "#5A6A72",
  primary: "#2B6B7F",
  primarySoft: "#E6EEF1",
  gold: "#C9A961",
  border: "rgba(43,107,127,0.12)",
  danger: "#A14F3C",
};

const patternBg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%232B6B7F' stroke-width='0.6' stroke-opacity='0.07'><path d='M40 4 L76 40 L40 76 L4 40 Z'/><path d='M40 16 L64 40 L40 64 L16 40 Z'/><circle cx='40' cy='40' r='6'/></g></svg>")`;

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSession() {
  return {
    id: makeId(),
    title: "Neuer Chat",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMessage(role, text) {
  return {
    id: makeId(),
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

function truncate(text, max = 32) {
  if (!text) return "Neuer Chat";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function buildFeedbackPayload(session, feedbackText) {
  const history = (session?.messages || [])
    .slice(-8)
    .map((message) => `${message.role === "assistant" ? "HaqqAI" : "User"}: ${message.text}`)
    .join("\n");

  return [
    "HaqqAI Feedback",
    "",
    `Zeitpunkt: ${new Date().toLocaleString("de-DE")}`,
    `Chat: ${session?.title || "Unbekannt"}`,
    "",
    "Feedback:",
    feedbackText.trim(),
    "",
    "Letzte Nachrichten:",
    history || "Keine Nachrichten vorhanden.",
  ].join("\n");
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          background: theme.primarySoft,
          border: `1px solid ${theme.border}`,
        }}
      >
        <Sparkles size={18} style={{ color: theme.primary }} />
      </div>
      <div className="leading-tight">
        <div
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: theme.ink }}
        >
          HaqqAI
        </div>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: theme.inkSoft }}
        >
          MHG Dortmund
        </div>
      </div>
    </div>
  );
}

function Sidebar({ sessions, activeId, onNew, onSelect, onDelete }) {
  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col"
      style={{
        borderRight: `1px solid ${theme.border}`,
        background: "rgba(255,255,255,0.35)",
      }}
    >
      <BrandHeader />

      <div className="px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium text-white transition hover:opacity-90"
          style={{ background: theme.primary }}
        >
          <Plus size={16} /> Neuer Chat
        </button>
      </div>

      <div
        className="mb-2 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: theme.inkSoft }}
      >
        Sitzung
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {sessions.map((session) => {
          const active = session.id === activeId;
          return (
            <div
              key={session.id}
              className="mb-1 flex items-center gap-1 rounded-lg"
              style={{
                background: active ? theme.primarySoft : "transparent",
              }}
            >
              <button
                onClick={() => onSelect(session.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] transition"
                style={{
                  color: active ? theme.primary : theme.ink,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <MessageCircle size={14} className="shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/70"
                style={{ color: theme.inkSoft }}
                aria-label={`Chat ${session.title} löschen`}
                title="Chat löschen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </nav>

      <div
        className="px-4 py-3 text-center text-[10px] uppercase tracking-wider"
        style={{ color: theme.inkSoft, borderTop: `1px solid ${theme.border}` }}
      >
        Ein Projekt der MHG Dortmund
      </div>
    </aside>
  );
}

function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[76%]">
        {!isUser && (
          <div
            className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold"
            style={{ color: theme.primary }}
          >
            <Sparkles size={12} /> HaqqAI
          </div>
        )}

        <div
          className="rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed"
          style={{
            background: isUser ? theme.primary : "rgba(255,255,255,0.85)",
            color: isUser ? "#fff" : theme.ink,
            border: isUser ? "none" : `1px solid ${theme.border}`,
            borderTopRightRadius: isUser ? 6 : 16,
            borderTopLeftRadius: isUser ? 16 : 6,
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="whitespace-pre-wrap break-words">
           <div className="prose prose-sm max-w-none break-words">
                <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: theme.gold }}
      >
        Bismillah
      </div>
      <h1
        className="mb-3 text-[30px] font-semibold tracking-tight"
        style={{ color: theme.primary, fontFamily: "Georgia, serif" }}
      >
        Assalamu alaikum
      </h1>
      <p className="max-w-md text-[15px]" style={{ color: theme.inkSoft }}>
        Wie kann ich dir heute helfen? Frag mich etwas über unsere Gemeinschaft,
        Veranstaltungen oder Inhalte der MHG Dortmund.
      </p>
    </div>
  );
}

function PromptInput({ value, onChange, onSend, disabled }) {
  const isDisabled = disabled || !value.trim();

  return (
    <div className="px-6 pb-6 pt-2">
      <div className="mx-auto max-w-3xl">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{
            background: "#fff",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 4px 24px rgba(43,107,127,0.06)",
          }}
        >
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-gray-100"
            style={{ color: theme.inkSoft }}
          >
            <Paperclip size={17} />
          </button>

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isDisabled) {
                onSend();
              }
            }}
            placeholder="Frage HaqqAI etwas..."
            className="flex-1 bg-transparent py-1.5 text-[14.5px] outline-none"
            style={{ color: theme.ink }}
          />

          <button
            type="button"
            onClick={onSend}
            disabled={isDisabled}
            className="rounded-xl p-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed"
            style={{
              background: theme.primary,
              opacity: isDisabled ? 0.55 : 1,
            }}
          >
            <Send size={15} />
          </button>
        </div>

        <div
          className="mt-3 text-center text-[10px] uppercase tracking-[0.14em]"
          style={{ color: theme.inkSoft }}
        >
          HaqqAI antwortet auf Basis von MHG-Quellen
        </div>
      </div>
    </div>
  );
}

function FeedbackDialog({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
  status,
  sessionTitle,
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-lg rounded-[28px] border bg-white/95 p-5 shadow-[0_24px_70px_rgba(31,42,48,0.18)]"
        style={{ borderColor: theme.border }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-[20px] font-semibold tracking-tight"
              style={{ color: theme.ink }}
            >
              Feedback senden
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: theme.inkSoft }}>
              Aktueller Chat: {sessionTitle || "Neuer Chat"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-gray-100"
            style={{ color: theme.inkSoft }}
            aria-label="Dialog schließen"
          >
            <X size={16} />
          </button>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Was lief gut, was war unklar oder was soll verbessert werden?"
          rows={7}
          className="mt-4 w-full resize-none rounded-2xl border px-4 py-3 text-[14px] leading-6 outline-none"
          style={{
            borderColor: theme.border,
            color: theme.ink,
            background: "rgba(255,255,255,0.9)",
          }}
        />

        <p className="mt-3 text-[12px]" style={{ color: theme.inkSoft }}>
          Wenn `VITE_FEEDBACK_EMAIL` gesetzt ist, öffnet sich dein Mailprogramm.
          Sonst wird das Feedback inklusive Chat-Kontext in die Zwischenablage kopiert.
        </p>

        {status && (
          <div className="mt-3 text-[13px]" style={{ color: theme.primary }}>
            {status}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-[14px] font-medium transition hover:bg-gray-100"
            style={{ color: theme.inkSoft }}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className="rounded-xl px-4 py-2 text-[14px] font-medium text-white transition disabled:cursor-not-allowed"
            style={{
              background: theme.primary,
              opacity: value.trim() ? 1 : 0.55,
            }}
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatArea({
  activeSession,
  messages,
  isSending,
  error,
  onDeleteCurrentChat,
  onOpenFeedback,
}) {
  const endRef = useRef(null);
  const menuRef = useRef(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOptionsOpen(false);
      }
    }

    if (!isOptionsOpen) return undefined;

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOptionsOpen]);

  function handleFeedbackClick() {
    setIsOptionsOpen(false);
    onOpenFeedback();
  }

  function handleDeleteClick() {
    setIsOptionsOpen(false);
    if (activeSession) {
      onDeleteCurrentChat(activeSession.id);
    }
  }

  return (
    <>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div
          className="text-[13px] font-medium"
          style={{ color: theme.inkSoft }}
        >
          {messages.length > 0 ? "Aktueller Dialog" : "Willkommen"}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOptionsOpen((open) => !open)}
            className="rounded-lg p-1.5 transition hover:bg-white/50"
            style={{ color: theme.inkSoft }}
            aria-label="Mehr Optionen"
            aria-expanded={isOptionsOpen}
            aria-haspopup="menu"
          >
            <MoreVertical size={17} />
          </button>

          {isOptionsOpen && (
            <div
              className="absolute right-0 top-10 z-20 min-w-[220px] rounded-2xl border bg-white/95 p-2 shadow-[0_18px_40px_rgba(31,42,48,0.14)] backdrop-blur-sm"
              style={{ borderColor: theme.border }}
              role="menu"
              aria-label="Optionen"
            >
              <button
                type="button"
                onClick={handleFeedbackClick}
                className="w-full rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-[#f3f7f8]"
                style={{ color: theme.ink }}
                role="menuitem"
              >
                Feedback senden
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-[#fff2ef]"
                style={{ color: theme.danger }}
                role="menuitem"
              >
                Aktuellen Chat löschen
              </button>
            </div>
          )}
        </div>
      </header>

      {messages.length === 0 ? (
        <WelcomeState />
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pt-8">
          <div className="mx-auto max-w-3xl">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                text={message.text}
              />
            ))}

            {isSending && (
              <div
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-[14px]"
                style={{
                  color: theme.inkSoft,
                  background: "rgba(255,255,255,0.85)",
                  borderColor: theme.border,
                }}
              >
                <LoaderCircle size={16} className="animate-spin" />
                HaqqAI antwortet gerade...
              </div>
            )}

            {error && (
              <div className="mt-4 text-[14px]" style={{ color: theme.danger }}>
                {error}
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>
      )}
    </>
  );
}

export default function HaqqAI() {
  const [sessions, setSessions] = useState(() => {
    if (typeof window === "undefined") {
      return [createSession()];
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [createSession()];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [createSession()];
    } catch {
      return [createSession()];
    }
  });
  const [activeId, setActiveId] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed[0] ? parsed[0].id : null;
    } catch {
      return null;
    }
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeId) || sessions[0] || null,
    [activeId, sessions],
  );

  useEffect(() => {
    if (!activeId && sessions[0]) {
      setActiveId(sessions[0].id);
    }
  }, [activeId, sessions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  function updateSession(sessionId, updater) {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? updater(session) : session)),
    );
  }

  function deleteSession(sessionId) {
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) return;

    const confirmed = window.confirm(`Möchtest du den Chat "${target.title}" wirklich löschen?`);
    if (!confirmed) return;

    const remaining = sessions.filter((session) => session.id !== sessionId);

    if (remaining.length === 0) {
      const next = createSession();
      setSessions([next]);
      setActiveId(next.id);
    } else {
      setSessions(remaining);
      if (activeId === sessionId) {
        setActiveId(remaining[0].id);
      }
    }

    setError("");
    setFeedbackStatus("");
    setIsFeedbackOpen(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !activeSession || isSending) return;

    const userMessage = createMessage("user", text);
    const nextMessages = [...activeSession.messages, userMessage];

    setInput("");
    setError("");

    updateSession(activeSession.id, (session) => ({
      ...session,
      title: session.messages.length === 0 ? truncate(text) : session.title,
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
    }));

    setIsSending(true);

    try {
      const answer = await requestAssistantReply({
        message: text,
        history: nextMessages.map((message) => ({
          role: message.role,
          content: message.text,
        })),
        sessionId: activeSession.id,
      });

      const assistantMessage = createMessage("assistant", answer);

      updateSession(activeSession.id, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: [...session.messages, assistantMessage],
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Beim Senden ist etwas schiefgelaufen.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleNew() {
    const next = createSession();
    setSessions((prev) => [next, ...prev]);
    setActiveId(next.id);
    setInput("");
    setError("");
    setFeedbackStatus("");
    setIsFeedbackOpen(false);
  }

  function handleSelect(id) {
    setActiveId(id);
    setError("");
    setFeedbackStatus("");
    setIsFeedbackOpen(false);
  }

  function handleOpenFeedback() {
    setFeedbackStatus("");
    setIsFeedbackOpen(true);
  }

  function handleCloseFeedback() {
    setIsFeedbackOpen(false);
    setFeedbackStatus("");
  }

  async function handleSubmitFeedback() {
    const text = feedbackText.trim();
    if (!text) return;

    const payload = buildFeedbackPayload(activeSession, text);

    if (FEEDBACK_EMAIL) {
      const subject = encodeURIComponent("HaqqAI Feedback");
      const body = encodeURIComponent(payload);
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      setFeedbackStatus("Mailprogramm wurde geöffnet.");
      setFeedbackText("");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
      setFeedbackStatus("Feedback wurde in die Zwischenablage kopiert.");
      setFeedbackText("");
    } catch {
      setFeedbackStatus("Feedback konnte nicht kopiert werden. Bitte manuell übernehmen.");
    }
  }

  return (
    <div
      className="flex h-screen w-full"
      style={{
        background: theme.cream,
        backgroundImage: patternBg,
        backgroundAttachment: "fixed",
        fontFamily: "-apple-system, system-ui, sans-serif",
      }}
    >
      <Sidebar
        sessions={sessions}
        activeId={activeSession?.id ?? null}
        onNew={handleNew}
        onSelect={handleSelect}
        onDelete={deleteSession}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatArea
          activeSession={activeSession}
          messages={activeSession?.messages || []}
          isSending={isSending}
          error={error}
          onDeleteCurrentChat={deleteSession}
          onOpenFeedback={handleOpenFeedback}
        />

        <PromptInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isSending}
        />

        <FeedbackDialog
          isOpen={isFeedbackOpen}
          value={feedbackText}
          onChange={setFeedbackText}
          onClose={handleCloseFeedback}
          onSubmit={handleSubmitFeedback}
          status={feedbackStatus}
          sessionTitle={activeSession?.title}
        />
      </main>
    </div>
  );
}
