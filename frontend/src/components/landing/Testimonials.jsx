const STATUS_ITEMS = [
    {
        label: "WIPA Consultation",
        value: "Pending",
        detail: "Hard prerequisite before any sales or shipping. No compromises.",
        color: "#FFB020",
    },
    {
        label: "Field Node · ESP32-S3",
        value: "Prototyping",
        detail: "Sensor stack, PID firmware, and QR pairing flow in active development.",
        color: "#FFB020",
    },
    {
        label: "Beta Keepers Enrolled",
        value: "0 / 10",
        detail: "Cohort opens after WIPA clears. Direct line to the founder guaranteed.",
        color: "#00E5FF",
    },
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="relative py-24 lg:py-32">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-12 mb-16 items-center">
                    <div className="lg:col-span-5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FFB020] mb-4">// pre-launch status</div>
                        <h2 className="font-display font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
                            Beta cohort.<br />
                            <span className="text-[#FFB020]">Pending release.</span>
                        </h2>
                        <p className="text-[#8A9A9D] mt-6 text-lg leading-relaxed">
                            We're still in prototyping. No testimonials, no inflated numbers — just the honest state of the build and exactly what has to happen before a single kit ships.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#FFB020] border border-[#FFB020]/30 px-3 py-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" style={{ boxShadow: "0 0 6px #FFB020" }} />
                            Target: Q3 2028
                        </div>
                    </div>

                    <div className="lg:col-span-5 lg:col-start-8 flex justify-center">
                        <div className="relative">
                            <div className="absolute -inset-8 bg-[#B026FF]/10 blur-3xl rounded-full" />
                            <img
                                src="/albedo_logo.png"
                                alt="Albedo AI"
                                className="relative w-48 lg:w-64 object-contain opacity-90"
                                style={{ filter: "drop-shadow(0 0 32px rgba(176,38,255,0.4))" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {STATUS_ITEMS.map((item) => (
                        <div
                            key={item.label}
                            className="glass p-7 lg:p-8 relative overflow-hidden"
                            style={{ borderColor: `${item.color}20` }}
                        >
                            <div
                                className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: `linear-gradient(90deg, transparent, ${item.color}60, transparent)` }}
                            />
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mb-3">{item.label}</div>
                            <div
                                className="font-display font-black tracking-tighter text-3xl mb-3"
                                style={{ color: item.color }}
                            >
                                {item.value}
                            </div>
                            <p className="text-[#8A9A9D] text-sm leading-relaxed">{item.detail}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 glass p-6 border-[#00FF66]/10">
                    <div className="flex items-start gap-4">
                        <span className="font-mono text-[#00FF66] text-lg leading-none mt-1">"</span>
                        <div>
                            <p className="text-[#E5E7EA] leading-relaxed text-[15px]">
                                We don't ship until every keeper in this cohort can pick up the phone and reach Daniel. The beta exists to make sure the hardware survives the real world — not to collect deposits.
                            </p>
                            <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">
                                Daniel S. · Founder · Albedo Systems
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
