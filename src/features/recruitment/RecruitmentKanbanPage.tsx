import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Star, Mail, Phone, ExternalLink, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { hrmsService } from '../../services/hrmsService';
import { JobApplicant, JobOpening } from '../../types/hrms';

const STAGES: Array<JobApplicant['stage']> = [
  'Applied',
  'Screening',
  'Technical Round',
  'HR Interview',
  'Offer Sent',
];

export const RecruitmentKanbanPage: React.FC = () => {
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('All');

  useEffect(() => {
    hrmsService.getJobApplicants().then(setApplicants);
    hrmsService.getJobOpenings().then(setJobs);
  }, []);

  const handleStageChange = async (applicantId: string, newStage: JobApplicant['stage']) => {
    await hrmsService.updateApplicantStage(applicantId, newStage);
    setApplicants((prev) =>
      prev.map((app) => (app.id === applicantId ? { ...app, stage: newStage } : app))
    );
  };

  const filteredApplicants = selectedJob === 'All'
    ? applicants
    : applicants.filter((a) => a.jobId === selectedJob);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Recruitment Pipeline (Kanban)</h1>
          <p className="text-sm text-brand-slate mt-1">
            Track candidates through screening, technical review, partner rounds, and offer letters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-brand-card border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
          >
            <option value="All">All Job Requisitions ({applicants.length} candidates)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageApplicants = filteredApplicants.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="bg-brand-card/40 border border-brand-border rounded-xl p-3 flex flex-col min-w-[240px]">
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    {stage}
                  </span>
                  <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-1.5 py-0.2 rounded-full border border-brand-red/20">
                    {stageApplicants.length}
                  </span>
                </div>
              </div>

              {/* Stage Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {stageApplicants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-brand-slate/50">
                    No candidates
                  </div>
                ) : (
                  stageApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-brand-card hover:bg-brand-card-hover border border-brand-border hover:border-brand-red/40 transition-all shadow-card-dark group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-brand-ink group-hover:text-brand-red transition-colors">
                          {app.applicantName}
                        </h4>
                        <div className="flex items-center text-amber-400 text-[11px] font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {app.rating}.0
                        </div>
                      </div>

                      <p className="text-[11px] text-brand-slate font-medium mt-1 truncate">
                        {app.jobTitle}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-brand-slate/80 mt-2">
                        <span>{app.experienceYears} yrs exp</span>
                        <span>•</span>
                        <span className="truncate">{app.currentCompany || 'Freelance'}</span>
                      </div>

                      {/* Stage transition controls */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-brand-slate">{app.appliedDate}</span>
                        <select
                          value={app.stage}
                          onChange={(e) => handleStageChange(app.id, e.target.value as any)}
                          className="bg-brand-dark-subtle border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-brand-slate focus:text-brand-ink focus:border-brand-red"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              Move to: {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
