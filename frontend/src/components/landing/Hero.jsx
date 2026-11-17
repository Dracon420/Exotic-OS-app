import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Thermometer, Droplets, Sun, Activity } from "lucide-react";
import { api } from "@/lib/api";

export default function Hero() {
    const [stats, setStats] = useState({ waitlist: 0, uptime_hours: 0, alerts_handled: 0 });

    useEffect(() => {
        api.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
    }, []);

    return (
        <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32 grain">
            <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-[0.35]"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1633428620790-99dc3ca163e4?w=1800')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    maskImage: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,1) 100%)",
                    WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,1) 100%)",
                }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#05080A]/70 to-[#05080A]" />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-8">
                <div className="lg:col-span-7 fade-up">
                    <div className="inline-flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.3em] text-[#FFB020]/90">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFB020]" style={{ boxShadow: "0 0 6px #FFB020" }} />
                        Albedo · V1 Ball Python Edition · Q3 2028 · Pre-release
                    </div>

                    <h1 data-testid="hero-headline" className="font-display font-black tracking-tighter text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.95]">
                        Reptile keeping,<br />
                        <span className="text-white">made </span>
                        <span className="relative inline-block">
                            <span className="text-[#00FF66]">simple</span>
                            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#00FF66] opacity-60" />
                        </span>
                        <span className="text-white"> again.</span>
                    </h1>

                    <p className="mt-8 text-lg text-[#8A9A9D] max-w-xl leading-relaxed">
                        Exotic OS is an AI-supervised ecosystem controller for ball pythons, crested geckos, corn snakes and beyond. Plug it in. Pair the sensors. Let it watch the heat, the humidity, the photoperiod — so you can just enjoy your animals.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <a href="#waitlist" data-testid="hero-cta-primary" className="group inline-flex items-center gap-2 px-7 py-4 bg-[#00FF66] text-[#021004] font-mono text-sm uppercase tracking-widest hover:bg-[#33FF85] transition shadow-[0_0_32px_rgba(0,255,102,0.4)]">
                            Reserve beta spot
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        <Link to="/signup" data-testid="hero-cta-secondary" className="inline-flex items-center gap-2 px-7 py-4 border border-white/15 hover:border-[#00E5FF] hover:text-[#00E5FF] font-mono text-sm uppercase tracking-widest transition">
                            See live demo
                        </Link>
                    </div>

                    <div className="mt-12 grid grid-cols-3 max-w-md gap-6">
                        <div data-testid="hero-stat-waitlist">
                            <div className="font-display text-3xl font-black text-white">{stats.waitlist.toLocaleString()}</div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mt-1">on the list</div>
                        </div>
                        <div>
                            <div className="font-display text-3xl font-black text-[#00FF66]">{(stats.uptime_hours ?? 0).toLocaleString()}h</div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mt-1">hub uptime</div>
                        </div>
                        <div>
                            <div className="font-display text-3xl font-black text-[#00E5FF]">{(stats.alerts_handled ?? 0).toLocaleString()}</div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mt-1">alerts handled</div>
                        </div>
                    </div>
                </div>

                {/* Right side: floating control HUD */}
                <div className="lg:col-span-5 fade-up" style={{ animationDelay: "0.18s" }}>
                    <div className="relative">
                        <div className="absolute -inset-6 bg-[#00FF66]/10 blur-3xl rounded-full" />
                        <div className="relative glass p-6 lg:p-7 neon-border scan-line overflow-hidden">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-[#00FF66] glow-pulse" />
                                    <div>
                                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">Enclosure · Live</div>
                                        <div className="font-display font-bold tracking-tight">CORA · Ball Python</div>
                                    </div>
                                </div>
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#00FF66]">NOMINAL</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <Metric icon={<Thermometer className="w-3.5 h-3.5" />} label="Hot side" value="90.0°F" target="88–92" />
                                <Metric icon={<Thermometer className="w-3.5 h-3.5" />} label="Cool side" value="78.4°F" target="76–80" accent />
                                <Metric icon={<Droplets className="w-3.5 h-3.5" />} label="Humidity" value="54%" target="50–60" />
                                <Metric icon={<Sun className="w-3.5 h-3.5" />} label="UVI" value="1.2" target="1.0–1.5" />
                            </div>

                            {/* sparkline */}
                            <div className="relative h-16 mb-4">
                                <svg viewBox="0 0 300 64" className="w-full h-full">
                                    <defs>
                                        <linearGradient id="sl" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,40 C30,30 50,38 80,32 C110,26 140,42 180,28 C220,14 240,30 280,22 L300,22 L300,64 L0,64 Z" fill="url(#sl)" />
                                    <path d="M0,40 C30,30 50,38 80,32 C110,26 140,42 180,28 C220,14 240,30 280,22 L300,22" fill="none" stroke="#00FF66" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 6px rgba(0,255,102,0.6))" }} />
                                </svg>
                                <div className="absolute top-1 right-1 font-mono text-[10px] text-[#8A9A9D]">24H · PID 100W CHE</div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 border border-[#00E5FF]/30 bg-[#00E5FF]/5">
                                <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
                                <div className="font-mono text-[11px] text-[#00E5FF]">Albedo · Setpoint 90°F · Duty cycle 22.7% · PID cycle 5 min</div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">
                            <span>Live data · Govee BT Hygrometer · Home Assistant PID</span>
                            <img src="/albedo_logo.png" alt="Albedo" className="h-5 opacity-60" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Metric({ icon, label, value, target, accent }) {
    return (
        <div className="bg-black/30 border border-white/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">{icon} {label}</div>
            <div className={`font-display font-bold text-2xl mt-1 ${accent ? "text-[#00E5FF]" : "text-white"}`}>{value}</div>
            <div className="font-mono text-[10px] text-[#8A9A9D] mt-0.5">{target}</div>
        </div>
    );
}
