import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Sparkles, Loader2, TrendingUp } from "lucide-react";
import { useWeeklyActivities, useWeeklyInsight, ActivityLog } from "../hooks/useTauri";
import { getCategoryColor } from "../lib/utils";
import "../styles/weekly-trends.css";

const CATEGORIES = [
  "Development",
  "Research",
  "Communication",
  "Meetings",
  "Administration",
  "Documentation",
  "Design",
  "Project Management",
  "Uncategorized",
];

export function WeeklyTrends() {
  // Get last 7 days
  const { startDate, endDate, dateLabels } = useMemo(() => {
    const today = new Date();
    const dates = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      dates.push(iso);
      // Format as "Mon", "Tue", etc.
      labels.push({
        iso,
        shortDay: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return {
      startDate: dates[0],
      endDate: dates[6],
      dateLabels: labels,
    };
  }, []);

  const { activities, loading: activitiesLoading } = useWeeklyActivities(startDate, endDate);
  const { insight, loading: insightLoading, generate } = useWeeklyInsight();

  // Transform activities into chart data
  const chartData = useMemo(() => {
    const dataByDate: Record<string, Record<string, number>> = {};
    
    // Initialize with 0s
    dateLabels.forEach(({ iso }) => {
      dataByDate[iso] = { total: 0 };
      CATEGORIES.forEach((cat) => (dataByDate[iso][cat] = 0));
    });

    activities.forEach((activity: ActivityLog) => {
      if (activity.is_idle) return;
      
      const dateStr = activity.start_time.split("T")[0];
      if (dataByDate[dateStr]) {
        const cat = activity.category || "Uncategorized";
        const hours = activity.duration_seconds / 3600;
        if (dataByDate[dateStr][cat] !== undefined) {
          dataByDate[dateStr][cat] += hours;
        }
        if (cat !== "Entertainment") {
           dataByDate[dateStr].total += hours;
        }
      }
    });

    return dateLabels.map(({ iso, shortDay, fullDate }) => ({
      name: shortDay,
      fullDate,
      ...dataByDate[iso],
    }));
  }, [activities, dateLabels]);

  const handleGenerateInsight = () => {
    generate(startDate, endDate);
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      color: string;
      name: string;
      value: number;
      payload: Record<string, number | string>;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="recharts-default-tooltip">
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>{data.fullDate}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: entry.color }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 500 }}>{entry.value.toFixed(1)}h</span>
            </div>
          ))}
          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-primary)" }}>Total Productive:</span>
            <span style={{ fontWeight: 600 }}>{(data.total as number).toFixed(1)}h</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="weekly-trends">
      <div className="weekly-trends-header">
        <h2 className="weekly-trends-title">Weekly Trends</h2>
        <p className="weekly-trends-subtitle">
          {chartData[0]?.fullDate} - {chartData[6]?.fullDate}
        </p>
      </div>

      <div className="weekly-trends-chart-card">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
           <TrendingUp size={20} color="var(--color-primary)" />
           <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 500 }}>Time by Category</h3>
        </div>
        
        <div className="weekly-trends-chart-container">
          {activitiesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
               <Loader2 className="spinning" size={24} color="var(--color-text-secondary)" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                   dataKey="name" 
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                   dy={10}
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                   tickFormatter={(val) => `${val}h`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-bg-tertiary)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                {CATEGORIES.map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={getCategoryColor(category)}
                    radius={[category === "Uncategorized" ? 4 : 0, category === "Uncategorized" ? 4 : 0, 0, 0]} // Basic attempt at border radius, in practice we'd need a custom shape
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="weekly-insight-card">
        <div className="weekly-insight-header">
          <div className="weekly-insight-title">
            <Sparkles size={20} />
            AI Weekly Insight
          </div>
          
          <button 
            className="insight-button"
            onClick={handleGenerateInsight}
            disabled={insightLoading || activitiesLoading}
          >
            {insightLoading && <Loader2 size={16} className="spinning" />}
            {insightLoading ? "Analyzing..." : insight ? "Regenerate" : "Generate Insight"}
          </button>
        </div>

        {insight && (
          <div className="weekly-insight-content">
            {insight}
          </div>
        )}
      </div>
    </div>
  );
}
