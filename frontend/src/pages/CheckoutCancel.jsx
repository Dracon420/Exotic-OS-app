import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CheckoutCancel() {
    return (
        <div data-testid="checkout-cancel-page" className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full glass p-10 text-center">
                <h1 className="font-display font-black tracking-tighter text-3xl mb-3">No charge.</h1>
                <p className="text-[#8A9A9D] mb-7">Checkout was cancelled. Your spot is still open whenever you're ready.</p>
                <Link to="/#pricing" className="inline-flex items-center gap-2 px-5 py-3 border border-white/15 hover:border-[#00FF66] hover:text-[#00FF66] font-mono text-xs uppercase tracking-widest transition">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to pricing
                </Link>
            </div>
        </div>
    );
}
