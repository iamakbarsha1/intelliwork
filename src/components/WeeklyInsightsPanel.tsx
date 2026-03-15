import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Sparkles, Loader2, Calendar, TrendingUp, Target, BrainCircuit } from 'lucide-react';
import "../styles/weekly-insights.css";

interface WeeklyInsight {
  id: string;
  week_start_date: string;
  raw_insight: string;
  ai_provider: string;
  created_at: string;
}

export const WeeklyInsightsPanel: React.FC = () => {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    // Current week (Monday start)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const data = await invoke<WeeklyInsight | null>('get_weekly_insight', { weekStart });
      setInsight(data);
    } catch (error) {
      console.error('Failed to fetch insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    setGenerating(true);
    try {
      // Calculate start and end for the week
      const start = weekStart;
      const endDateDate = new Date(weekStart);
      endDateDate.setDate(endDateDate.getDate() + 6);
      const end = endDateDate.toISOString().split('T')[0];

      const raw = await invoke<string>('generate_weekly_insights', {
        startDate: start,
        endDate: end
      });
      
      setInsight({
        id: 'new',
        week_start_date: weekStart,
        raw_insight: raw,
        ai_provider: 'AI',
        created_at: new Date().toISOString()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`AI Error: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [weekStart]);

  if (loading) {
    return (
      <div className="weekly-insights__loading">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mb-4" />
        <p className="text-white/60">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="weekly-insights animate-fade-in">
      <div className="weekly-insights__header">
        <div className="weekly-insights__header-info">
          <div className="weekly-insights__icon-container">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="weekly-insights__title">Weekly AI Strategic Insights</h2>
            <p className="weekly-insights__subtitle">Strategic analysis of your performance patterns</p>
          </div>
        </div>
        <div className="weekly-insights__controls">
            <input 
              type="date" 
              value={weekStart} 
              onChange={(e) => setWeekStart(e.target.value)}
              className="weekly-insights__date-input"
            />
            <button 
              onClick={generateInsight}
              disabled={generating}
              className="weekly-insights__generate-btn"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Strategic Analysis
                </>
              )}
            </button>
        </div>
      </div>

      <div className="weekly-insights__body">
        {insight ? (
          <div className="weekly-insights__content-container animate-fade-in">
            <div className="weekly-insights__grid">
              <div className="weekly-insights__card">
                <div className="weekly-insights__card-header" style={{ color: "#00ff88" }}>
                  <TrendingUp size={18} />
                  <span className="weekly-insights__card-label">Key Growth Vectors</span>
                </div>
                <div className="weekly-insights__card-content">
                  {insight.raw_insight.split('\n\n')[1] || insight.raw_insight.split('\n')[1] || "Consistent deep work periods identified."}
                </div>
              </div>
              <div className="weekly-insights__card">
                <div className="weekly-insights__card-header" style={{ color: "#ffd700" }}>
                  <Target size={18} />
                  <span className="weekly-insights__card-label">Tactical Recommendations</span>
                </div>
                <div className="weekly-insights__card-content">
                  {insight.raw_insight.split('\n\n')[2] || "Try scheduling deep work before 11:00 AM."}
                </div>
              </div>
            </div>
            
            <div className="weekly-insights__hero">
                <div className="weekly-insights__hero-icon" style={{ color: "#00ff88" }}>
                  <Sparkles size={120} />
                </div>
                <h3 className="weekly-insights__hero-title">
                  <BrainCircuit size={20} style={{ color: "#00ff88" }} />
                  Full Strategic Perspectives
                </h3>
                <div className="weekly-insights__hero-text">
                   {insight.raw_insight}
                </div>
            </div>
            
            <div className="weekly-insights__footer">
              <span>Generated on {new Date(insight.created_at).toLocaleDateString()}</span>
              <span>Model: GPT-4o-Mini • Mode: Strategic Analysis</span>
            </div>
          </div>
        ) : (
          <div className="weekly-insights__empty">
            <div className="weekly-insights__empty-icon">
               <Calendar size={32} />
            </div>
            <h3 className="weekly-insights__empty-title">No insight for this week</h3>
            <p className="weekly-insights__empty-text">
              Unlock powerful AI-driven perspective on your performance. 
              Generate an insight now to reveal deep patterns in your workflow.
            </p>
            <button 
              onClick={generateInsight}
              disabled={generating}
              className="weekly-insights__empty-btn"
            >
              {generating ? "Initializing Processor..." : "Generate Strategic Analysis"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
