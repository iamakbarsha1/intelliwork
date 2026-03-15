import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Trophy, Zap, Star, Shield, Lock, Award, Flame, TrendingUp, BrainCircuit, Heart, Gauge, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  achievement_type: string;
  name: string;
  value: number;
  earned_at: string;
}

interface GamificationData {
  streak: number;
  achievements: Achievement[];
}

export const GamificationDashboard: React.FC = () => {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGamification = async () => {
    try {
      const result = await invoke<GamificationData>('get_gamification_data');
      setData(result);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamification();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#121212] rounded-3xl border border-white/5 animate-pulse">
        <Trophy className="w-12 h-12 text-white/5 mb-4 animate-bounce" />
        <p className="text-white/40 tracking-wider font-bold">Synchronizing Badges...</p>
      </div>
    );
  }

  const streak = data?.streak || 0;
  const achievements = data?.achievements || [];

  return (
    <div className="space-y-8">
      {/* Hero Streak Section */}
      <div className="relative group overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#ff4400] via-[#ff8800] to-[#ffaa00] p-1 shadow-2xl transition-all duration-500 hover:shadow-[#ff8800]/20 hover:scale-[1.01]">
        <div className="h-full w-full rounded-[2.9rem] bg-black/90 p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
             <Flame size={320} className="text-[#ff8800] blur-3xl animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex items-center gap-10">
              <div className="relative">
                <div className="absolute -inset-8 bg-[#ff8800]/20 rounded-full blur-3xl group-hover:bg-[#ff8800]/40 transition-colors"></div>
                <div className="relative h-48 w-48 rounded-full border-2 border-white/10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl shadow-2xl">
                    <Flame className={`${streak > 0 ? 'text-[#ff4d00]' : 'text-white/10'} w-24 h-24 mb-1 animate-pulse drop-shadow-[0_0_20px_rgba(255,136,0,0.5)]`} />
                    <span className="text-6xl font-black text-white leading-none tracking-tighter">{streak}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-5xl font-black text-white tracking-tight leading-none">DAY STREAK</h2>
                <div className="flex items-center gap-3">
                   <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 group/btn">
                      <Sparkles size={16} className="text-[#ff8800] group-hover/btn:animate-spin" />
                      <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Current Intensity Level</span>
                   </div>
                   <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff4d00] to-[#ff8800] transition-all duration-1000"
                        style={{ width: `${Math.min((streak / 10) * 100, 100)}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
               <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group/card hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                     <Trophy size={18} className="text-[#ffd700]" />
                     <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Rewards</span>
                  </div>
                  <div className="text-2xl font-black text-white">{achievements.length} Badges</div>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group/card hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                     <Star size={18} className="text-[#00ffcc]" />
                     <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Influence</span>
                  </div>
                  <div className="text-2xl font-black text-white">Lvl {Math.floor(streak / 2) + 1}</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
              <Shield className="text-[#00ff88]" size={28} />
              LEGACY HALL
           </h3>
           <span className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{achievements.length}/50 UNLOCKED</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {achievements.length > 0 ? achievements.map((ach) => (
             <div key={ach.id} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#00ff88] to-[#00ffee] rounded-3xl blur opacity-10 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative p-8 rounded-[2rem] bg-[#1a1a1a] border border-white/10 flex flex-col items-center gap-4 text-center transition-all duration-300 group-hover:-translate-y-2 group-hover:border-[#00ff88]/50 shadow-xl overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 rotate-12 -mr-4 -mt-4 opacity-5 group-hover:animate-pulse">
                      <Award size={80} />
                   </div>
                   <div className="relative z-10">
                     <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                       {ach.achievement_type === 'focus' ? <Gauge size={32} /> : 
                        ach.achievement_type === 'streak' ? <Flame size={32} /> : 
                        ach.achievement_type === 'deep_work' ? <BrainCircuit size={32} /> : 
                        ach.achievement_type === 'collaboration' ? <Heart size={32} /> : <Zap size={32} />}
                     </div>
                     <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 line-clamp-1">{ach.name}</h4>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{new Date(ach.earned_at).toLocaleDateString()}</p>
                   </div>
                   <div className="mt-4 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-[#00ff88] uppercase tracking-tighter">Verified Achievement</div>
                </div>
             </div>
          )) : (
            [...Array(5)].map((_, i) => (
              <div key={i} className="relative group grayscale">
                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center gap-4 opacity-30">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-2">
                    <Lock size={32} />
                  </div>
                  <div className="h-4 w-20 bg-white/10 rounded-full"></div>
                  <div className="h-2 w-12 bg-white/5 rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-[2rem] backdrop-blur-sm">
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Locked</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Next Goals / Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-10 rounded-[3rem] bg-[#1a1a1a] border border-white/5 relative overflow-hidden group hover:border-[#00ff88]/20 transition-all">
             <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000">
                <TrendingUp size={200} />
             </div>
             <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-4">
                <Star className="text-[#ffd700]" size={24} />
                Ascension Targets
             </h3>
             <div className="space-y-6">
                {[
                  { label: "Deep Scribe", target: "10 hours", current: 8.5, color: "#00ff88" },
                  { label: "Consistency Alpha", target: "5 days", current: 3.2, color: "#ff8800" },
                  { label: "The Collaborator", target: "20 comments", current: 15, color: "#00ffee" }
                ].map((goal, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-white/60">{goal.label}</span>
                        <span className="text-white">{goal.target}</span>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full transition-all duration-1000"
                          style={{ 
                            width: `${(goal.current / 10) * 100}%`,
                            backgroundColor: goal.color
                          }}
                        ></div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="p-10 rounded-[3rem] bg-gradient-to-br from-[#0066ff]/10 to-transparent border border-white/5 relative overflow-hidden group hover:border-[#0066ff]/20 transition-all">
             <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-4">
                <Zap className="text-[#0066ff]" size={24} />
                Weekly Power Graph
             </h3>
              {/* placeholder for a chart or some visualization */}
              <div className="h-64 flex items-end gap-2 justify-between">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="relative flex-1 group/bar">
                     <div 
                        className="w-full bg-[#0066ff] rounded-t-xl transition-all duration-500 hover:brightness-125"
                        style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}
                      ></div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white text-black text-[10px] font-black px-2 py-1 rounded-lg">
                        {h}%
                      </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
          </div>
      </div>
    </div>
  );
};
