import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const loc = useLocation();
    const onDashboard = loc.pathname.startsWith("/dashboard");

    return (
        <header
            data-testid="site-navbar"
            className="fixed top-0 inset-x-0 z-50 bg-[#05080A]/70 backdrop-blur-2xl border-b border-[#00FF66]/15"
        >
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
                <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group">
                    <span className="relative inline-block w-3 h-3 rounded-full bg-[#00FF66] glow-pulse" />
                    <span className="font-display font-black tracking-tighter text-lg">EXOTIC<span className="text-[#00FF66]">.OS</span></span>
                    <span className="hidden md:inline font-mono text-[10px] text-[#8A9A9D] tracking-[0.2em] uppercase">// powered by Albedo</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-[#8A9A9D]">
                    <a href="/#how" data-testid="nav-how" className="hover:text-white transition-colors">How it works</a>
                    <a href="/#safety" data-testid="nav-safety" className="hover:text-white transition-colors">Safety</a>
                    <a href="/#pricing" data-testid="nav-pricing" className="hover:text-white transition-colors">Pricing</a>
                    <a href="/#testimonials" data-testid="nav-testimonials" className="hover:text-white transition-colors">Beta status</a>
                </nav>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {!onDashboard && (
                                <Link to="/dashboard" data-testid="nav-dashboard-btn" className="hidden sm:inline-flex font-mono text-xs uppercase tracking-widest px-4 py-2 border border-white/10 hover:border-[#00FF66]/60 hover:text-[#00FF66] transition">Dashboard</Link>
                            )}
                            <button onClick={logout} data-testid="nav-logout-btn" className="font-mono text-xs uppercase tracking-widest px-4 py-2 text-[#8A9A9D] hover:text-white transition">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" data-testid="nav-login-btn" className="font-mono text-xs uppercase tracking-widest px-4 py-2 text-[#8A9A9D] hover:text-white transition">Login</Link>
                            <Link to="/signup" data-testid="nav-signup-btn" className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-[#00FF66] text-[#021004] hover:bg-[#33FF85] transition shadow-[0_0_24px_rgba(0,255,102,0.35)]">Open the OS</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
