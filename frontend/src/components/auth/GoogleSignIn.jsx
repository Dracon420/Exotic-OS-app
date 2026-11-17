// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function GoogleSignIn({ label = "Continue with Google" }) {
    const onClick = () => {
        const redirectUrl = window.location.origin + "/dashboard";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };
    return (
        <button
            type="button"
            data-testid="google-signin-btn"
            onClick={onClick}
            className="group w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-white/15 hover:border-white/40 hover:bg-white/[0.03] font-mono text-xs uppercase tracking-widest transition"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="#EA4335" d="M12 11v3.6h5.1c-.2 1.3-1.5 3.8-5.1 3.8-3 0-5.5-2.5-5.5-5.6S8.9 6.4 12 6.4c1.7 0 2.9.7 3.6 1.4l2.4-2.4C16.4 4 14.4 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c6.9 0 9.2-4.8 9.2-7.3 0-.5 0-.9-.1-1.3H12z" />
            </svg>
            <span>{label}</span>
        </button>
    );
}
