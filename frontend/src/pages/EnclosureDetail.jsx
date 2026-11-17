import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus, Thermometer, Droplets, Sun, Flame, AlertTriangle, BellRing, Sparkles, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import SensorChart from "@/components/dashboard/SensorChart";
import AIAdvisor from "@/components/dashboard/AIAdvisor";
import NodeTokenCard from "@/components/dashboard/NodeTokenCard";
import { api } from "@/lib/api";

export default function EnclosureDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [encl, setEncl] = useState(null);
    const [readings, setReadings] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [tab, setTab] = useState("temp");

    const fetchAll = useCallback(async () => {
        const [{ data: e }, { data: r }, { data: a }] = await Promise.all([
            api.get(`/enclosures/${id}`),
            api.get(`/enclosures/${id}/readings?hours=24`),
            api.get(`/enclosures/${id}/alerts`),
        ]);
        setEncl(e);
        setReadings(r.points);
        setAlerts(a);
    }, [id]);

    useEffect(() => {
        fetchAll();
        const t = setInterval(fetchAll, 15000);
        return () => clearInterval(t);
    }, [fetchAll]);

    const onDelete = async () => {
        if (!window.confirm(`Delete ${encl.animal_name}'s enclosure? This cannot be undone.`)) return;
        await api.delete(`/enclosures/${id}`);
        toast.success("Enclosure removed.");
        nav("/dashboard");
    };

    const chartData = useMemo(() => {
        return readings.map((p) => {
            const d = new Date(p.ts);
            const h = d.getHours().toString().padStart(2, "0");
            const m = d.getMinutes().toString().padStart(2, "0");
            return {
                label: `${h}:${m}`,
                hot: p.hot_temp,
                cool: p.cool_temp,
                humidity: p.humidity,
                uvi: p.uvi,
            };
        });
    }, [readings]);

    const adjustSetpoint = async (delta) => {
        if (!encl) return;
        const next = Math.max(60, Math.min(100, encl.current_setpoint + delta));
        const { data } = await api.post(`/enclosures/${id}/control`, { setpoint: next });
        setEncl(data);
    };

    if (!encl) {
        return (
            <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[#8A9A9D]">LOADING ENCLOSURE…</div>
        );
    }

    return (
        <div data-testid="enclosure-detail-page" className="min-h-screen relative">
            <Navbar />
            <main className="pt-24 pb-16 max-w-[1500px] mx-auto px-6 lg:px-10">
                <Link to="/dashboard" data-testid="back-to-dashboard" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#8A9A9D] hover:text-[#00FF66] transition mb-6">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back to control room
                </Link>

                <header className="grid lg:grid-cols-12 gap-6 mb-8">
                    <div className="lg:col-span-7">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full glow-pulse" style={{ background: encl.color }} />
                            <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: encl.color }}>{encl.species}</div>
                            {encl.latest?.source === "node" && (
                                <span className="font-mono text-[10px] uppercase tracking-widest text-[#00FF66] border border-[#00FF66]/40 px-2 py-0.5">LIVE NODE</span>
                            )}
                            {encl.latest?.source === "synthetic" && (
                                <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] border border-white/10 px-2 py-0.5">SIMULATED</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="font-display font-black tracking-tighter text-5xl lg:text-6xl leading-[0.95]">
                                <span style={{ color: encl.color }}>{encl.animal_name}</span>
                            </h1>
                            <button
                                data-testid="delete-enclosure-btn"
                                onClick={onDelete}
                                title="Delete enclosure"
                                className="px-3 py-2 text-[#8A9A9D] hover:text-red-400 hover:border-red-400/40 border border-white/10 transition font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                        <div className="font-mono text-xs text-[#8A9A9D] mt-3">{encl.enclosure_type} · {encl.che_wattage}W CHE · Node {encl.slug}</div>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                        <BigMetric icon={<Thermometer />} label="HOT" value={`${encl.latest.hot_temp}°F`} sub={`Target ${encl.hot_target[0]}-${encl.hot_target[1]}`} color="#FF6B00" />
                        <BigMetric icon={<Thermometer />} label="COOL" value={`${encl.latest.cool_temp}°F`} sub={`Target ${encl.cool_target[0]}-${encl.cool_target[1]}`} color="#00E5FF" />
                        <BigMetric icon={<Droplets />} label="HUMIDITY" value={`${encl.latest.humidity}%`} sub={`Target ${encl.humidity_target[0]}-${encl.humidity_target[1]}`} color="#00FF66" />
                        <BigMetric icon={<Sun />} label="UVI" value={encl.latest.uvi.toFixed(2)} sub={`Target ~${encl.uvi_target}`} color="#B026FF" />
                    </div>
                </header>

                <div className="grid xl:grid-cols-3 gap-6">
                    <section className="xl:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="glass overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                                    {[
                                        { k: "temp", l: "Temperature" },
                                        { k: "humidity", l: "Humidity" },
                                        { k: "uvi", l: "UV Index" },
                                    ].map((t) => (
                                        <button
                                            key={t.k}
                                            data-testid={`chart-tab-${t.k}`}
                                            onClick={() => setTab(t.k)}
                                            className={`px-3 py-2 transition ${tab === t.k ? "text-[#00FF66] border-b border-[#00FF66]" : "text-[#8A9A9D] hover:text-white"}`}
                                        >
                                            {t.l}
                                        </button>
                                    ))}
                                </div>
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">24H · 10-min sample</div>
                            </div>
                            <div className="p-4">
                                {tab === "temp" && (
                                    <SensorChart
                                        data={chartData}
                                        dataKeys={[
                                            { key: "hot", label: "Hot side", color: "#FF6B00" },
                                            { key: "cool", label: "Cool side", color: "#00E5FF" },
                                        ]}
                                        targetBand={encl.hot_target}
                                        yDomain={[Math.min(encl.cool_target[0] - 5, 65), Math.max(encl.hot_target[1] + 5, 100)]}
                                    />
                                )}
                                {tab === "humidity" && (
                                    <SensorChart
                                        data={chartData}
                                        dataKeys={[{ key: "humidity", label: "Humidity %", color: "#00FF66" }]}
                                        targetBand={encl.humidity_target}
                                        yDomain={[20, 100]}
                                    />
                                )}
                                {tab === "uvi" && (
                                    <SensorChart
                                        data={chartData}
                                        dataKeys={[{ key: "uvi", label: "UVI", color: "#B026FF" }]}
                                        yDomain={[0, Math.max(encl.uvi_target * 2, 2)]}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Heat control + Care */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="glass p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-[#FF6B00]" />
                                        <div className="font-display font-bold tracking-tight">PID Heat Control</div>
                                    </div>
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#00FF66]">ACTIVE</div>
                                </div>
                                <div className="text-center mb-6">
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">Setpoint</div>
                                    <div className="font-display font-black text-6xl tracking-tighter" style={{ color: encl.color }}>
                                        {encl.current_setpoint}°F
                                    </div>
                                    <div className="font-mono text-[10px] text-[#8A9A9D] mt-1">
                                        live {encl.latest.hot_temp.toFixed(1)}°F · Δ {(encl.latest.hot_temp - encl.current_setpoint).toFixed(1)}°F
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        data-testid="setpoint-decrease"
                                        onClick={() => adjustSetpoint(-1)}
                                        className="w-16 h-16 flex items-center justify-center border border-white/10 hover:border-[#00FF66] hover:text-[#00FF66] transition"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <button
                                        data-testid="setpoint-increase"
                                        onClick={() => adjustSetpoint(1)}
                                        className="w-16 h-16 flex items-center justify-center border border-white/10 hover:border-[#00FF66] hover:text-[#00FF66] transition"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 font-mono text-[11px]">
                                    <div>
                                        <div className="text-[#8A9A9D] uppercase text-[10px] tracking-widest">Duty cycle</div>
                                        <div className="text-white mt-1">{(encl.latest.duty_cycle * 100).toFixed(0)}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[#8A9A9D] uppercase text-[10px] tracking-widest">Photoperiod</div>
                                        <div className="text-white mt-1">{encl.photoperiod_hours}h light</div>
                                    </div>
                                    <div>
                                        <div className="text-[#8A9A9D] uppercase text-[10px] tracking-widest">PID cycle</div>
                                        <div className="text-white mt-1">{encl.pid_cycle_min ?? 5} min</div>
                                    </div>
                                    <div>
                                        <div className="text-[#8A9A9D] uppercase text-[10px] tracking-widest">Relay</div>
                                        <div className="text-white mt-1 truncate" title={encl.relay_hw}>
                                            {encl.relay_hw ? encl.relay_hw.split(" ")[0] : "Tuya plug"}
                                        </div>
                                    </div>
                                </div>
                                {encl.sensor_hw && (
                                    <div className="mt-3 font-mono text-[9px] text-[#3D4A4D]">
                                        Sensor: {encl.sensor_hw}
                                    </div>
                                )}
                            </div>

                            <div className="glass p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <Sparkles className="w-4 h-4 text-[#B026FF]" />
                                    <div className="font-display font-bold tracking-tight">Care log</div>
                                </div>
                                <div className="space-y-4">
                                    <CareRow
                                        label="Last fed"
                                        value={`${encl.last_fed_days_ago} days ago`}
                                        accent={encl.last_fed_days_ago < 7 ? "#00FF66" : "#FFB020"}
                                    />
                                    <CareRow label="Last shed" value={`${encl.last_shed_days_ago} days ago`} accent="#00E5FF" />
                                    <CareRow
                                        label="Soil rehydration"
                                        value={`${encl.last_soil_rehydration_hours_ago}h ago`}
                                        accent={encl.last_soil_rehydration_hours_ago > 36 ? "#FFB020" : "#00FF66"}
                                    />
                                    <div className="border-t border-white/5 pt-3 font-mono text-[10px] text-[#8A9A9D] leading-relaxed">
                                        V1.5: humidity-trend reminders + elapsed-time combine for per-species alerts.
                                        Quarterly UVB lamp replacement tracked. External delivery (Resend / Twilio) in P1 backlog.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Node token (ESPHome ingest) */}
                        <NodeTokenCard enclosure={encl} />

                        {/* Alerts */}
                        <div className="glass">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <BellRing className="w-4 h-4 text-[#FFB020]" />
                                    <div className="font-display font-bold tracking-tight">Active alerts & reminders</div>
                                </div>
                                <div className="font-mono text-[10px] text-[#8A9A9D] uppercase tracking-widest">{alerts.length} live</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {alerts.length === 0 ? (
                                    <div className="px-5 py-8 text-center font-mono text-xs text-[#8A9A9D]">No active alerts. The enclosure is within nominal parameters.</div>
                                ) : (
                                    alerts.map((a) => (
                                        <AlertRow key={a.id} alert={a} />
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <aside className="xl:sticky xl:top-24 self-start">
                        <AIAdvisor enclosureId={encl.id} sessionId={`encl-${encl.id}`} />
                    </aside>
                </div>
            </main>
        </div>
    );
}

function BigMetric({ icon, label, value, sub, color }) {
    return (
        <div className="bg-black/40 border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">{label}</div>
                <span className="[&>svg]:w-3.5 [&>svg]:h-3.5" style={{ color }}>{icon}</span>
            </div>
            <div className="font-display font-black text-3xl tracking-tighter" style={{ color }}>{value}</div>
            <div className="font-mono text-[10px] text-[#8A9A9D] mt-1">{sub}</div>
        </div>
    );
}

function CareRow({ label, value, accent }) {
    return (
        <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">{label}</div>
            <div className="font-display text-sm" style={{ color: accent }}>{value}</div>
        </div>
    );
}

const SEVERITY_STYLES = {
    danger: { color: "#FF3366", label: "DANGER" },
    warn: { color: "#FFB020", label: "WATCH" },
    info: { color: "#00E5FF", label: "INFO" },
};

function AlertRow({ alert }) {
    const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
    return (
        <div data-testid={`alert-${alert.id}`} className="px-5 py-4 grid lg:grid-cols-12 gap-3 items-start hover:bg-white/[0.02] transition">
            <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 border" style={{ borderColor: `${s.color}50`, color: s.color }}>
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-mono text-[10px] tracking-widest">{s.label}</span>
                </div>
            </div>
            <div className="lg:col-span-7">
                <div className="font-display font-bold tracking-tight">{alert.title}</div>
                <div className="text-sm text-[#8A9A9D] mt-1">{alert.message}</div>
            </div>
            <div className="lg:col-span-3 font-mono text-[11px] text-[#8A9A9D] space-y-1">
                {alert.suggested_actions?.slice(0, 2).map((a, i) => (
                    <div key={i} className="flex items-start gap-1">
                        <span className="text-[#00FF66]">›</span> {a}
                    </div>
                ))}
            </div>
        </div>
    );
}
