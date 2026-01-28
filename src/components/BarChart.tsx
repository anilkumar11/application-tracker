interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title: string;
  height?: number;
}

export default function BarChart({ data, title, height = 300 }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const chartHeight = height - 80;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 40) : 0;
            const barWidth = 100 / data.length;
            const x = (index * barWidth) + (barWidth * 0.1);
            const y = chartHeight - barHeight - 30;

            return (
              <g key={index}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth * 0.8}%`}
                  height={barHeight}
                  fill={item.color || '#3b82f6'}
                  className="transition-all duration-300 hover:opacity-80"
                  rx="4"
                />
                <text
                  x={`${x + barWidth * 0.4}%`}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex justify-around mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-600 text-center flex-1 truncate px-1" title={item.label}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
