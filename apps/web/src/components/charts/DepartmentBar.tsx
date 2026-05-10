import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Row {
  department: string;
  amount: number;
}

interface Props {
  data: Row[];
  height?: number;
}

export function DepartmentBar({ data, height = 240 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#EDEBE9" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#605E5C" }}
            stroke="#C8C6C4"
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
          />
          <YAxis
            type="category"
            dataKey="department"
            width={80}
            tick={{ fontSize: 11, fill: "#605E5C" }}
            stroke="#C8C6C4"
          />
          <Tooltip contentStyle={{ borderRadius: 4, borderColor: "#E1DFDD", fontSize: 12 }} />
          <Bar dataKey="amount" fill="#0078D4" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
