import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";

const REPTILES = [
    "Ball Python",
    "Crested Gecko",
    "Corn Snake",
    "Leopard Gecko",
    "Bearded Dragon",
    "Tarantula",
    "Other / Not sure yet",
];

export default function CTA() {
    const [form, setForm] = useState({ name: "", email: "", reptile_type: "" });
    const [status, setStatus] = useState({ state: "idle", message: "" });

    const submit = async (e) => {
        e.preventDefault();
        setStatus({ state: "loading", message: "" });
        try {
            const { data } = await api.post("/waitlist", form);
            setStatus({ state: "ok", message: `You're #${data.position}. Welcome to the cohort.` });
            setForm({ name: "", email: "", reptile_type: "" });
        } catch (err) {
            setStatus({ state: "err", message: formatApiErrorDetail(err.response?.data?.detail) || err.message });
        }
    };

    return (
        <section id="waitlist" className="relative py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#00FF66]/[0.05] via-transparent to-[#B026FF]/[0.05]" />
            <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-12 lg:items-center">
                    <div className="lg:col-span-6">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FF66] mb-4">// reserve beta</div>
                        <h2 className="font-display font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
                            Be among<br />
                            the first ten<br />
                            <span className="text-[#00FF66]">keepers.</span>
                        </h2>
                        <p className="text-[#8A9A9D] text-lg mt-6 leading-relaxed">
                            Ten kits leave the workshop in Q3 2028. No deposits, no obligation. We'll write you when WIPA consultation closes and the cohort opens.
                        </p>
                        <ul className="mt-7 space-y-3">
                            <BulletItem text="At-cost pricing for beta keepers" />
                            <BulletItem text="Direct line to the founder during onboarding" />
                            <BulletItem text="Priority for free V1.5 upgrade SKU" />
                        </ul>
                    </div>

                    <form onSubmit={submit} className="lg:col-span-6 glass p-8 lg:p-10 neon-border">
                        <div className="space-y-5">
                            <Field label="Your name" htmlFor="wl-name">
                                <input
                                    id="wl-name"
                                    data-testid="waitlist-name"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Daniel R."
                                    className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition placeholder:text-[#3D4A4D]"
                                />
                            </Field>
                            <Field label="Email" htmlFor="wl-email">
                                <input
                                    id="wl-email"
                                    type="email"
                                    data-testid="waitlist-email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@enclosure.io"
                                    className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition placeholder:text-[#3D4A4D]"
                                />
                            </Field>
                            <Field label="What do you keep?" htmlFor="wl-rep">
                                <select
                                    id="wl-rep"
                                    data-testid="waitlist-reptile"
                                    value={form.reptile_type}
                                    onChange={(e) => setForm({ ...form, reptile_type: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                                >
                                    <option value="">— Select species —</option>
                                    {REPTILES.map((r) => (<option key={r} value={r}>{r}</option>))}
                                </select>
                            </Field>

                            <button
                                type="submit"
                                disabled={status.state === "loading"}
                                data-testid="waitlist-submit"
                                className="group inline-flex w-full items-center justify-center gap-2 px-5 py-4 bg-[#00FF66] text-[#021004] font-mono text-sm uppercase tracking-widest hover:bg-[#33FF85] transition shadow-[0_0_32px_rgba(0,255,102,0.35)] disabled:opacity-60"
                            >
                                {status.state === "loading" ? "Sending…" : "Reserve my spot"}
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>

                            {status.state === "ok" && (
                                <div data-testid="waitlist-success" className="text-sm font-mono text-[#00FF66]">
                                    ✓ {status.message}
                                </div>
                            )}
                            {status.state === "err" && (
                                <div data-testid="waitlist-error" className="text-sm font-mono text-red-400">
                                    {status.message}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

function Field({ label, htmlFor, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">{label}</label>
            {children}
        </div>
    );
}

function BulletItem({ text }) {
    return (
        <li className="flex items-start gap-3 text-[#E5E7EA]">
            <Check className="w-4 h-4 mt-1 text-[#00FF66] flex-none" />
            <span>{text}</span>
        </li>
    );
}
