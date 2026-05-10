import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  date: string;
  count: number;
  amount: number;
}

interface Props {
  data: Point[];
  height?: number;
  countLabel: string;
  amountLabel: string;
}

export function TrendChart({ data, height = 240, countLabel, amountLabel }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#EDEBE9" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#605E5C" }} stroke="#C8C6C4" />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#605E5C" }}
            stroke="#C8C6C4"
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#605E5C" }}
            stroke="#C8C6C4"
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
          />
          <Tooltip contentStyle={{ borderRadius: 4, borderColor: "#E1DFDD", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="count"
            name={countLabel}
            stroke="#0078D4"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="amount"
            name={amountLabel}
            stroke="#107C10"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
