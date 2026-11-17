import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import EnclosureCard from "@/components/dashboard/EnclosureCard";
import AIAdvisor from "@/components/dashboard/AIAdvisor";
import AddEnclosureModal from "@/components/dashboard/AddEnclosureModal";
import { api } from "@/lib/api";
import { Bell, Activity, Wifi, ShieldCheck, Plus, Cpu, Calendar } from "lucide-react";

// Real hardware components in the V1 production stack
const HARDWARE_STACK = [
    { label: "Sensor A", value: "Govee BT Hygrometer", status: "live" },
    { label: "Sensor B", value: "Inkbird IBS-TH2", status: "live" },
    { label: "Relay", value: "Tuya Smart Plug", status: "live" },
    { label: "PID host", value: "Home Assistant", status: "live" },
    { label: "Field node", value: "ESP32-S3", status: "proto" },
    { label: "AI", value: "Claude Sonnet 4.5", status: "live" },
];

// V1 → V2 product launch timeline sourced from PRD + session notes
const LAUNCH_TIMELINE = [
    {
        phase: "V1",
        label: "Ball Python Edition",
        status: "dev",
        detail: "100W CHE + PID · Cora & Confused Spider · WIPA pre-req pending",
    },
    {
        phase: "V1.5",
        label: "Multi-species + AI",
        status: "dev",
        detail: "RAG advisor · 5 species presets · $899 tier",
    },
    {
        phase: "V2",
        label: "BLE + Vision",
        status: "backlog",
        detail: "Wireless nodes · shed detection · ambient-aware heat mgmt",
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [enclosures, setEnclosures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const lastStatuses = useRef({});

    useEffect(() => {
        let alive = true;
        const fetchData = () => {
            api.get("/enclosures")
                .then(({ data }) => {
                    if (!alive) return;
                    data.forEach((e) => {
                        const prev = lastStatuses.current[e.id];
                        if (prev && prev !== e.status && (e.status === "warn" || e.status === "danger")) {
                            toast(`${e.animal_name}: ${e.status === "danger" ? "DANGER" : "Watch"}`, {
                                description: `Hot ${e.latest.hot_temp.toFixed(1)}°F · Humidity ${e.latest.humidity.toFixed(0)}%`,
                            });
                        }
                        lastStatuses.current[e.id] = e.status;
                    });
                    setEnclosures(data);
                })
                .finally(() => alive && setLoading(false));
        };
        fetchData();
        const id = setInterval(fetchData, 12000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    const totalAlerts = enclosures.reduce((acc, e) => acc + (e.status !== "ok" ? 1 : 0), 0);
    const ok = enclosures.filter((e) => e.status === "ok").length;
    const liveNodes = enclosures.filter((e) => e.latest?.source === "node").length;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div data-testid="dashboard-page" className="min-h-screen relative">
            <Navbar />
            <div
                aria-hidden
                className="fixed inset-0 -z-10 opacity-[0.06]"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1711025372958-db48a4fe0ba1?w=2000')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <main className="pt-24 pb-16 max-w-[1400px] mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-2">// control room</div>
                        <h1 className="font-display font-black tracking-tighter text-4xl lg:text-5xl">
                            {greeting},{" "}
                            <span className="text-[#00FF66]">{(user?.name || "Keeper").split(" ")[0]}</span>.
                        </h1>
                        <p className="text-[#8A9A9D] mt-2">
                            {liveNodes > 0
                                ? `${liveNodes} live node${liveNodes > 1 ? "s" : ""} reporting.`
                                : "All enclosures on synthetic telemetry."}{" "}
                            PID cycle: 5 min · Auto-dim at 21:00.
                        </p>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <StatTile icon={<Activity className="w-3.5 h-3.5" />} value={enclosures.length} label="Enclosures" />
                        <StatTile icon={<ShieldCheck className="w-3.5 h-3.5" />} value={ok} label="Nominal" color="#00FF66" />
                        <StatTile icon={<Bell className="w-3.5 h-3.5" />} value={totalAlerts} label="Watching" color="#FFB020" />
                        <StatTile
                            icon={<Wifi className="w-3.5 h-3.5" />}
                            value={`${liveNodes}/${enclosures.length}`}
                            label="Live nodes"
                            color="#00E5FF"
                        />
                    </div>
                </div>

                {/* Hardware stack + launch timeline */}
                <div className="grid lg:grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/40 border border-white/5 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">Hardware stack</div>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {HARDWARE_STACK.map((h) => (
                                <div key={h.label} className="flex items-center gap-2">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{
                                            background: h.status === "live" ? "#00FF66" : "#FFB020",
                                            boxShadow: h.status === "live" ? "0 0 6px #00FF66" : "none",
                                        }}
                                    />
                                    <span className="font-mono text-[9px] text-[#8A9A9D] uppercase tracking-widest">{h.label}</span>
                                    <span className="font-mono text-[10px] text-white">{h.value}</span>
                                    {h.status === "proto" && (
                                        <span className="font-mono text-[9px] text-[#FFB020] border border-[#FFB020]/30 px-1">PROTO</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-3.5 h-3.5 text-[#B026FF]" />
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">Launch timeline</div>
                        </div>
                        <div className="flex items-start gap-5">
                            {LAUNCH_TIMELINE.map((t) => (
                                <div key={t.phase} className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="font-mono text-[10px] tracking-widest px-1.5 py-0.5"
                                            style={{
                                                color: t.status === "dev" ? "#00FF66" : "#8A9A9D",
                                                border: `1px solid ${t.status === "dev" ? "#00FF6640" : "#ffffff10"}`,
                                            }}
                                        >
                                            {t.phase}
                                        </span>
                                        <span
                                            className="font-mono text-[9px] uppercase tracking-widest"
                                            style={{ color: t.status === "dev" ? "#00FF66" : "#3D4A4D" }}
                                        >
                                            {t.status === "dev" ? "IN DEV" : "BACKLOG"}
                                        </span>
                                    </div>
                                    <div className="font-display text-xs font-bold tracking-tight">{t.label}</div>
                                    <div className="font-mono text-[9px] text-[#8A9A9D] mt-0.5 leading-snug">{t.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enclosure grid + AI advisor */}
                <div className="grid xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 grid sm:grid-cols-2 gap-5">
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} className="glass p-6 h-48 animate-pulse" />
                              ))
                            : enclosures.map((e) => <EnclosureCard key={e.id} encl={e} />)}
                        <button
                            data-testid="add-enclosure-btn"
                            onClick={() => setModalOpen(true)}
                            className="group glass p-6 hover:translate-y-[-2px] transition-all duration-300 border-dashed flex items-center justify-center min-h-[200px]"
                            style={{ borderColor: "rgba(0,255,102,0.25)" }}
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto rounded-full border border-[#00FF66]/40 flex items-center justify-center group-hover:bg-[#00FF66]/10 transition">
                                    <Plus className="w-5 h-5 text-[#00FF66]" />
                                </div>
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mt-3">Add enclosure</div>
                                <div className="font-display text-sm mt-1">5 species presets ready</div>
                            </div>
                        </button>
                    </div>
                    <div className="xl:sticky xl:top-24 self-start min-h-[500px]">
                        <AIAdvisor sessionId={`dashboard-${user?.id || "guest"}`} />
                    </div>
                </div>
            </main>

            <AddEnclosureModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={(e) => {
                    setEnclosures((prev) => [...prev, e]);
                    toast.success(`${e.animal_name} provisioned.`, {
                        description: "Pair your node with the token on its detail page.",
                    });
                }}
            />
        </div>
    );
}

function StatTile({ icon, value, label, color = "#FFFFFF" }) {
    return (
        <div className="bg-black/40 border border-white/5 px-3 py-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest" style={{ color: `${color}99` }}>
                {icon} {label}
            </div>
            <div className="font-display font-bold text-2xl mt-0.5" style={{ color }}>{value}</div>
        </div>
    );
}
