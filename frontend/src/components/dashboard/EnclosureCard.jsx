import { Link } from "react-router-dom";
import { Thermometer, Droplets, Activity, Sun, Camera, ChevronRight, Wifi, WifiOff } from "lucide-react";

const STATUS_STYLES = {
    ok: { color: "#00FF66", label: "NOMINAL" },
    warn: { color: "#FFB020", label: "WATCH" },
    danger: { color: "#FF3366", label: "DANGER" },
};

function inRange(value, [min, max]) {
    return value >= min && value <= max;
}

export default function EnclosureCard({ encl }) {
    const s = STATUS_STYLES[encl.status] || STATUS_STYLES.ok;
    const isLive = encl.latest?.source === "node";

    return (
        <Link
            to={`/dashboard/enclosures/${encl.id}`}
            data-testid={`enclosure-card-${encl.slug}`}
            className="group relative block glass p-6 hover:translate-y-[-2px] transition-all duration-300 overflow-hidden"
            style={{ borderColor: `${encl.color}30` }}
        >
            <div
                className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10 blur-3xl group-hover:opacity-25 transition-opacity"
                style={{ background: encl.color }}
            />
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">{encl.species}</div>
                        <div className="font-display font-bold tracking-tight text-2xl mt-1" style={{ color: encl.color }}>
                            {encl.animal_name}
                        </div>
                        <div className="font-mono text-[10px] text-[#8A9A9D] mt-1">{encl.enclosure_type}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {encl.has_camera && <Camera className="w-3.5 h-3.5 text-[#8A9A9D]" />}
                        <div className="flex items-center gap-2 px-2.5 py-1 border" style={{ borderColor: `${s.color}50`, color: s.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                            <span className="font-mono text-[10px] tracking-widest">{s.label}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-mono text-[9px] tracking-widest ${isLive ? "text-[#00FF66]" : "text-[#3D4A4D]"}`}>
                            {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                            {isLive ? "LIVE NODE" : "SIMULATED"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <Metric
                        icon={<Thermometer />}
                        label="Hot side"
                        value={`${encl.latest.hot_temp.toFixed(1)}°F`}
                        target={`${encl.hot_target[0]}–${encl.hot_target[1]}`}
                        ok={inRange(encl.latest.hot_temp, encl.hot_target)}
                    />
                    <Metric
                        icon={<Thermometer />}
                        label="Cool side"
                        value={`${encl.latest.cool_temp.toFixed(1)}°F`}
                        target={`${encl.cool_target[0]}–${encl.cool_target[1]}`}
                        ok={inRange(encl.latest.cool_temp, encl.cool_target)}
                    />
                    <Metric
                        icon={<Droplets />}
                        label="Humidity"
                        value={`${encl.latest.humidity.toFixed(0)}%`}
                        target={`${encl.humidity_target[0]}–${encl.humidity_target[1]}`}
                        ok={inRange(encl.latest.humidity, encl.humidity_target)}
                    />
                    <Metric
                        icon={<Sun />}
                        label="UVI"
                        value={encl.latest.uvi.toFixed(2)}
                        target={`~${encl.uvi_target}`}
                        ok={encl.latest.uvi >= encl.uvi_target * 0.8}
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-[#8A9A9D]">
                        <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {(encl.latest.duty_cycle * 100).toFixed(0)}% duty
                        </span>
                        <span>·</span>
                        <span>{encl.che_wattage}W CHE</span>
                        <span>·</span>
                        <span>Σ {encl.current_setpoint}°F</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8A9A9D] group-hover:text-[#00FF66] group-hover:translate-x-0.5 transition" />
                </div>
            </div>
        </Link>
    );
}

function Metric({ icon, label, value, target, ok }) {
    return (
        <div
            className="bg-black/30 border p-3 transition-colors"
            style={{ borderColor: ok ? "rgba(255,255,255,0.05)" : "rgba(255,51,102,0.35)" }}
        >
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#8A9A9D]">
                <span className="[&>svg]:w-3 [&>svg]:h-3">{icon}</span> {label}
            </div>
            <div className={`font-display font-bold text-xl mt-1 ${ok ? "text-white" : "text-[#FF3366]"}`}>{value}</div>
            <div className="font-mono text-[9px] text-[#8A9A9D] mt-0.5">target {target}</div>
        </div>
    );
}
