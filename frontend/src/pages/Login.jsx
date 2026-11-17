import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleSignIn from "@/components/auth/GoogleSignIn";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        const res = await login(form.email, form.password);
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
                <h1 data-testid="login-title" className="font-display font-black tracking-tighter text-4xl mb-2">Welcome back, keeper.</h1>
                <p className="text-[#8A9A9D] mb-8">Login to open your control room.</p>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] block mb-2">Email</label>
                        <input
                            data-testid="login-email"
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
                            data-testid="login-password"
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-[#00FF66] focus:outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>
                    {err && <div data-testid="login-error" className="text-sm font-mono text-red-400">{err}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="login-submit"
                        className="group inline-flex w-full items-center justify-center gap-2 px-5 py-4 bg-[#00FF66] text-[#021004] font-mono text-sm uppercase tracking-widest hover:bg-[#33FF85] transition shadow-[0_0_32px_rgba(0,255,102,0.3)] disabled:opacity-60"
                    >
                        {loading ? "Authorising…" : "Sign in"}
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <span className="flex-1 h-px bg-white/10" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D]">or</span>
                    <span className="flex-1 h-px bg-white/10" />
                </div>
                <GoogleSignIn />

                <p className="text-sm text-[#8A9A9D] mt-7">
                    New here? <Link to="/signup" data-testid="login-signup-link" className="text-[#00FF66] hover:underline">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
