import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleSignIn from "@/components/auth/GoogleSignIn";

export default function Signup() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        const res = await register(form.email, form.password, form.name);
        setLoading(false);
        if (!res.ok) setErr(res.error);
        else nav("/dashboard");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#00FF66]/[0.04] via-transparent to-[#B026FF]/[0.06]" />
            <div className="w-full max-w-md">
                <Link to="/" className="inline-flex items-center gap-3 mb-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] glow-pulse" />
                    <span className="font-display font-black tracking-tighter text-xl">EXOTIC<span className="text-[#00FF66]">.OS</span></span>
                </Link>
                <h1 data-testid="signup-title" className="font-display font-black tracking-tighter text-4xl mb-2">Open the OS.</h1>
                <p className="text-[#8A9A9D] mb-8">Live demo enclosures will be seeded for you (Cora, Sonic, Motley, Confused Spider).</p>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">Keeper name</label>
                        <input
                            data-testid="signup-name"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            placeholder="Daniel R."
                        />
                    </div>
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">Email</label>
                        <input
                            data-testid="signup-email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            placeholder="you@enclosure.io"
                        />
                    </div>
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">Password</label>
                        <input
                            data-testid="signup-password"
                            type="password"
                            required
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            placeholder="At least 6 characters"
                        />
                    </div>
                    {err && <div data-testid="signup-error" className="text-sm font-mono text-red-400">{err}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="signup-submit"
                        className="group inline-flex w-full items-center justify-center gap-2 px-5 py-4 bg-[#00FF66] text-[#021004] font-mono text-sm uppercase tracking-widest hover:bg-[#33FF85] transition shadow-[0_0_32px_rgba(0,255,102,0.3)] disabled:opacity-60"
                    >
                        {loading ? "Provisioning…" : "Create account"}
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <span className="flex-1 h-px bg-white/10" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">or</span>
                    <span className="flex-1 h-px bg-white/10" />
                </div>
                <GoogleSignIn label="Sign up with Google" />

                <p className="text-sm text-[#8A9A9D] mt-7">
                    Already a keeper? <Link to="/login" data-testid="signup-login-link" className="text-[#00FF66] hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
