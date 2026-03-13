import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage as BackendChatMessage } from "../backend.d";
import type { backendInterface as FullBackend } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type { ChatMessage as BackendChatMessage };

export type ChatMessage = {
  id: string;
  text: string;
  fromAdmin: boolean;
  timestamp: number;
  sessionId: string;
  senderName?: string;
};

const BANNED_WORDS = [
  "chutya",
  "gandu",
  "louda",
  "madarchod",
  "mc",
  "bhosdk",
  "bhosd",
  "randi",
  "harami",
];

/** Strip HTML/script tags to prevent XSS - React renders as text node but extra safety */
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function containsBannedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

function backendMsgToLocal(msg: BackendChatMessage): ChatMessage {
  return {
    id: msg.id.toString(),
    text: sanitizeText(msg.text),
    fromAdmin: msg.fromAdmin,
    timestamp: Number(msg.timestamp / 1_000_000n),
    sessionId: msg.customerPrincipal.toString(),
    senderName: msg.fromAdmin ? "PAIDEDIT Support" : "You",
  };
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!identity;

  // Auto-register user to ensure they can send messages
  useEffect(() => {
    if (!actor || !identity || isFetching) return;
    (actor as any)
      .selfRegister()
      .then((id: string) => {
        setCustomerId(id);
      })
      .catch(() => {});
  }, [actor, identity, isFetching]);

  const refresh = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const msgs = await (actor as unknown as FullBackend).getMyChat();
      setMessages(msgs.map(backendMsgToLocal));
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch {
      // silent
    }
  }, [actor, isFetching]);

  useEffect(() => {
    if (!actor || !isLoggedIn) return;
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh, actor, isLoggedIn]);

  useEffect(() => {
    if (open && isLoggedIn) {
      refresh();
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, refresh, isLoggedIn]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !actor || sending) return;

    if (containsBannedWord(trimmed)) {
      toast.error("Abusive language not allowed. Please be respectful.");
      return;
    }

    setSending(true);
    try {
      await (actor as unknown as FullBackend).sendCustomerMessage(
        sanitizeText(trimmed),
      );
      setInputText("");
      await refresh();
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const lastAdminMsg = messages.filter((m) => m.fromAdmin).slice(-1)[0];
  const showBadge =
    !open &&
    lastAdminMsg &&
    Date.now() - lastAdminMsg.timestamp < 300_000 &&
    messages.length > 0;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      style={{ fontFamily: "var(--font-body, inherit)" }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-violet-500/30 overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #1a0a2e 0%, #12071f 100%)",
              boxShadow: "0 8px 40px rgba(139,92,246,0.35)",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-violet-700/80 to-purple-700/80 border-b border-violet-500/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-400/20 border border-violet-400/40 flex items-center justify-center text-lg">
                  💬
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    Support Chat
                  </p>
                  <p className="text-xs text-violet-300">
                    PAIDEDIT · We reply fast
                  </p>
                  {customerId && (
                    <p className="text-[10px] text-violet-400 font-bold mt-0.5">
                      ID: {customerId}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-violet-300 hover:text-white hover:bg-violet-500/30 transition-colors"
                data-ocid="chat.close_button"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="h-72">
              <div className="p-3 space-y-2 flex flex-col">
                {!isLoggedIn ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm font-bold text-violet-200">
                      Start chatting with support
                    </p>
                    <p className="text-xs text-violet-400 mt-1 mb-3">
                      Sign in with Google to send messages
                    </p>
                    <Button
                      onClick={login}
                      disabled={isLoggingIn}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
                      data-ocid="chat.primary_button"
                    >
                      {isLoggingIn ? "Signing in..." : "Sign in to Chat"}
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">👋</p>
                    <p className="text-sm font-bold text-violet-200">
                      Hi there!
                    </p>
                    <p className="text-xs text-violet-400 mt-1">
                      Send a message and we'll get back to you right away.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.fromAdmin ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                          msg.fromAdmin
                            ? "bg-violet-800/60 border border-violet-600/30 rounded-tl-sm text-left"
                            : "bg-gradient-to-br from-violet-600 to-purple-700 rounded-tr-sm text-right"
                        }`}
                      >
                        {msg.fromAdmin && (
                          <p className="text-xs font-bold text-violet-300 mb-0.5">
                            {msg.senderName ?? "Support"}
                          </p>
                        )}
                        <p className="text-sm font-bold text-white leading-snug">
                          {msg.text}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            msg.fromAdmin
                              ? "text-violet-400"
                              : "text-violet-200/70"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-violet-500/20 flex gap-2 bg-black/20">
              {!isLoggedIn ? (
                <Button
                  type="button"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold"
                  data-ocid="chat.secondary_button"
                >
                  {isLoggingIn ? "Signing in..." : "Sign in to Chat"}
                </Button>
              ) : (
                <>
                  <Input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-violet-900/30 border-violet-600/40 text-white placeholder:text-violet-500 text-sm font-bold focus-visible:ring-violet-500"
                    data-ocid="chat.input"
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-3 font-bold"
                    data-ocid="chat.submit_button"
                  >
                    ➤
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 text-white text-2xl shadow-lg border-2 border-violet-400/40 flex items-center justify-center"
        style={{ boxShadow: "0 4px 24px rgba(139,92,246,0.5)" }}
        data-ocid="chat.open_modal_button"
        aria-label="Open support chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xl font-bold"
            >
              ✕
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              💬
            </motion.span>
          )}
        </AnimatePresence>
        {showBadge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background text-[9px] font-bold text-black flex items-center justify-center">
            !
          </span>
        )}
      </motion.button>
    </div>
  );
}
