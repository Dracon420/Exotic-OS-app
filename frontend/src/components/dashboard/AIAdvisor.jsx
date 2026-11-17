import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";

const STARTERS = [
    "Why is Cora's hot side fluctuating around 90°F?",
    "When should I rehydrate Cora's substrate — it's been 38h?",
    "Is Sonic getting enough humidity after misting at 60–80%?",
    "How do I tune Cora's PID Kd if she's hunting temps?",
];

export default function AIAdvisor({ enclosureId, sessionId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [err, setErr] = useState("");
    const scrollerRef = useRef(null);

    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const send = async (text) => {
        const message = (text ?? input).trim();
        if (!message || sending) return;
        setMessages((m) => [...m, { role: "user", content: message }]);
        setInput("");
        setSending(true);
        setErr("");
        try {
            const { data } = await api.post("/chat", {
                message,
                session_id: sessionId,
                enclosure_id: enclosureId,
            });
            setMessages((m) => [...m, { role: "assistant", content: data.reply, citations: data.citations || [] }]);
        } catch (e) {
            setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
            setMessages((m) => [...m, { role: "assistant", content: "I'm unavailable right now. Try again in a moment." }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div data-testid="ai-advisor-panel" className="glass overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center bg-[#B026FF]/15 border border-[#B026FF]/40 overflow-hidden">
                        <img
                            src="/albedo_logo.png"
                            alt="Albedo"
                            className="w-6 h-6 object-contain"
                            style={{ filter: "drop-shadow(0 0 4px rgba(176,38,255,0.6))" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                        <Sparkles className="w-4 h-4 text-[#B026FF] absolute opacity-0" aria-hidden />
                    </div>
                    <div>
                        <div className="font-display font-bold tracking-tight">Albedo · AI Advisor</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">V1.5 · Claude Sonnet 4.5 · RAG · PID</div>
                    </div>
                </div>
                <div className="font-mono text-[10px] text-[#00FF66] tracking-widest">ONLINE</div>
            </div>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[280px] max-h-[440px]">
                {messages.length === 0 && (
                    <div>
                        <div className="text-[#8A9A9D] text-sm leading-relaxed mb-4">
                            Ask me anything about reptile husbandry. I retrieve from vetted care guides and ground every answer with citations. If an enclosure is open, I can see its live readings too.
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {STARTERS.map((s) => (
                                <button
                                    key={s}
                                    data-testid={`ai-starter-${s.slice(0, 12).replace(/\s/g, "-")}`}
                                    onClick={() => send(s)}
                                    className="text-left text-xs font-mono text-[#E5E7EA] border border-white/5 hover:border-[#00FF66]/40 hover:text-[#00FF66] px-3 py-2 transition"
                                >
                                    "{s}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                        <div
                            className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                                m.role === "user"
                                    ? "bg-[#00FF66]/10 border border-[#00FF66]/30 text-white"
                                    : "bg-black/40 border border-white/5 text-[#E5E7EA]"
                            }`}
                        >
                            {m.content}
                        </div>
                        {m.role === "assistant" && m.citations?.length > 0 && (
                            <div data-testid={`ai-citations-${i}`} className="mt-2 max-w-[90%] space-y-1.5">
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">// sources</div>
                                {m.citations.map((c, j) => (
                                    <div key={j} className="flex items-start gap-2 text-[11px] text-[#8A9A9D] leading-snug">
                                        <span className="font-mono text-[#00FF66]">[{j + 1}]</span>
                                        <div>
                                            <span className="text-[#E5E7EA]">{c.topic}</span>
                                            <span className="text-[#8A9A9D]"> · </span>
                                            <span className="text-[#8A9A9D]">{c.source}</span>
                                            {c.species !== "ANY" && (
                                                <span className="ml-1 font-mono text-[9px] text-[#B026FF]">[{c.species}]</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {sending && (
                    <div className="flex justify-start">
                        <div className="px-4 py-3 bg-black/40 border border-white/5 font-mono text-xs text-[#8A9A9D]">
                            Albedo is thinking…
                        </div>
                    </div>
                )}
                {err && <div className="font-mono text-xs text-red-400">{err}</div>}
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
                className="flex items-center gap-2 px-3 py-3 border-t border-white/5"
            >
                <input
                    data-testid="ai-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the advisor…"
                    className="flex-1 bg-transparent px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-[#3D4A4D]"
                />
                <button
                    type="submit"
                    data-testid="ai-send"
                    disabled={!input.trim() || sending}
                    className="px-4 py-2 bg-[#00FF66] text-[#021004] font-mono text-xs uppercase tracking-widest hover:bg-[#33FF85] transition disabled:opacity-50"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );
}
