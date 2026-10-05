import React, { useState, useEffect } from 'react';
import { Target, Award, Plus, CheckCircle2, TrendingUp, Star, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { hrmsService } from '../../services/hrmsService';
import { PerformanceGoal } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';

export const PerformancePage: React.FC = () => {
  const { user, role } = useAuth();
  const isEmployee = role === 'Employee';

  const [goals, setGoals] = useState<PerformanceGoal[]>([]);

  useEffect(() => {
    hrmsService.getGoals(isEmployee ? user?.employeeId : undefined).then(setGoals);
  }, [isEmployee, user]);

  const handleSliderChange = async (id: string, newProgress: number) => {
    const updated = await hrmsService.updateGoalProgress(id, newProgress);
    setGoals(goals.map((g) => (g.id === id ? updated : g)));
  };

  const visibleGoals = isEmployee
    ? goals.filter((g) => !g.employeeId || g.employeeId === user?.employeeId)
    : goals;

  const avgProgress = visibleGoals.length
    ? Math.round(visibleGoals.reduce((acc, g) => acc + g.progress, 0) / visibleGoals.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">
            {isEmployee ? 'My Performance Goals & OKRs' : 'Performance & OKRs Management'}
          </h1>
          <p className="text-sm text-brand-slate mt-1">
            {isEmployee
              ? 'Quarterly key results, professional milestones, and self-assessment tracking.'
              : 'Track company-wide key results, quarterly appraisals, and employee competency growth.'}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Goal Completion"
            value={`${avgProgress}%`}
            subtitle="Q3 2026 Milestone Health"
            icon={Target}
            variant="red"
          />
          <StatCard
            title="Latest Performance Rating"
            value="4.8 / 5.0"
            subtitle="Top 5% Band (Senior Architect)"
            icon={Star}
            variant="emerald"
          />
          <StatCard
            title="Appraisal Status"
            value="Self-Review Complete"
            subtitle="Manager Review in Progress"
            icon={Award}
            variant="blue"
          />
          <StatCard
            title="Competency Tier"
            value="L6 Senior Band"
            subtitle="Engineering & Cloud Architecture"
            icon={Zap}
            variant="default"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Goal Completion Rate"
            value={`${avgProgress}%`}
            subtitle={`${goals.filter((g) => g.status === 'Completed').length} of ${goals.length} Completed`}
            icon={Target}
            variant="red"
          />
          <StatCard
            title="Average Org Rating"
            value={`${((avgProgress / 100) * 5).toFixed(1)} / 5.0`}
            subtitle="Derived from Milestone Velocity"
            icon={Star}
            variant="emerald"
          />
          <StatCard
            title="High Performers"
            value={`${goals.filter((g) => g.progress >= 90).length} Goals`}
            subtitle="Progress Score ≥ 90%"
            icon={Award}
            variant="blue"
          />
          <StatCard
            title="Active Objectives"
            value={`${goals.filter((g) => g.status !== 'Completed').length} In Progress`}
            subtitle="Strategic Execution Health"
            icon={TrendingUp}
            variant="default"
          />
        </div>
      )}

      {/* Strategic OKRs Table / Sliders */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-red" />
            <CardTitle>
              {isEmployee ? 'My Q3 2026 Objectives & Key Results' : 'Q3 2026 Strategic Objectives & Key Results'}
            </CardTitle>
          </div>
        </CardHeader>

        <div className="space-y-4">
          {visibleGoals.length === 0 ? (
            <p className="py-8 text-center text-xs text-brand-slate">
              No performance goals assigned to your account.
            </p>
          ) : (
            visibleGoals.map((goal) => (
              <div key={goal.id} className="p-4 rounded-xl bg-brand-card-hover border border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-ink">{goal.title}</h4>
                      <span className="text-[10px] font-bold text-brand-slate uppercase bg-white/5 px-2 py-0.5 rounded">
                        {goal.category}
                      </span>
                    </div>
                    <p className="text-xs text-brand-slate mt-1">{goal.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={goal.progress >= 100 ? 'success' : 'warning'}>
                      {goal.status}
                    </Badge>
                    <span className="text-xs font-bold text-brand-ink min-w-[40px] text-right">
                      {goal.progress}%
                    </span>
                  </div>
                </div>

                {/* Interactive Progress Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => handleSliderChange(goal.id, Number(e.target.value))}
                    className="w-full accent-brand-red cursor-pointer h-2 bg-brand-dark rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-brand-slate">
                    <span>Weightage: {goal.weightage}%</span>
                    <span>Target Due: {goal.dueDate}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
