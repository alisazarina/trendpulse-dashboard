import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendDataPoint } from '../types';

interface TrendChartProps {
  data: TrendDataPoint[];
  color?: string;
  isDarkMode?: boolean;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, color = "#3b82f6", isDarkMode = false }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No historical data</div>;
  }

  const gridColor = isDarkMode ? "#334155" : "#e2e8f0"; // slate-700 vs slate-200
  const axisColor = isDarkMode ? "#94a3b8" : "#64748b"; // slate-400 vs slate-500
  const tooltipBg = isDarkMode ? "#1e293b" : "#fff"; // slate-800 vs white
  const tooltipBorder = isDarkMode ? "#334155" : "#e2e8f0";
  const tooltipText = isDarkMode ? "#f1f5f9" : "#1e293b";

  return (
    <div className="h-48 w-full mt-4" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10, fill: axisColor}} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            hide 
            domain={[0, 100]} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              borderRadius: '8px', 
              border: `1px solid ${tooltipBorder}`, 
              fontSize: '12px',
              color: tooltipText
            }}
            itemStyle={{ color: tooltipText }}
            labelStyle={{ color: axisColor }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;