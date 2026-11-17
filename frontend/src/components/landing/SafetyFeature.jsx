import { Cpu, Flame, Zap } from "lucide-react";

export default function SafetyFeature() {
    return (
        <section id="safety" className="relative py-24 lg:py-32 overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-[0.08]"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1711025372958-db48a4fe0ba1?w=2000')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05080A] via-transparent to-[#05080A]" />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-4">// safety architecture</div>
                        <h2 className="font-display font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95] mb-6">
                            Three independent layers.<br />
                            <span className="text-[#00FF66]">Zero excuses.</span>
                        </h2>
                        <p className="text-[#8A9A9D] text-lg leading-relaxed mb-6">
                            A customer should never have to debug their thermostat at 2am. Every shipped kit has redundant safety on every node — software watchdog, hardware comparator, and a physical thermal fuse on the mains side.
                        </p>
                        <p className="text-[#8A9A9D] leading-relaxed mb-6">
                            Inkbird IPT-2CH backstops are smoke-test verified before any kit leaves. Every relay defaults to OFF on power restore. We don't ship "smart plugs that default to ON" with our product.
                        </p>
                        <div className="font-mono text-xs text-[#8A9A9D] border-l-2 border-[#00FF66] pl-4 py-2">
                            "Triple-redundant safety on every node, every kit. Customer can never accidentally disable safety features."
                            <div className="text-[#00FF66] mt-2 text-[10px]">— Exotic OS PRD, V1 Non-Functional Requirements</div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SafetyCard
                            n="L1"
                            icon={<Cpu className="w-5 h-5" />}
                            title="Software dead-man"
                            body="ESPHome PID with output cap, autotune, and local-first watchdog. Hub down? Node holds its own."
                            color="#00FF66"
                        />
                        <SafetyCard
                            n="L2"
                            icon={<Zap className="w-5 h-5" />}
                            title="Hardware comparator"
                            body="LM393 over-temp circuit. Software bug, frozen MCU, drifted firmware — comparator cuts the line."
                            color="#00E5FF"
                        />
                        <SafetyCard
                            n="L3"
                            icon={<Flame className="w-5 h-5" />}
                            title="Thermal fuse on mains"
                            body="Single-shot inline fuse. The animal goes home with you when everything else has failed."
                            color="#B026FF"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SafetyCard({ n, icon, title, body, color }) {
    return (
        <div
            className="relative p-6 bg-black/40 border border-white/10 hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: `0 0 0 1px ${color}10 inset` }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 flex items-center justify-center border" style={{ borderColor: `${color}50`, color }}>{icon}</div>
                <div className="font-mono text-[10px] tracking-widest" style={{ color }}>{n}</div>
            </div>
            <h3 className="font-display font-bold tracking-tight text-lg mb-2">{title}</h3>
            <p className="text-[#8A9A9D] text-sm leading-relaxed">{body}</p>
        </div>
    );
}
