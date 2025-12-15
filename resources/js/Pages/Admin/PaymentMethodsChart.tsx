import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentMethodsChartProps {
  data?: { method: string; value: number }[];
}

export default function PaymentMethodsChart({ data = [] }: PaymentMethodsChartProps) {
  const labels = data.map((d) => d.method);
  const values = data.map((d) => d.value);
  const colors = [
    "rgba(14,165,233,0.9)", // Blue
    "rgba(20,184,166,0.9)", // Teal
    "rgba(249,115,22,0.9)", // Orange
    "rgba(99,102,241,0.9)", // Indigo
  ];

  return (
    <div className="flex justify-center items-center w-full h-[280px]">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderColor: "#ffffff",
              borderWidth: 2,
              hoverOffset: 10,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#475569",
                boxWidth: 12,
                padding: 14,
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              backgroundColor: "#0f172a",
              titleColor: "#e2e8f0",
              bodyColor: "#f8fafc",
              padding: 12,
              borderColor: "#1e293b",
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
            },
          },
        }}
      />
    </div>
  );
}
