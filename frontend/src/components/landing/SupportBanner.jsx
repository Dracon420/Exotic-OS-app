import { Heart, Zap, Github } from "lucide-react";

const KOFI_URL = "https://ko-fi.com/chaotic3dllcgmailcom";

const TIERS = [
    { label: "Buy us a coffee", amount: "$3", emoji: "☕" },
    { label: "Support a feature", amount: "$10", emoji: "⚡" },
    { label: "Sponsor a sprint", amount: "$25", emoji: "🚀" },
];

export default function SupportBanner() {
    return (
        <section className="relative py-16 overflow-hidden">
            {/* subtle background glow */}
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#FFB020]/5 via-transparent to-[#00FF66]/5" />
            <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-[#FFB020]/8 blur-[80px] rounded-full -z-10" />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                {/* header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-[#FFB020]/90">
                        <Heart className="w-3 h-3 fill-[#FFB020] text-[#FFB020]" />
                        Open Project · Community Funded
                    </div>
                    <h2 className="font-display font-black tracking-tighter text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">
                        Help us ship the hardware
                    </h2>
                    <p className="mt-3 text-[#8A9A9D] max-w-lg leading-relaxed">
                        Exotic OS is built by a small team of reptile keepers who wanted something better.
                        Every tip goes directly toward PCB runs, sensor testing, and keeping the servers alive.
                    </p>
                </div>

                {/* tier cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
                    {TIERS.map(({ label, amount, emoji }) => (
                        <a
                            key={label}
                            href={KOFI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center gap-2 p-5 border border-white/8 bg-white/[0.03] hover:border-[#FFB020]/50 hover:bg-[#FFB020]/5 transition-all duration-200"
                        >
                            <span className="text-2xl">{emoji}</span>
                            <span className="font-display font-black text-2xl text-white group-hover:text-[#FFB020] transition-colors">{amount}</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] text-center">{label}</span>
                        </a>
                    ))}
                </div>

                {/* main CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href={KOFI_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-[#FFB020] text-[#0A0800] font-mono text-sm uppercase tracking-widest hover:bg-[#FFC84A] transition shadow-[0_0_28px_rgba(255,176,32,0.35)] hover:shadow-[0_0_40px_rgba(255,176,32,0.5)]"
                    >
                        <Heart className="w-4 h-4 fill-[#0A0800] text-[#0A0800] group-hover:scale-110 transition-transform" />
                        Support on Ko-fi
                    </a>
                    <span className="font-mono text-[11px] text-[#8A9A9D] uppercase tracking-widest">
                        Powered by Stripe · Secure · No account needed
                    </span>
                </div>

                {/* progress bar (decorative — shows "momentum") */}
                <div className="mt-10 max-w-md mx-auto">
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mb-2">
                        <span>Beta hardware fund</span>
                        <span className="text-[#FFB020]">Goal: $500</span>
                    </div>
                    <div className="h-1 w-full bg-white/8 overflow-hidden">
                        <div
                            className="h-full bg-[#FFB020] transition-all duration-700"
                            style={{ width: "12%", boxShadow: "0 0 8px rgba(255,176,32,0.6)" }}
                        />
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] text-[#8A9A9D]">
                        Every contribution moves the needle — thank you.
                    </div>
                </div>
            </div>
        </section>
    );
}
