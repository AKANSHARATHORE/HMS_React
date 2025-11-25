// StatusRing.tsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type StatusRingProps = {
  title: string;
  working: number;
  notWorking: number;
  partiallyWorking: number;
  onSegmentClick: (zoneType: string, status: string) => void;
};

const StatusRing: React.FC<StatusRingProps> = ({
  title,
  working,
  notWorking,
  partiallyWorking,
  onSegmentClick,
}) => {
  const total = working + notWorking + partiallyWorking;

  const data = {
    labels: ['Working', 'Partially Working', 'Not Working'],
    datasets: [
      {
        data: total === 0 ? [1] : [working, partiallyWorking, notWorking],
        backgroundColor: total === 0 ? ['#e0e0e0'] : ['#5DB996', '#FFD66B', '#EF5350'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: '75%',
    onClick: (event: any, elements: any[]) => {
      if (!elements.length || total === 0) return;

      const index = elements[0].index;
      const label = data.labels[index];
      const status = label.toLowerCase(); 
      onSegmentClick(title, status);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            if (total === 0) return '0';
            const count = context.raw;
            const percentage = ((count / total) * 100).toFixed(1);
            return `${context.label}: ${count} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center w-48">
      <div className="relative w-full h-full">
        <Doughnut data={data} options={options as any} />
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold pointer-events-none">
          {total === 0 ? 0 : total}
        </div>
      </div>
      <div className="text-sm text-center mt-2">{title}</div>
    </div>
  );
};

export default StatusRing;
