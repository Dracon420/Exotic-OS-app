import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function CheckoutSuccess() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const [status, setStatus] = useState({ state: "polling", payment_status: null, tier: null, amount: null });
    const nav = useNavigate();
    const attemptsRef = useRef(0);

    useEffect(() => {
        if (!sessionId) {
            setStatus({ state: "error", message: "Missing session id." });
            return;
        }
        let alive = true;

        const poll = async () => {
            try {
                const { data } = await api.get(`/payments/status/${sessionId}`);
                if (!alive) return;
                if (data.payment_status === "paid") {
                    setStatus({ state: "paid", payment_status: "paid", tier: data.metadata?.tier_name || data.tier_id, amount: data.amount });
                    return;
                }
                if (data.status === "expired") {
                    setStatus({ state: "expired", message: "Checkout session expired." });
                    return;
                }
                attemptsRef.current += 1;
                if (attemptsRef.current >= 6) {
                    setStatus({ state: "pending", message: "Still processing. Check your email for receipt." });
                    return;
                }
                setTimeout(poll, 2000);
            } catch (e) {
                attemptsRef.current += 1;
                if (attemptsRef.current >= 6) {
                    setStatus({ state: "error", message: e.response?.data?.detail || e.message });
                    return;
                }
                setTimeout(poll, 2000);
            }
        };

        poll();
        return () => { alive = false; };
    }, [sessionId]);

    return (
        <div data-testid="checkout-success-page" className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg w-full glass neon-border p-10 text-center">
                {status.state === "polling" && (
                    <>
                        <div className="font-mono text-xs text-[#00FF66] tracking-widest mb-4">VERIFYING PAYMENT…</div>
                        <div className="font-display text-2xl">Just a moment.</div>
                    </>
                )}
                {status.state === "paid" && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-[#00FF66] mx-auto mb-5" />
                        <h1 data-testid="checkout-paid-title" className="font-display font-black tracking-tighter text-4xl mb-3">
                            Reservation locked.
                        </h1>
                        <p className="text-[#8A9A9D] mb-2">{status.tier}</p>
                        {status.amount && <p className="font-mono text-sm text-[#00FF66] mb-6">${status.amount.toFixed(2)} USD</p>}
                        <p className="text-[#8A9A9D] mb-8 text-sm">We'll email you when WIPA clears and your unit is assembled.</p>
                        <Link to="/dashboard" data-testid="checkout-success-cta" className="inline-flex items-center justify-center px-5 py-3 bg-[#00FF66] text-[#021004] font-mono text-xs uppercase tracking-widest hover:bg-[#33FF85] transition">
                            Open your dashboard
                        </Link>
                    </>
                )}
                {(status.state === "expired" || status.state === "error" || status.state === "pending") && (
                    <>
                        <AlertTriangle className="w-12 h-12 text-[#FFB020] mx-auto mb-5" />
                        <h1 className="font-display font-black tracking-tighter text-3xl mb-3">
                            {status.state === "pending" ? "Still processing…" : "Something went sideways."}
                        </h1>
                        <p className="text-[#8A9A9D] mb-8 text-sm">{status.message}</p>
                        <button onClick={() => nav("/")} className="inline-flex items-center justify-center px-5 py-3 border border-white/15 hover:border-white/40 font-mono text-xs uppercase tracking-widest transition">
                            Back to home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
