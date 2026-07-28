import {
  Bar,
  Doughnut,
  Line,
} from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

import type { DashboardChartItem } from "../../types/dashboard";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const textColor = "#8994a7";
const gridColor = "rgba(255,255,255,.055)";

interface DashboardChartsProps {
  sessionsByMonth: DashboardChartItem[];
  subjectsRanking: DashboardChartItem[];
  ratingsDistribution: DashboardChartItem[];
}

function DashboardCharts({
  sessionsByMonth,
  subjectsRanking,
  ratingsDistribution,
}: DashboardChartsProps) {
  return (
    <section className="analytics-grid">
      <article className="panel analytics-card analytics-card--wide">
        <div className="panel__header">
          <div>
            <span className="panel__eyebrow">Evolução</span>
            <h2>Sessões por mês</h2>
          </div>
        </div>

        <div className="analytics-chart">
          <Line
            data={{
              labels: sessionsByMonth.map((item) => item.label),
              datasets: [
                {
                  label: "Sessões",
                  data: sessionsByMonth.map((item) => item.value),
                  borderColor: "#6c86ff",
                  backgroundColor: "rgba(91,124,250,.12)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 3,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  ticks: { color: textColor },
                  grid: { display: false },
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: textColor, precision: 0 },
                  grid: { color: gridColor },
                },
              },
            }}
          />
        </div>
      </article>

      <article className="panel analytics-card">
        <div className="panel__header">
          <div>
            <span className="panel__eyebrow">Procura</span>
            <h2>Disciplinas em destaque</h2>
          </div>
        </div>

        <div className="analytics-chart">
          <Bar
            data={{
              labels: subjectsRanking.map((item) => item.label),
              datasets: [
                {
                  label: "Sessões",
                  data: subjectsRanking.map((item) => item.value),
                  backgroundColor: "rgba(92, 211, 165, .75)",
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: { color: textColor, precision: 0 },
                  grid: { color: gridColor },
                },
                y: {
                  ticks: { color: textColor },
                  grid: { display: false },
                },
              },
            }}
          />
        </div>
      </article>

      <article className="panel analytics-card">
        <div className="panel__header">
          <div>
            <span className="panel__eyebrow">Satisfação</span>
            <h2>Distribuição das notas</h2>
          </div>
        </div>

        <div className="analytics-chart analytics-chart--doughnut">
          <Doughnut
            data={{
              labels: ratingsDistribution.map((item) => item.label),
              datasets: [
                {
                  data: ratingsDistribution.map((item) => item.value),
                  backgroundColor: [
                    "#ef6671",
                    "#ef8c5d",
                    "#e8b552",
                    "#7dc984",
                    "#5b7cfa",
                  ],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "68%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: textColor,
                    boxWidth: 9,
                    usePointStyle: true,
                  },
                },
              },
            }}
          />
        </div>
      </article>
    </section>
  );
}

export default DashboardCharts;
