export default function Footer() {
    return (
        <footer className="relative border-t border-white/5 py-12">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
                <div className="grid md:grid-cols-3 gap-8 items-end">
                    <div>
                        <div className="font-display font-black tracking-tighter text-2xl">EXOTIC<span className="text-[#00FF66]">.OS</span></div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] mt-2">Albedo · Built solo · Family business</div>
                    </div>
                    <div className="font-mono text-xs text-[#8A9A9D] leading-relaxed md:text-center">
                        North star: "this product saved my snake's life."
                    </div>
                    <div className="font-mono text-xs text-[#8A9A9D] md:text-right">
                        © {new Date().getFullYear()} Albedo Systems. Powered by Home Assistant + ESPHome.
                    </div>
                </div>
            </div>
        </footer>
    );
}
