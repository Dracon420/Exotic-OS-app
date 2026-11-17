import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";

const TIERS = [
    {
        id: "beta",
        name: "Beta Cohort",
        price: "$549",
        sub: "at cost · 5–10 keepers · Q3 2028",
        tag: "Limited",
        accent: "#00FF66",
        features: [
            "Ball Python edition V1 kit",
            "Pi 4 hub + 5″ DSI touchscreen",
            "ESP32-S3 node + wired sensors",
            "Triple-redundant safety",
            "12-month founder support",
            "Direct line to Daniel",
        ],
        cta: "Reserve beta spot",
    },
    {
        id: "ball-python",
        name: "Ball Python Edition",
        price: "$649",
        sub: "retail · target Q3 2028",
        tag: "Most Popular",
        accent: "#00E5FF",
        features: [
            "Everything in Beta Cohort",
            "Final V1 firmware",
            "Branded packaging",
            "12-month warranty",
            "Free V1.5 firmware updates",
            "WIPA-cleared documentation",
        ],
        cta: "Join the launch waitlist",
        highlight: true,
    },
    {
        id: "multi-species",
        name: "Multi-species + AI",
        price: "$899",
        sub: "V1.5 · planned 2029+",
        tag: "Future",
        accent: "#B026FF",
        features: [
            "Everything in Ball Python Edition",
            "Crested gecko + corn snake profiles",
            "BLE wireless sensors",
            "AI husbandry advisor (RAG)",
            "Ambient-aware heat management",
            "Trend analysis & diagnostics",
        ],
        cta: "Notify me at V1.5",
    },
];

export default function Pricing() {
    const { user } = useAuth();
    const [busy, setBusy] = useState(null);
    const [err, setErr] = useState("");

    const startCheckout = async (tierId) => {
        if (!user) {
            window.location.hash = "#waitlist";
            return;
        }
        setBusy(tierId);
        setErr("");
        try {
            const origin_url = window.location.origin;
            const { data } = await api.post("/payments/checkout", { tier_id: tierId, origin_url });
            window.location.href = data.url;
        } catch (e) {
            setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
            setBusy(null);
        }
    };

    return (
        <section id="pricing" className="relative py-24 lg:py-32">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="max-w-2xl mb-16">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-4">// pricing</div>
                    <h2 className="font-display font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
                        Honest pricing.<br />
                        <span className="text-[#00FF66]">No subscriptions.</span>
                    </h2>
                    <p className="text-[#8A9A9D] mt-4">
                        Hardware is hardware. You pay once.{" "}
                        {user
                            ? "Test mode is on — use Stripe test card 4242 4242 4242 4242."
                            : "Sign in to reserve with a refundable deposit, or join the waitlist below."}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#FFB020] border border-[#FFB020]/30 px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" />
                        All tiers pending WIPA clearance before any deposits collected
                    </div>
                </div>

                {err && <div className="mb-6 font-mono text-xs text-red-400">{err}</div>}

                <div className="grid lg:grid-cols-3 gap-6 lg:gap-7">
                    {TIERS.map((t) => (
                        <div
                            key={t.id}
                            data-testid={`pricing-tier-${t.id}`}
                            className={`relative p-8 ${t.highlight ? "neon-border bg-[#00FF66]/[0.03]" : "glass"} transition-all hover:translate-y-[-3px]`}
                        >
                            {t.tag && (
                                <div
                                    className="absolute -top-3 left-8 px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
                                    style={{ background: t.accent, color: "#021004" }}
                                >
                                    {t.tag}
                                </div>
                            )}
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">{t.sub}</div>
                            <h3 className="font-display font-bold tracking-tight text-2xl mt-1">{t.name}</h3>
                            <div className="mt-5 mb-7 flex items-baseline gap-2">
                                <span className="font-display font-black tracking-tighter text-5xl" style={{ color: t.accent }}>{t.price}</span>
                                <span className="font-mono text-xs text-[#8A9A9D]">one-time</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {t.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-[#E5E7EA]">
                                        <Check className="w-4 h-4 mt-0.5 flex-none" style={{ color: t.accent }} />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => startCheckout(t.id)}
                                disabled={busy === t.id}
                                data-testid={`pricing-cta-${t.id}`}
                                className={`group inline-flex items-center justify-center w-full px-5 py-3.5 font-mono text-xs uppercase tracking-widest transition disabled:opacity-50 ${
                                    t.highlight
                                        ? "bg-[#00FF66] text-[#021004] hover:bg-[#33FF85] shadow-[0_0_24px_rgba(0,255,102,0.35)]"
                                        : "border border-white/10 hover:border-white/40"
                                }`}
                            >
                                {busy === t.id ? "Opening Stripe…" : user ? `Reserve · ${t.price}` : t.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex items-center gap-3 font-mono text-xs text-[#8A9A9D]">
                    <Lock className="w-3.5 h-3.5" />
                    Powered by Home Assistant + ESPHome. Local-first. No cloud account required.{" "}
                    {user && "Test mode: card 4242 4242 4242 4242 · any future expiry · any CVC."}
                </div>
            </div>
        </section>
    );
}
