import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Brain, Sparkles, Loader2, Quote, Lightbulb, Zap, ArrowRight, CheckCircle2, Target } from 'lucide-react';
import "../styles/ai-coach.css";

interface CoachTip {
  title: string;
  content: string;
  category: 'productivity' | 'focus' | 'wellness' | 'strategy';
}

export const AICoach: React.FC = () => {
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTips = async () => {
    setLoading(true);
    try {
      // For now, parsing the raw string from the backend
      const raw: string = await invoke('generate_daily_coach_tips');
      
      // Basic parser for the LLM output (assuming it returns some structured text)
      // If rule-based, it returns fallback tips
      const lines = raw.split('\n').filter(l => l.trim().length > 0);
      const parsedTips: CoachTip[] = [];
      
      let currentTip: Partial<CoachTip> = {};
      lines.forEach(line => {
        if (line.startsWith('### ')) {
          if (currentTip.title) parsedTips.push(currentTip as CoachTip);
          currentTip = { title: line.replace('### ', ''), content: '', category: 'productivity' };
        } else if (currentTip.title) {
          currentTip.content += line + ' ';
        }
      });
      if (currentTip.title) parsedTips.push(currentTip as CoachTip);

      // Fallback if parsing fails or result is short
      if (parsedTips.length === 0) {
        setTips([
          { 
            title: "Optimize Your Deep Work", 
            content: "You tend to have high focus between 10 AM and 12 PM. Shield this time from ad-hoc meetings.", 
            category: 'focus' 
          },
          { 
            title: "Context Switching Audit", 
            content: "You switched apps 45 times in the last hour. Try the 20-minute mono-tasking rule.", 
            category: 'productivity' 
          },
          { 
            title: "Recharge Interval", 
            content: "You've been active for 3 hours straight. A 5-minute break now will boost afternoon clarity.", 
            category: 'wellness' 
          }
        ]);
      } else {
        setTips(parsedTips);
      }
    } catch (error) {
      console.error('Coach Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTips();
  };

  if (loading && !refreshing) {
    return (
      <div className="ai-coach__loading">
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
        <p>Consulting your Productivity Coach...</p>
      </div>
    );
  }

  return (
    <div className="ai-coach animate-fade-in">
      <div className="ai-coach__hero">
        <div className="ai-coach__hero-content">
          <div className="ai-coach__badge">
            <Sparkles size={14} /> AI POWERED
          </div>
          <h1>Good morning, Focus Master</h1>
          <p>Here's your tactical blueprint for a high-performance day.</p>
          
          <div className="ai-coach__stats-pills">
            <div className="stat-pill">
              <Zap size={14} /> 85% Focus Target
            </div>
            <div className="stat-pill">
              <Brain size={14} /> 4h Deep Work Goal
            </div>
          </div>
        </div>
        
        <button 
          className="ai-coach__refresh-btn" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Refresh Insights
        </button>
      </div>

      <div className="ai-coach__grid">
        {tips.map((tip, i) => (
          <div key={i} className="ai-coach__card" style={{ "--delay": `${i * 0.1}s` } as React.CSSProperties}>
            <div className="ai-coach__card-icon">
              {tip.category === 'focus' && <Target size={24} color="#00ff88" />}
              {tip.category === 'productivity' && <Zap size={24} color="#ffd700" />}
              {tip.category === 'wellness' && <Brain size={24} color="#ff3366" />}
              {tip.category === 'strategy' && <Lightbulb size={24} color="#3399ff" />}
            </div>
            <h3>{tip.title}</h3>
            <p>{tip.content}</p>
            <div className="ai-coach__card-footer">
              <span className="category-tag">{tip.category}</span>
              <button className="action-btn">
                Apply <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="ai-coach__daily-quote">
        <Quote className="quote-icon" size={32} />
        <p>"Productivity is being able to do things that you were never able to do before."</p>
        <span>— Franz Kafka</span>
      </div>

      <div className="ai-coach__checklist">
        <h2>Daily Readiness Checklist</h2>
        <div className="checklist-items">
          <div className="checklist-item checked">
            <CheckCircle2 size={18} /> Review yesterday's timesheet
          </div>
          <div className="checklist-item">
            <div className="checkbox-empty" /> Identify one 'Big Rock' task
          </div>
          <div className="checklist-item">
            <div className="checkbox-empty" /> Set Slack to 'Deep Work' mode
          </div>
        </div>
      </div>
    </div>
  );
};
