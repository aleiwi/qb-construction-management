
import React, { useMemo } from 'react';
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AreaChartComponent = ({ projects }) => {
  const chartData = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentMonth = new Date().getMonth();
    
    const last6Months = [];
    for(let i=5; i>=0; i--) {
        const d = new Date();
        d.setMonth(currentMonth - i);
        last6Months.push(months[d.getMonth()]);
    }

    const totalBudget = projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
    const dataPoints = last6Months.map((_, index) => {
        const progress = (index + 1) / 6; 
        return Math.round(totalBudget * progress * (0.8 + Math.random() * 0.4)); 
    });

    return {
      labels: last6Months,
      datasets: [
        {
          fill: true,
          label: 'نمو الميزانية (تراكمي)',
          data: dataPoints,
          borderColor: '#8B5CF6',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
            return gradient;
          },
          tension: 0.4,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#8B5CF6',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [projects]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { 
        backgroundColor: '#1F2937', 
        padding: 12, 
        cornerRadius: 8,
        titleFont: { family: 'Cairo' },
        bodyFont: { family: 'Cairo' }
    } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Cairo' } } },
      y: { display: false, border: { display: false } }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return <Line data={chartData} options={options} />;
};

const getProjectTypeArabic = (type) => {
  const types = {
    'construction': 'بناء',
    'commercial': 'تجاري',
    'residential': 'سكني',
    'educational': 'تعليمي',
    'medical': 'طبي',
    'tourism': 'سياحي',
    'industrial': 'صناعي',
    'general': 'عام',
    'infrastructure': 'بنية تحتية',
    'تجاري': 'تجاري',
    'سكني': 'سكني',
    'تعليمي': 'تعليمي',
    'طبي': 'طبي',
    'سياحي': 'سياحي',
    'صناعي': 'صناعي',
    'عام': 'عام'
  };
  return types[type] || type || 'غير محدد';
};

export const BarChartComponent = ({ projects }) => {
    const chartData = useMemo(() => {
        const types = {};
        projects.forEach(p => {
            const rawType = p.project_type || 'غير محدد';
            // Normalize to Arabic to ensure "construction" and "بناء" merge
            const t = getProjectTypeArabic(rawType);
            types[t] = (types[t] || 0) + (p.estimated_cost || 0);
        });

        const labels = Object.keys(types);
        const data = Object.values(types);

        const finalLabels = labels.length ? labels : ['سكني', 'تجاري', 'صناعي'];
        const finalData = labels.length ? data : [0, 0, 0];

        return {
            labels: finalLabels,
            datasets: [
            {
                label: 'الميزانية حسب النوع',
                data: finalData,
                backgroundColor: [
                '#3B82F6',
                '#8B5CF6',
                '#10B981',
                '#F59E0B',
                ],
                borderRadius: 8,
                barThickness: 30,
            },
            ],
        };
    }, [projects]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6', drawBorder: false }, ticks: { display: false } },
      x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: 'Cairo' } } }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export const CustomGridGauge = ({ percent }) => {
  return (
    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="#F3F4F6"
          strokeWidth="12"
          fill="transparent"
          strokeLinecap="round"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={439.8} 
          strokeDashoffset={439.8 - (439.8 * percent) / 100}
          className="transition-all duration-1000 ease-out drop-shadow-lg"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[#1F2937] tracking-tight">{percent}%</span>
        <span className="text-sm text-gray-400 font-medium mt-1">نسبة الإنجاز</span>
      </div>
    </div>
  );
};
