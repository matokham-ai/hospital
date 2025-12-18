import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

interface RevenueChartProps {
  data?: { date: string; total: number }[];
}

export default function RevenueChart({ data = [] }: RevenueChartProps) {
  const labels = data.map((d) => d.date);
  const totals = data.map((d) => d.total);

  return (
    <div className="w-full h-[280px]">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Revenue (KES)",
              data: totals,
              borderColor: "#0ea5e9",
              backgroundColor: "rgba(14,165,233,0.15)",
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: {
              ticks: { color: "#64748b" },
              grid: { color: "rgba(203,213,225,0.2)" },
            },
          },
        }}
      />
    </div>
  );
}
