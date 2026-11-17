import { useEffect, useState } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";

export default function AddEnclosureModal({ open, onClose, onCreated }) {
    const [presets, setPresets] = useState([]);
    const [form, setForm] = useState({ name: "", animal_name: "", species: "", enclosure_type: "" });
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        api.get("/presets/species")
            .then(({ data }) => setPresets(data))
            .catch(() => setPresets([]));
    }, [open]);

    useEffect(() => {
        if (!form.species) return;
        const p = presets.find((x) => x.species === form.species);
        if (p) setForm((f) => ({ ...f, enclosure_type: f.enclosure_type || p.enclosure_type }));
    }, [form.species, presets]);

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr("");
        try {
            const { data } = await api.post("/enclosures", form);
            onCreated?.(data);
            onClose?.();
            setForm({ name: "", animal_name: "", species: "", enclosure_type: "" });
        } catch (e2) {
            setErr(formatApiErrorDetail(e2.response?.data?.detail) || e2.message);
        } finally {
            setSaving(false);
        }
    };

    const activePreset = presets.find((p) => p.species === form.species);

    return (
        <div
            data-testid="add-enclosure-modal"
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl glass neon-border p-7 lg:p-9 relative max-h-[90vh] overflow-y-auto"
            >
                <button
                    data-testid="add-enclosure-close"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#8A9A9D] hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-2">// new enclosure</div>
                <h2 className="font-display font-black tracking-tighter text-3xl mb-6">
                    Add an enclosure to <span className="text-[#00FF66]">your room</span>.
                </h2>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Animal name">
                            <input
                                data-testid="add-encl-animal"
                                required
                                value={form.animal_name}
                                onChange={(e) => setForm({ ...form, animal_name: e.target.value, name: form.name || `${e.target.value}'s Enclosure` })}
                                placeholder="e.g. Mango"
                                className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            />
                        </Field>
                        <Field label="Enclosure label">
                            <input
                                data-testid="add-encl-name"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Mango's Enclosure"
                                className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            />
                        </Field>
                    </div>

                    <Field label="Species">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {presets.map((p) => (
                                <button
                                    key={p.species}
                                    type="button"
                                    data-testid={`species-${p.species.toLowerCase().replace(/\s+/g, "-")}`}
                                    onClick={() => setForm({ ...form, species: p.species, enclosure_type: p.enclosure_type })}
                                    className={`text-left px-3 py-3 border transition ${
                                        form.species === p.species
                                            ? "border-[#00FF66] bg-[#00FF66]/5"
                                            : "border-white/10 hover:border-white/30"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-display text-sm font-bold tracking-tight">{p.species}</div>
                                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                    </div>
                                    <div className="font-mono text-[10px] text-[#8A9A9D] mt-1">
                                        {p.hot_target[0]}-{p.hot_target[1]}°F · {p.humidity_target[0]}-{p.humidity_target[1]}% RH
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Enclosure type">
                        <input
                            data-testid="add-encl-type"
                            required
                            value={form.enclosure_type}
                            onChange={(e) => setForm({ ...form, enclosure_type: e.target.value })}
                            placeholder="40 gallon glass / grow tent / 20L tub"
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                        />
                    </Field>

                    {activePreset && (
                        <div className="border border-[#00FF66]/20 bg-[#00FF66]/[0.03] px-4 py-3 flex items-start gap-3">
                            <Sparkles className="w-4 h-4 mt-0.5 text-[#00FF66] flex-none" />
                            <div className="text-xs text-[#8A9A9D] leading-relaxed">
                                <b className="text-white">{activePreset.species} preset</b> applied — hot {activePreset.hot_target[0]}-{activePreset.hot_target[1]}°F, cool {activePreset.cool_target[0]}-{activePreset.cool_target[1]}°F, humidity {activePreset.humidity_target[0]}-{activePreset.humidity_target[1]}%, UVI ~{activePreset.uvi_target}, {activePreset.photoperiod_hours}h photoperiod. {activePreset.che_wattage}W CHE recommended.
                            </div>
                        </div>
                    )}

                    {err && <div className="text-sm font-mono text-red-400">{err}</div>}

                    <button
                        type="submit"
                        data-testid="add-encl-submit"
                        disabled={saving || !form.species || !form.animal_name}
                        className="group inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[#00FF66] text-[#021004] font-mono text-xs uppercase tracking-widest hover:bg-[#33FF85] transition disabled:opacity-50"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {saving ? "Creating…" : "Create enclosure"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">{label}</label>
            {children}
        </div>
    );
}
