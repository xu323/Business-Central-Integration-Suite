import { Line, LineChart, ResponsiveContainer } from "recharts";

interface Props {
  data: { x: number | string; y: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "#0078D4", height = 32 }: Props) {
  if (data.length < 2) {
    return <div style={{ height }} aria-hidden />;
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
