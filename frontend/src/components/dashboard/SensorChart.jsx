import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceArea } from "recharts";

export default function SensorChart({ data, dataKeys, targetBand, height = 220, yDomain = ["auto", "auto"] }) {
    return (
        <div style={{ width: "100%", height, minHeight: 120 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
                <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <XAxis
                        dataKey="label"
                        stroke="#3D4A4D"
                        tick={{ fill: "#8A9A9D", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={48}
                    />
                    <YAxis
                        stroke="#3D4A4D"
                        domain={yDomain}
                        tick={{ fill: "#8A9A9D", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    {targetBand && (
                        <ReferenceArea
                            y1={targetBand[0]}
                            y2={targetBand[1]}
                            fill="#00FF66"
                            fillOpacity={0.05}
                            stroke="#00FF66"
                            strokeOpacity={0.12}
                        />
                    )}
                    <Tooltip
                        contentStyle={{
                            background: "rgba(5, 8, 10, 0.95)",
                            border: "1px solid rgba(0,255,102,0.25)",
                            fontFamily: "JetBrains Mono",
                            fontSize: 11,
                            color: "#fff",
                        }}
                        labelStyle={{ color: "#8A9A9D" }}
                    />
                    {dataKeys.map((k) => (
                        <Line
                            key={k.key}
                            type="monotone"
                            dataKey={k.key}
                            stroke={k.color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            name={k.label}
                            style={{ filter: `drop-shadow(0 0 6px ${k.color}80)` }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
