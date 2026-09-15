"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface DashboardBarChartProps {
  data: {
    labels: string[]; // Tanggal 1 s.d 30/31
    barangMasuk: number[];
    barangKeluar: number[];
  };
}

export function DashboardBarChart({ data }: DashboardBarChartProps) {
  const chartConfig = {
    labels: data.labels,
    datasets: [
      {
        label: "Barang Masuk",
        data: data.barangMasuk,
        backgroundColor: "#10b981",
        borderRadius: 4,
        barThickness: 8,
      },
      {
        label: "Barang Keluar",
        data: data.barangKeluar,
        backgroundColor: "#0284c7",
        borderRadius: 4,
        barThickness: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: "#a1a1aa",
          boxWidth: 10,
          usePointStyle: true,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: "#18181b",
        titleColor: "#f4f4f5",
        bodyColor: "#a1a1aa",
        borderColor: "#27272a",
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 10 } },
      },
      y: {
        grid: { color: "#27272a" },
        ticks: { color: "#71717a", font: { size: 10 } },
      },
    },
  };

  return <Bar data={chartConfig} options={options} />;
}
