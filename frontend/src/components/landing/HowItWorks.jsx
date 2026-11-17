import { Plug, Scan, Brain, Shield } from "lucide-react";

const STEPS = [
    {
        n: "01",
        icon: <Plug className="w-5 h-5" />,
        title: "Plug the hub in.",
        body: "Pi 4 powered hub + 5″ touchscreen. One power cable, one wizard, twenty minutes from box to keeping.",
        accent: "#00FF66",
    },
    {
        n: "02",
        icon: <Scan className="w-5 h-5" />,
        title: "Pair the node with a QR.",
        body: "Pre-flashed ESP32-S3 node with wired SHT4x temperature, humidity & AS7331 UVB sensors. PID climate control runs locally on the node — works even when the hub is offline.",
        accent: "#00E5FF",
    },
    {
        n: "03",
        icon: <Brain className="w-5 h-5" />,
        title: "Albedo watches everything.",
        body: "Decision-tree alerts in V1, AI husbandry advisor in V1.5. Trip detection, sensor failure, humidity drift, temp anomalies, soil rehydration reminders — handled.",
        accent: "#B026FF",
    },
    {
        n: "04",
        icon: <Shield className="w-5 h-5" />,
        title: "Sleep through hot days.",
        body: "Triple-redundant safety: software dead-man + hardware over-temp comparator + thermal fuse on mains. Every relay defaults to OFF on power restore. Non-negotiable.",
        accent: "#00FF66",
    },
];

export default function HowItWorks() {
    return (
        <section id="how" className="relative py-24 lg:py-32">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-12 mb-16">
                    <div className="lg:col-span-5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-4">// how it works</div>
                        <h2 className="font-display font-black tracking-tighter text-4xl lg:text-6xl leading-[0.95]">
                            Built by a keeper.<br />
                            For keepers who<br />
                            <span className="text-[#00FF66]">already lost sleep.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-6 lg:col-start-7">
                        <p className="text-[#8A9A9D] text-lg leading-relaxed">
                            Every requirement of Exotic OS came from a real event — a hot day that tripped a consumer sensor on Sonic's enclosure; a CHE that couldn't reach 90°F because of inverse-square dispersion; substrate that dried out for two weeks before anyone noticed.
                        </p>
                        <p className="text-[#8A9A9D] text-lg leading-relaxed mt-4">
                            We didn't invent the problems. We just refused to ship the workarounds.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {STEPS.map((s, i) => (
                        <div
                            key={s.n}
                            data-testid={`how-step-${s.n}`}
                            className="group relative overflow-hidden glass p-8 lg:p-10 hover:border-[#00FF66]/40 transition-all duration-300 hover:translate-y-[-2px]"
                            style={{ animationDelay: `${i * 0.08}s` }}
                        >
                            <div
                                className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-10 blur-2xl group-hover:opacity-30 transition-opacity"
                                style={{ background: s.accent }}
                            />
                            <div className="flex items-start gap-5 relative">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-12 h-12 flex items-center justify-center border border-white/10"
                                        style={{ color: s.accent }}
                                    >
                                        {s.icon}
                                    </div>
                                    <div className="font-mono text-[10px] mt-2 text-[#8A9A9D]">{s.n}</div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-display font-bold tracking-tight text-2xl mb-3">{s.title}</h3>
                                    <p className="text-[#8A9A9D] leading-relaxed">{s.body}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
