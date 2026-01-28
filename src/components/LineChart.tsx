interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
  height?: number;
  color?: string;
}

export default function LineChart({ data, title, height = 300, color = '#3b82f6' }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 80;
  const chartWidth = 100;
  const padding = 5;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((item.value / maxValue) * (chartHeight - padding * 2));
    return { x, y, value: item.value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={areaData}
            fill="url(#areaGradient)"
          />

          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            className="transition-all duration-300"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1"
                fill={color}
                className="transition-all duration-300 hover:r-2"
              />
              <text
                x={point.x}
                y={point.y - 3}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-700"
                style={{ fontSize: '3px' }}
              >
                {point.value}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {data.length > 0 && (
            <>
              <span>{data[0].label}</span>
              {data.length > 1 && <span>{data[data.length - 1].label}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
