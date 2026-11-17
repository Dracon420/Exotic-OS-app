import { useState } from "react";
import { Copy, Check, Cpu } from "lucide-react";

export default function NodeTokenCard({ enclosure }) {
    const [copied, setCopied] = useState(false);
    const token = enclosure?.node_token || "";
    const apiUrl = (process.env.REACT_APP_BACKEND_URL || "") + "/api/ingest/readings";

    const sampleCurl = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "node_token": "${token}",
    "hot_temp": 87.3,
    "cool_temp": 78.1,
    "humidity": 58.2,
    "uvi": 1.2,
    "duty_cycle": 0.45
  }'`;

    const onCopy = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div data-testid="node-token-card" className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-[#00E5FF]" />
                <div className="font-display font-bold tracking-tight">ESPHome / MQTT Node</div>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[#00FF66]">READY</span>
            </div>
            <p className="text-xs text-[#8A9A9D] leading-relaxed mb-4">
                Drop this token into your ESP32-S3 firmware. The dashboard switches from synthetic to live data the moment your node posts.
            </p>
            <div className="flex items-stretch gap-2 mb-4">
                <input
                    data-testid="node-token-input"
                    readOnly
                    value={token}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-black/60 border border-white/10 px-3 py-2 font-mono text-xs text-[#00FF66] focus:border-[#00FF66] focus:outline-none"
                />
                <button
                    onClick={onCopy}
                    data-testid="node-token-copy"
                    className="px-3 py-2 border border-white/10 hover:border-[#00FF66] hover:text-[#00FF66] transition flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <details className="group">
                <summary className="font-mono text-[10px] uppercase tracking-widest text-[#8A9A9D] hover:text-white cursor-pointer">
                    › Show curl example
                </summary>
                <pre className="mt-3 p-3 bg-black/60 border border-white/5 overflow-x-auto font-mono text-[10px] leading-relaxed text-[#8A9A9D] whitespace-pre-wrap">
{sampleCurl}
                </pre>
            </details>
        </div>
    );
}
