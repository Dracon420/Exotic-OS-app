/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthCallback() {
    const nav = useNavigate();
    const { applyToken } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || "";
        const m = hash.match(/session_id=([^&]+)/);
        if (!m) {
            nav("/login", { replace: true });
            return;
        }
        const sessionId = decodeURIComponent(m[1]);

        (async () => {
            try {
                const { data } = await api.post("/auth/google/session", { session_id: sessionId });
                applyToken(data.token, data.user);
                // Clean the URL fragment then redirect
                window.history.replaceState({}, "", window.location.pathname);
                nav("/dashboard", { replace: true });
            } catch (e) {
                console.error("Google auth failed", e);
                nav("/login?google_error=1", { replace: true });
            }
        })();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#05080A]">
            <div className="font-mono text-xs text-[#00FF66] tracking-widest">AUTHENTICATING WITH GOOGLE…</div>
        </div>
    );
}
