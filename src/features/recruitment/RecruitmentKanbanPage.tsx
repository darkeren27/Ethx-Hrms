import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Star,
  Mail,
  Phone,
  Filter,
  Search,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  X,
  ChevronRight,
  Download,
  AlertCircle,
  Trash2,
  Award,
  Edit3,
  SlidersHorizontal,
  Sparkles,
  Send,
  UserCheck,
  UserX,
  GraduationCap,
  ShieldCheck,
  Check,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { hrmsService } from '../../services/hrmsService';
import { JobApplicant, JobOpening } from '../../types/hrms';

const STAGES: Array<JobApplicant['stage']> = [
  'Applied',
  'Screening',
  'Technical Round',
  'HR Interview',
  'Offer Sent',
];

const STAGE_CONFIG: Record<
  JobApplicant['stage'],
  { label: string; stepNumber: number; color: string; badgeVariant: 'info' | 'warning' | 'default' | 'success' | 'red'; desc: string }
> = {
  Applied: {
    label: 'Applied',
    stepNumber: 1,
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    badgeVariant: 'info',
    desc: 'Applications & intern rosters lodged for review',
  },
  Screening: {
    label: 'Screening',
    stepNumber: 2,
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    badgeVariant: 'warning',
    desc: 'Recruiter qualification & performance eligibility audit',
  },
  'Technical Round': {
    label: 'Technical Round',
    stepNumber: 3,
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    badgeVariant: 'default',
    desc: 'Live architecture, coding demo & mentor score panel',
  },
  'HR Interview': {
    label: 'HR Interview',
    stepNumber: 4,
    color: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    badgeVariant: 'info',
    desc: 'Leadership alignment & full-time compensation terms',
  },
  'Offer Sent': {
    label: 'Offer Sent',
    stepNumber: 5,
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    badgeVariant: 'success',
    desc: 'Official offer dispatched; awaiting 1-click permanent promotion',
  },
  Hired: {
    label: 'Hired & Active Staff',
    stepNumber: 6,
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    badgeVariant: 'success',
    desc: 'Candidate successfully onboarded as permanent employee',
  },
  Rejected: {
    label: 'Rejected',
    stepNumber: 0,
    color: 'border-red-500/30 text-red-400 bg-red-500/10',
    badgeVariant: 'red',
    desc: 'Candidate not proceeding in current hiring cycle',
  },
};

export const RecruitmentKanbanPage: React.FC = () => {
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [selectedJob, setSelectedJob] = useState<string>('All');
  const [candidateTypeFilter, setCandidateTypeFilter] = useState<'All' | 'Intern PPO' | 'Lateral Hire'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('type');
      if (p === 'ppo') return 'Intern PPO';
      if (p === 'lateral') return 'Lateral Hire';
    }
    return 'All';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [boardDensity, setBoardDensity] = useState<'spacious' | 'fit'>('spacious');
  const kanbanTrackRef = React.useRef<HTMLDivElement>(null);

  const scrollBoard = (dir: 'left' | 'right') => {
    kanbanTrackRef.current?.scrollBy({
      left: dir === 'left' ? -380 : 380,
      behavior: 'smooth',
    });
  };

  // Drag and drop state
  const [draggedApplicantId, setDraggedApplicantId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<JobApplicant['stage'] | null>(null);

  // Dossier Modal
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
  const [dossierTab, setDossierTab] = useState<'profile' | 'scorecard' | 'internship' | 'offer'>('profile');

  // Promotion to Permanent Employee Modal
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionCandidate, setPromotionCandidate] = useState<JobApplicant | null>(null);
  const [promotionForm, setPromotionForm] = useState({
    designation: 'Associate Software Engineer - L1',
    department: 'IT & Engineering',
    annualSalary: 650000,
    effectiveDate: '2026-10-01',
    reportingManager: 'Siva Kumar (IT Director)',
    notes: 'Q3 internship successfully finished on 30 Sep 2026. Promoted to permanent full-time payroll.',
  });

  // Add Candidate Modal
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [candidateFormData, setCandidateFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    jobId: '',
    candidateType: 'Lateral Hire' as 'Lateral Hire' | 'Intern PPO',
    experienceYears: 3,
    currentCompany: '',
    location: 'Pune, India',
    expectedSalary: '₹15 LPA',
    noticePeriod: '30 Days',
    skills: 'React, TypeScript, Node.js',
    rating: 5,
    stage: 'Applied' as JobApplicant['stage'],
    notes: '',
  });

  // Add Job Opening Modal
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    department: 'IT & Engineering',
    location: 'Pune Global HQ',
    employmentType: 'Full-time',
    openPositions: 2,
    experienceLevel: 'Mid-Senior (2-5 yrs)',
    salaryRange: '₹14 - 22 LPA',
  });

  // Scorecard entry inside Dossier
  const [isAddingInterviewNote, setIsAddingInterviewNote] = useState(false);
  const [newInterviewNote, setNewInterviewNote] = useState({
    stage: 'Technical Round',
    interviewer: 'Siva Kumar (IT Leadership)',
    score: 95,
    notes: '',
  });

  // Offer Generation Form inside Dossier
  const [offerDraft, setOfferDraft] = useState({
    salary: '₹6,50,000 / year (Fixed Salaried)',
    designation: 'Associate Software Engineer - L1',
    joiningDate: '2026-10-01',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedApplicants, fetchedJobs] = await Promise.all([
        hrmsService.getJobApplicants(),
        hrmsService.getJobOpenings(),
      ]);
      setApplicants(fetchedApplicants);
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0 && !candidateFormData.jobId) {
        setCandidateFormData((prev) => ({ ...prev, jobId: fetchedJobs[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load recruitment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  // Stage transition
  const handleStageChange = async (applicantId: string, newStage: JobApplicant['stage']) => {
    try {
      await hrmsService.updateApplicantStage(applicantId, newStage);
      setApplicants((prev) =>
        prev.map((app) => (app.id === applicantId ? { ...app, stage: newStage } : app))
      );
      if (selectedApplicant && selectedApplicant.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, stage: newStage });
      }
      showToast(`Applicant moved to ${newStage} successfully.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update candidate stage.');
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, applicantId: string) => {
    e.dataTransfer.setData('text/plain', applicantId);
    setDraggedApplicantId(applicantId);
  };

  const handleDragOver = (e: React.DragEvent, stage: JobApplicant['stage']) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stage: JobApplicant['stage']) => {
    e.preventDefault();
    setDragOverStage(null);
    const applicantId = e.dataTransfer.getData('text/plain') || draggedApplicantId;
    if (applicantId) {
      await handleStageChange(applicantId, stage);
    }
    setDraggedApplicantId(null);
  };

  // Open Promotion Modal
  const openPromotionModal = (candidate: JobApplicant) => {
    setPromotionCandidate(candidate);
    const proposedSalary = candidate.offerDetails?.salary
      ? parseInt(candidate.offerDetails.salary.replace(/[^0-9]/g, '')) || 650000
      : 650000;
    const proposedDesignation =
      candidate.offerDetails?.designation ||
      (candidate.applicantName.toLowerCase().includes('krishna')
        ? 'Associate Software Engineer - L1'
        : candidate.applicantName.toLowerCase().includes('deepti')
        ? 'Junior Frontend & UI Engineer'
        : candidate.jobTitle.replace(/\(.*\)/, '').trim());

    setPromotionForm({
      designation: proposedDesignation,
      department: 'IT & Engineering',
      annualSalary: proposedSalary >= 100000 ? proposedSalary : proposedSalary * 100000,
      effectiveDate: '2026-10-01',
      reportingManager: 'Siva Kumar (IT Director)',
      notes: `Q3 internship concluded on 30 Sep 2026 with outstanding mentor evaluation (${candidate.technicalScore || 95}%). Promoted to permanent full-time staff with active payroll.`,
    });
    setIsPromotionModalOpen(true);
  };

  // Submit Promotion
  const handleConfirmPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotionCandidate) return;

    try {
      const internId = promotionCandidate.internId || 'emp-021';
      const result = await hrmsService.promoteInternToPermanentEmployee({
        applicantId: promotionCandidate.id,
        internId,
        designation: promotionForm.designation,
        department: promotionForm.department,
        annualSalary: Number(promotionForm.annualSalary),
        effectiveDate: promotionForm.effectiveDate,
        notes: promotionForm.notes,
      });

      // Update local state
      setApplicants((prev) =>
        prev.map((a) => (a.id === promotionCandidate.id ? result.applicant : a))
      );
      if (selectedApplicant && selectedApplicant.id === promotionCandidate.id) {
        setSelectedApplicant(result.applicant);
      }

      setIsPromotionModalOpen(false);
      showToast(
        `🎉 Successfully Promoted ${promotionCandidate.applicantName} to Permanent Employee (${promotionForm.designation})! Personnel record & payroll ledger activated effective ${promotionForm.effectiveDate}.`
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to promote intern.');
    }
  };

  // Add Candidate
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedJob = jobs.find((j) => j.id === candidateFormData.jobId);
    try {
      const created = await hrmsService.createJobApplicant({
        jobId: candidateFormData.jobId || 'JOB-201',
        jobTitle: matchedJob?.title || 'Software Engineer',
        applicantName: candidateFormData.applicantName.trim(),
        email: candidateFormData.email.trim(),
        phone: candidateFormData.phone.trim(),
        candidateType: candidateFormData.candidateType,
        stage: candidateFormData.stage,
        rating: Number(candidateFormData.rating) || 5,
        appliedDate: new Date().toISOString().split('T')[0],
        experienceYears: Number(candidateFormData.experienceYears) || 3,
        currentCompany: candidateFormData.currentCompany.trim() || 'Direct Candidate',
        location: candidateFormData.location.trim(),
        expectedSalary: candidateFormData.expectedSalary.trim(),
        noticePeriod: candidateFormData.noticePeriod.trim(),
        skills: candidateFormData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: candidateFormData.notes.trim(),
      });
      setApplicants((prev) => [created, ...prev]);
      setIsAddCandidateOpen(false);
      setCandidateFormData({
        applicantName: '',
        email: '',
        phone: '',
        jobId: jobs[0]?.id || '',
        candidateType: 'Lateral Hire',
        experienceYears: 3,
        currentCompany: '',
        location: 'Pune, India',
        expectedSalary: '₹15 LPA',
        noticePeriod: '30 Days',
        skills: 'React, TypeScript, Node.js',
        rating: 5,
        stage: 'Applied',
        notes: '',
      });
      showToast(`Candidate ${created.applicantName} added to pipeline.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create candidate.');
    }
  };

  // Add Job Opening
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await hrmsService.createJobOpening({
        title: jobFormData.title.trim(),
        department: jobFormData.department.trim(),
        location: jobFormData.location.trim(),
        employmentType: jobFormData.employmentType,
        openPositions: Number(jobFormData.openPositions) || 1,
        applicantsCount: 0,
        status: 'Published',
        publishDate: new Date().toISOString().split('T')[0],
        experienceLevel: jobFormData.experienceLevel,
        salaryRange: jobFormData.salaryRange,
      });
      setJobs((prev) => [created, ...prev]);
      setIsAddJobOpen(false);
      setSelectedJob(created.id);
      setJobFormData({
        title: '',
        department: 'IT & Engineering',
        location: 'Pune Global HQ',
        employmentType: 'Full-time',
        openPositions: 2,
        experienceLevel: 'Mid-Senior (2-5 yrs)',
        salaryRange: '₹14 - 22 LPA',
      });
      showToast(`Job Requisition "${created.title}" published.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to publish requisition.');
    }
  };

  // Delete Candidate
  const handleDeleteApplicant = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove candidate "${name}" from recruitment pipeline?`)) {
      return;
    }
    try {
      await hrmsService.deleteJobApplicant(id);
      setApplicants((prev) => prev.filter((a) => a.id !== id));
      if (selectedApplicant?.id === id) {
        setSelectedApplicant(null);
      }
      showToast(`Candidate ${name} removed.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete candidate.');
    }
  };

  // Add Interview Note inside Dossier
  const handleAddInterviewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    const updatedNotes = [
      ...(selectedApplicant.interviewNotes || []),
      {
        stage: newInterviewNote.stage,
        interviewer: newInterviewNote.interviewer,
        score: Number(newInterviewNote.score),
        notes: newInterviewNote.notes,
        date: new Date().toISOString().split('T')[0],
      },
    ];

    try {
      const updated = await hrmsService.updateJobApplicant(selectedApplicant.id, {
        interviewNotes: updatedNotes,
        technicalScore: Number(newInterviewNote.score),
      });
      setSelectedApplicant(updated);
      setApplicants((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setIsAddingInterviewNote(false);
      setNewInterviewNote({
        stage: 'Technical Round',
        interviewer: 'Siva Kumar (IT Leadership)',
        score: 95,
        notes: '',
      });
      showToast('Interview scorecard logged successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save scorecard.');
    }
  };

  // Generate / Update Offer inside Dossier
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    const offerDetails = {
      salary: offerDraft.salary,
      designation: offerDraft.designation,
      joiningDate: offerDraft.joiningDate,
      status: 'Sent' as const,
    };

    try {
      const updated = await hrmsService.updateJobApplicant(selectedApplicant.id, {
        offerDetails,
        stage: 'Offer Sent',
      });
      setSelectedApplicant(updated);
      setApplicants((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('Formal Offer Letter dispatched to candidate.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to dispatch offer.');
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      if (selectedJob !== 'All' && app.jobId !== selectedJob) return false;
      if (candidateTypeFilter !== 'All') {
        if (candidateTypeFilter === 'Intern PPO' && app.candidateType !== 'Intern PPO') return false;
        if (candidateTypeFilter === 'Lateral Hire' && app.candidateType === 'Intern PPO') return false;
      }
      if (minRating > 0 && app.rating < minRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.applicantName.toLowerCase().includes(q);
        const matchesJob = app.jobTitle.toLowerCase().includes(q);
        const matchesSkills = app.skills?.some((s) => s.toLowerCase().includes(q));
        const matchesCompany = app.currentCompany?.toLowerCase().includes(q);
        if (!matchesName && !matchesJob && !matchesSkills && !matchesCompany) return false;
      }
      return true;
    });
  }, [applicants, selectedJob, candidateTypeFilter, minRating, searchQuery]);

  // Quick stats
  const activeOpening = jobs.find((j) => j.id === selectedJob);
  const ppoCount = applicants.filter((a) => a.candidateType === 'Intern PPO').length;
  const lateralCount = applicants.filter((a) => a.candidateType !== 'Intern PPO').length;
  const offersCount = applicants.filter((a) => a.stage === 'Offer Sent').length;
  const hiredCount = applicants.filter((a) => a.stage === 'Hired' || a.convertedToEmployee).length;

  return (
    <div className="space-y-6 animate-fade-in text-brand-ink pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-brand-red/60 text-white shadow-2xl flex items-center gap-3 animate-slide-in max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{feedback}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-brand-ink tracking-tight">
              Enterprise Recruitment ATS
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-red/10 text-brand-red border border-brand-red/30">
              Live Hiring & PPO Pipeline
            </span>
          </div>
          <p className="text-xs text-brand-slate mt-1 max-w-3xl leading-relaxed">
            Manage candidates through screening, technical review, partner rounds, offer letters, and{' '}
            <strong className="text-purple-300">1-click permanent promotion</strong> for interns who concluded their 3-month internship on 30 Sep 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddJobOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Briefcase className="w-3.5 h-3.5 text-brand-slate" />
            <span>Publish Requisition</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddCandidateOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold shadow-glow-red-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </Button>
        </div>
      </div>

      {/* KPI Performance Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="p-3.5 border-brand-border/80 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-brand-slate">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Active Pipeline</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{applicants.length}</p>
          <span className="text-[10px] text-blue-400 font-medium">Across 5 Pipeline Stages</span>
        </Card>

        <Card className="p-3.5 border-purple-500/30 bg-purple-950/20">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Intern PPO Conversions</span>
            <GraduationCap className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-200 mt-1.5">{ppoCount}</p>
          <span className="text-[10px] text-purple-400 font-medium">Finished 30 Sep • Ready to Convert</span>
        </Card>

        <Card className="p-3.5 border-brand-border/80 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-brand-slate">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Lateral Professionals</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{lateralCount}</p>
          <span className="text-[10px] text-cyan-400 font-medium">Mid to Senior Engineering</span>
        </Card>

        <Card className="p-3.5 border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Offers Extended</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-1.5">{offersCount}</p>
          <span className="text-[10px] text-emerald-400 font-medium">Awaiting Join / Promotion</span>
        </Card>

        <Card className="p-3.5 border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Promoted Staff</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1.5">{hiredCount}</p>
          <span className="text-[10px] text-amber-400 font-medium">Permanent Full-time Active</span>
        </Card>
      </div>

      {/* Filter and Candidate Type Bar */}
      <Card className="p-4 space-y-3.5 bg-brand-card/90 border-brand-border">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Candidate Type Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5">
            <button
              onClick={() => setCandidateTypeFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                candidateTypeFilter === 'All'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              All Pipeline ({applicants.length})
            </button>
            <button
              onClick={() => setCandidateTypeFilter('Intern PPO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                candidateTypeFilter === 'Intern PPO'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>Completed Interns ({ppoCount})</span>
            </button>
            <button
              onClick={() => setCandidateTypeFilter('Lateral Hire')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                candidateTypeFilter === 'Lateral Hire'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-900/30'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lateral Hires ({lateralCount})</span>
            </button>
          </div>

          {/* Job Requisition Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-brand-slate font-bold whitespace-nowrap">Requisition:</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="py-1.5 px-3 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
            >
              <option value="All">All Job Requisitions ({jobs.length} Openings)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Rating Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, skills, tech stack, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-red"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-slate">Rating:</span>
            <div className="flex items-center gap-1">
              {[0, 4, 4.5].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinRating(val)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                    minRating === val
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950/50 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {val === 0 ? 'All' : `${val}+ ★`}
                </button>
              ))}
            </div>

            {(selectedJob !== 'All' || candidateTypeFilter !== 'All' || searchQuery || minRating > 0) && (
              <button
                onClick={() => {
                  setSelectedJob('All');
                  setCandidateTypeFilter('All');
                  setSearchQuery('');
                  setMinRating(0);
                }}
                className="text-[11px] text-brand-red hover:underline ml-2 font-bold"
              >
                Reset Filters
              </button>
            )}

            {/* View Density & Navigation Controls */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-2">
              <button
                onClick={() => setBoardDensity(boardDensity === 'spacious' ? 'fit' : 'spacious')}
                className="px-2.5 py-1 rounded text-[11px] font-bold border border-white/10 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Toggle between spacious horizontal scroll and fit-to-screen layout"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>{boardDensity === 'spacious' ? 'Fit Screen' : 'Spacious Mode'}</span>
              </button>

              {boardDensity === 'spacious' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollBoard('left')}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
                    title="Pan Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => scrollBoard('right')}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
                    title="Pan Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeOpening && (
          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5 flex flex-wrap items-center gap-3 text-xs text-brand-slate">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-brand-red" /> {activeOpening.title}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-brand-slate" /> {activeOpening.department}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-slate" /> {activeOpening.location}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{activeOpening.openPositions} Open Positions</span>
            <span>•</span>
            <Badge variant="neutral">{activeOpening.salaryRange}</Badge>
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* KANBAN BOARD CONTAINER (SPACIOUS SCROLL OR FIT SCREEN) */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={kanbanTrackRef}
        className={`flex gap-5 overflow-x-auto pb-8 pt-2 items-start scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${
          boardDensity === 'fit' ? 'lg:grid lg:grid-cols-5 lg:gap-3.5' : ''
        }`}
      >
        {STAGES.map((stage) => {
          const stageApplicants = filteredApplicants.filter((a) => a.stage === stage);
          const isOver = dragOverStage === stage;
          const conf = STAGE_CONFIG[stage];

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`${
                boardDensity === 'fit'
                  ? 'w-full min-w-[210px] max-w-full'
                  : 'w-[330px] min-w-[330px] max-w-[340px] flex-shrink-0'
              } flex flex-col rounded-2xl p-4 transition-all border ${
                isOver
                  ? 'bg-brand-red/10 border-brand-red border-dashed shadow-glow-red-sm scale-[1.01]'
                  : 'bg-brand-card/70 border-brand-border/80 shadow-md backdrop-blur-sm'
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-brand-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-red" />
                    {stage}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${conf.color}`}>
                    {stageApplicants.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCandidateFormData((prev) => ({ ...prev, stage }));
                    setIsAddCandidateOpen(true);
                  }}
                  title={`Add candidate to ${stage}`}
                  className="p-1 rounded-lg text-brand-slate hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Stage Description */}
              <p className="text-[10px] text-brand-slate/80 mb-3 leading-tight">
                {conf.desc}
              </p>

              {/* Candidate Cards Stream */}
              <div className="space-y-3.5 flex-1 min-h-[160px] max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {stageApplicants.length === 0 ? (
                  <div className="py-12 px-4 rounded-xl border border-dashed border-white/5 text-center text-xs text-brand-slate/40 flex flex-col items-center justify-center gap-2 bg-slate-950/20">
                    <Users className="w-5 h-5 text-brand-slate/30" />
                    <span>Drop candidates into {stage}</span>
                    <button
                      onClick={() => {
                        setCandidateFormData((prev) => ({ ...prev, stage }));
                        setIsAddCandidateOpen(true);
                      }}
                      className="text-[11px] text-brand-red hover:underline font-bold mt-1"
                    >
                      + Add Candidate
                    </button>
                  </div>
                ) : (
                  stageApplicants.map((app) => {
                    const stageIndex = STAGES.indexOf(app.stage);
                    const canMovePrev = stageIndex > 0;
                    const canMoveNext = stageIndex < STAGES.length - 1;
                    const isPpo = app.candidateType === 'Intern PPO';
                    const initials = app.applicantName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => {
                          setSelectedApplicant(app);
                          setDossierTab(isPpo ? 'internship' : 'profile');
                        }}
                        className={`p-4 rounded-xl border transition-all shadow-md group cursor-pointer relative ${
                          isPpo
                            ? 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400 hover:shadow-purple-950/30'
                            : 'bg-brand-card hover:bg-brand-card-hover border-brand-border hover:border-brand-red/50'
                        }`}
                      >
                        {/* Top: Candidate Type Badge + Rating */}
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          {isPpo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                              <span>Q3 Intern PPO (Finished 30 Sep)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              <Briefcase className="w-3 h-3 text-cyan-400" />
                              <span>Lateral Professional</span>
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-[11px] font-black">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{app.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Candidate Identity */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm ${
                              isPpo
                                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500'
                                : 'bg-gradient-to-tr from-rose-600 to-brand-red'
                            }`}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white group-hover:text-brand-red transition-colors truncate">
                              {app.applicantName}
                            </h3>
                            <p className="text-[11px] text-brand-slate truncate">
                              {app.jobTitle.replace(/\(.*\)/, '')}
                            </p>
                          </div>
                        </div>

                        {/* Origin / Company / Finished Internship */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] text-brand-slate flex items-center justify-between">
                          <span className="truncate flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className={isPpo ? 'text-purple-300 font-medium' : ''}>
                              {app.currentCompany || 'Candidate'}
                            </span>
                          </span>
                          <span className="font-semibold text-slate-300 whitespace-nowrap ml-2">
                            {isPpo ? '3 Mo Intern' : `${app.experienceYears}y exp`}
                          </span>
                        </div>

                        {/* Skills Chips */}
                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {app.skills.slice(0, 3).map((sk) => (
                              <span
                                key={sk}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-white/5"
                              >
                                {sk}
                              </span>
                            ))}
                            {app.skills.length > 3 && (
                              <span className="text-[10px] text-brand-slate px-1 py-0.5">
                                +{app.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Score & CTC Strip */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5 text-[11px]">
                          {app.technicalScore ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{app.technicalScore}% Match</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Evaluation Pending</span>
                          )}

                          <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {app.offerDetails?.salary || app.expectedSalary || 'Negotiable'}
                          </span>
                        </div>

                        {/* Step-by-Step Stage Progress Visualizer */}
                        <div className="mt-3 pt-2.5 border-t border-white/5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                            <span className="font-semibold">Hiring Step {STAGE_CONFIG[app.stage]?.stepNumber} of 5</span>
                            <span className="text-brand-slate">{app.stage}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {STAGES.map((s, idx) => {
                              const currIdx = STAGES.indexOf(app.stage);
                              const isCurrent = s === app.stage;
                              const isPast = currIdx > idx;

                              return (
                                <div
                                  key={s}
                                  className={`h-1.5 rounded-full transition-all ${
                                    isCurrent
                                      ? isPpo ? 'bg-purple-500 shadow-sm' : 'bg-brand-red shadow-sm'
                                      : isPast
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-800'
                                  }`}
                                  title={`Step ${idx + 1}: ${s}`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* SPECIAL PROMOTION BUTTON (For Interns in Offer Sent or with PPO) */}
                        {isPpo && (app.stage === 'Offer Sent' || app.offerDetails?.status === 'Accepted') && !app.convertedToEmployee && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPromotionModal(app);
                            }}
                            className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-[1.01]"
                          >
                            <UserCheck className="w-4 h-4 text-emerald-200" />
                            <span>Promote to Permanent Staff</span>
                          </button>
                        )}

                        {/* Converted status badge if already promoted */}
                        {app.convertedToEmployee && (
                          <div className="w-full mt-3 py-1.5 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Promoted to Permanent Employee</span>
                          </div>
                        )}

                        {/* Card Footer: Quick Advance / Revert Controls */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                          <span className="text-[10px] text-slate-500">
                            {app.appliedDate}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {canMovePrev && (
                              <button
                                onClick={() => handleStageChange(app.id, STAGES[stageIndex - 1])}
                                title={`Revert to ${STAGES[stageIndex - 1]}`}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {canMoveNext && (
                              <button
                                onClick={() => handleStageChange(app.id, STAGES[stageIndex + 1])}
                                title={`Advance to ${STAGES[stageIndex + 1]}`}
                                className="p-1 rounded bg-brand-red/20 hover:bg-brand-red/40 text-brand-red hover:text-white border border-brand-red/30 transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                              >
                                <span>Advance</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1-CLICK PERMANENT EMPLOYEE PROMOTION MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isPromotionModalOpen && promotionCandidate && (
        <Modal
          isOpen={isPromotionModalOpen}
          onClose={() => setIsPromotionModalOpen(false)}
          title={`Promote Intern to Permanent Full-Time Employee`}
          subtitle={`Official PPO Conversion & Payroll Activation • ${promotionCandidate.applicantName}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleConfirmPromotion} className="space-y-4">
            {/* Intern Background Banner */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                    {promotionCandidate.applicantName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{promotionCandidate.applicantName}</h4>
                    <p className="text-[11px] text-purple-300">
                      Internship Period: 01 Jul 2026 – 30 Sep 2026 (Completed) • Intern ID: {promotionCandidate.internId || 'emp-021'}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Completed Q3 Internship</Badge>
              </div>

              <p className="text-xs text-slate-300 italic pt-1 border-t border-purple-500/20">
                "{promotionCandidate.internshipDetails?.recommendation || 'Outstanding performer during Q3 internship. Mastered core modules and ready for immediate permanent absorption.'}"
              </p>
            </div>

            {/* Permanent Role Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">Permanent Designation</label>
                <input
                  type="text"
                  required
                  value={promotionForm.designation}
                  onChange={(e) => setPromotionForm({ ...promotionForm, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
                  placeholder="e.g. Associate Software Engineer - L1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">Target Department</label>
                <select
                  value={promotionForm.department}
                  onChange={(e) => setPromotionForm({ ...promotionForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="IT & Engineering">IT & Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">Annual CTC (INR)</label>
                <input
                  type="number"
                  required
                  min="300000"
                  step="50000"
                  value={promotionForm.annualSalary}
                  onChange={(e) => setPromotionForm({ ...promotionForm, annualSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
                  placeholder="e.g. 650000"
                />
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  Monthly Gross: ₹{Math.round(promotionForm.annualSalary / 12).toLocaleString()} / month (Salaried)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate mb-1">Effective Permanent Joining Date</label>
                <input
                  type="date"
                  required
                  value={promotionForm.effectiveDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Immediate continuation post-internship</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-slate mb-1">Reporting Manager / Director</label>
              <input
                type="text"
                value={promotionForm.reportingManager}
                onChange={(e) => setPromotionForm({ ...promotionForm, reportingManager: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-slate mb-1">HR Approval Justification & Remarks</label>
              <textarea
                rows={2}
                value={promotionForm.notes}
                onChange={(e) => setPromotionForm({ ...promotionForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPromotionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirm & Activate Permanent Employment</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CANDIDATE DEEP DOSSIER MODAL */}
      {/* ------------------------------------------------------------------ */}
      {selectedApplicant && (
        <Modal
          isOpen={Boolean(selectedApplicant)}
          onClose={() => setSelectedApplicant(null)}
          title={selectedApplicant.applicantName}
          subtitle={`Candidate Dossier • ${selectedApplicant.jobTitle} • ${selectedApplicant.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Stage Progress Stepper */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-brand-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-brand-slate font-bold uppercase tracking-wider text-[10px]">
                  Pipeline Journey
                </span>
                <Badge variant={STAGE_CONFIG[selectedApplicant.stage]?.badgeVariant || 'neutral'}>
                  {selectedApplicant.stage}
                </Badge>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {STAGES.map((s, idx) => {
                  const currentIdx = STAGES.indexOf(selectedApplicant.stage);
                  const isCurrent = s === selectedApplicant.stage;
                  const isPassed = currentIdx > idx;

                  return (
                    <button
                      key={s}
                      onClick={() => handleStageChange(selectedApplicant.id, s)}
                      className={`py-1.5 px-1 rounded text-center text-[10px] font-bold transition-all border ${
                        isCurrent
                          ? 'bg-brand-red text-white border-brand-red shadow-glow-red-sm'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-brand-slate border-white/5 hover:border-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
              {selectedApplicant.candidateType === 'Intern PPO' && (
                <button
                  onClick={() => setDossierTab('internship')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    dossierTab === 'internship'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                  <span>🎓 Internship Credentials & PPO</span>
                </button>
              )}

              <button
                onClick={() => setDossierTab('profile')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  dossierTab === 'profile'
                    ? 'bg-brand-red text-white'
                    : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
                }`}
              >
                Profile & Qualifications
              </button>

              <button
                onClick={() => setDossierTab('scorecard')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  dossierTab === 'scorecard'
                    ? 'bg-brand-red text-white'
                    : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
                }`}
              >
                <span>Evaluations & Scorecard</span>
                {selectedApplicant.interviewNotes && (
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">
                    {selectedApplicant.interviewNotes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDossierTab('offer')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  dossierTab === 'offer'
                    ? 'bg-brand-red text-white'
                    : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Offer Package</span>
                {selectedApplicant.offerDetails && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {/* TAB: INTERNSHIP CREDENTIALS & CONVERSION */}
            {dossierTab === 'internship' && selectedApplicant.candidateType === 'Intern PPO' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Internship Lifecycle Record
                    </span>
                    <Badge variant="success">Completed on 30 Sep 2026</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Intern ID</span>
                      <span className="font-bold text-white">{selectedApplicant.internId || 'emp-021'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tenure Period</span>
                      <span className="font-bold text-white">01 Jul – 30 Sep 2026</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Capstone Score</span>
                      <span className="font-bold text-emerald-400">{selectedApplicant.technicalScore || 98} / 100</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mentor Signoff</span>
                      <span className="font-bold text-purple-300">
                        {selectedApplicant.internshipDetails?.mentorName || 'Siva Kumar & Niky Sharma'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      Mentor Recommendation & Review:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {selectedApplicant.internshipDetails?.recommendation ||
                        'Exceptional technical craftsmanship. Solved core enterprise modules and maintained perfect attendance.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      Conversion Status:{' '}
                      <strong className="text-emerald-400">
                        {selectedApplicant.convertedToEmployee ? 'Permanent Staff Active' : 'Eligible for PPO Promotion'}
                      </strong>
                    </span>

                    {!selectedApplicant.convertedToEmployee && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPromotionModal(selectedApplicant)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/30"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Promote to Permanent Employee</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROFILE & QUALIFICATIONS */}
            {dossierTab === 'profile' && (
              <div className="space-y-4 animate-fade-in">
                {/* Contact & Meta Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Email</span>
                    <span className="text-white font-medium truncate block">{selectedApplicant.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Phone</span>
                    <span className="text-white font-medium">{selectedApplicant.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Location</span>
                    <span className="text-white font-medium">{selectedApplicant.location || 'Pune Global HQ'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Notice Period</span>
                    <span className="text-emerald-400 font-bold">{selectedApplicant.noticePeriod || 'Immediate'}</span>
                  </div>
                </div>

                {/* Skills Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-brand-slate uppercase tracking-wider mb-2">
                    Verified Competencies & Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplicant.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-white/5"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compensation & Experience */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Expected Annual Compensation</span>
                    <span className="text-amber-400 font-black text-sm">
                      {selectedApplicant.expectedSalary || '₹15 LPA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Total Industry Experience</span>
                    <span className="text-white font-bold text-sm">
                      {selectedApplicant.candidateType === 'Intern PPO' ? '3 Months Internship' : `${selectedApplicant.experienceYears} Years`}
                    </span>
                  </div>
                </div>

                {/* Recruiter Notes */}
                {selectedApplicant.notes && (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Recruitment Notes:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedApplicant.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: EVALUATIONS & SCORECARD */}
            {dossierTab === 'scorecard' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-brand-slate uppercase tracking-wider">
                    Interview Panel Scorecards
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingInterviewNote(!isAddingInterviewNote)}
                    className="text-[11px] font-bold"
                  >
                    {isAddingInterviewNote ? 'Cancel' : '+ Add Evaluation'}
                  </Button>
                </div>

                {isAddingInterviewNote && (
                  <form onSubmit={handleAddInterviewNote} className="p-3.5 rounded-xl bg-slate-950 border border-brand-red/30 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Interview Round</label>
                        <select
                          value={newInterviewNote.stage}
                          onChange={(e) => setNewInterviewNote({ ...newInterviewNote, stage: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        >
                          <option value="Technical Round 1">Technical Round 1</option>
                          <option value="Architecture Review">Architecture Review</option>
                          <option value="HR & Culture Fit">HR & Culture Fit</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Interviewer Name</label>
                        <input
                          type="text"
                          required
                          value={newInterviewNote.interviewer}
                          onChange={(e) => setNewInterviewNote({ ...newInterviewNote, interviewer: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Score (0-100)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={newInterviewNote.score}
                          onChange={(e) => setNewInterviewNote({ ...newInterviewNote, score: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Evaluation Remarks & Observations</label>
                      <textarea
                        rows={2}
                        required
                        value={newInterviewNote.notes}
                        onChange={(e) => setNewInterviewNote({ ...newInterviewNote, notes: e.target.value })}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        placeholder="Detailed technical feedback..."
                      />
                    </div>

                    <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                      Save Scorecard
                    </Button>
                  </form>
                )}

                {/* Scorecards List */}
                <div className="space-y-2.5">
                  {selectedApplicant.interviewNotes?.map((note, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{note.stage}</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {note.score} / 100
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Evaluator: {note.interviewer}</span>
                        <span>•</span>
                        <span>{note.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{note.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: OFFER PACKAGE */}
            {dossierTab === 'offer' && (
              <div className="space-y-4 animate-fade-in">
                {selectedApplicant.offerDetails ? (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Official Employment Offer
                      </span>
                      <Badge variant="success">{selectedApplicant.offerDetails.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Offered CTC</span>
                        <span className="font-black text-amber-300 text-sm">
                          {selectedApplicant.offerDetails.salary}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Designation</span>
                        <span className="font-bold text-white">{selectedApplicant.offerDetails.designation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Joining Date</span>
                        <span className="font-bold text-white">{selectedApplicant.offerDetails.joiningDate}</span>
                      </div>
                    </div>

                    {selectedApplicant.candidateType === 'Intern PPO' && !selectedApplicant.convertedToEmployee && (
                      <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                        <span className="text-xs text-slate-300">
                          Offer accepted by candidate. Ready to convert to permanent employee.
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openPromotionModal(selectedApplicant)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Promote to Permanent Employee
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveOffer} className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Draft & Dispatch Official Offer Letter
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Offered Compensation (CTC)</label>
                        <input
                          type="text"
                          required
                          value={offerDraft.salary}
                          onChange={(e) => setOfferDraft({ ...offerDraft, salary: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Offered Designation</label>
                        <input
                          type="text"
                          required
                          value={offerDraft.designation}
                          onChange={(e) => setOfferDraft({ ...offerDraft, designation: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Proposed Joining Date</label>
                        <input
                          type="date"
                          required
                          value={offerDraft.joiningDate}
                          onChange={(e) => setOfferDraft({ ...offerDraft, joiningDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>

                    <Button type="submit" variant="primary" size="sm" className="w-full font-bold text-xs mt-2">
                      Dispatch Official Offer Letter & Move to Offer Sent
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Dossier Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDeleteApplicant(selectedApplicant.id, selectedApplicant.applicantName)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Candidate</span>
              </button>

              <Button variant="outline" size="sm" onClick={() => setSelectedApplicant(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADD CANDIDATE MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isAddCandidateOpen && (
        <Modal
          isOpen={isAddCandidateOpen}
          onClose={() => setIsAddCandidateOpen(false)}
          title="Add Candidate to Recruitment Pipeline"
          subtitle="Intake candidate for active screening or PPO conversion"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCandidate} className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Candidate Type</label>
                <select
                  value={candidateFormData.candidateType}
                  onChange={(e) =>
                    setCandidateFormData({
                      ...candidateFormData,
                      candidateType: e.target.value as 'Lateral Hire' | 'Intern PPO',
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                >
                  <option value="Lateral Hire">💼 Lateral Professional</option>
                  <option value="Intern PPO">🎓 Intern PPO Conversion</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Requisition</label>
                <select
                  value={candidateFormData.jobId}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, jobId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={candidateFormData.applicantName}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, applicantName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={candidateFormData.email}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={candidateFormData.phone}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                  placeholder="+91 98..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={candidateFormData.experienceYears}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, experienceYears: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Initial Pipeline Stage</label>
                <select
                  value={candidateFormData.stage}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, stage: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Primary Skills (comma separated)</label>
              <input
                type="text"
                value={candidateFormData.skills}
                onChange={(e) => setCandidateFormData({ ...candidateFormData, skills: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                placeholder="React, TypeScript, Node.js, Docker"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddCandidateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold text-xs">
                Add Candidate
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PUBLISH JOB OPENING MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isAddJobOpen && (
        <Modal
          isOpen={isAddJobOpen}
          onClose={() => setIsAddJobOpen(false)}
          title="Publish Job Requisition"
          subtitle="Open new recruitment requisition for enterprise hiring"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateJob} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Job Title</label>
              <input
                type="text"
                required
                value={jobFormData.title}
                onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                placeholder="e.g. Senior Backend Systems Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Department</label>
                <select
                  value={jobFormData.department}
                  onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                >
                  <option value="IT & Engineering">IT & Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Open Positions</label>
                <input
                  type="number"
                  min="1"
                  value={jobFormData.openPositions}
                  onChange={(e) => setJobFormData({ ...jobFormData, openPositions: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Salary Range</label>
                <input
                  type="text"
                  value={jobFormData.salaryRange}
                  onChange={(e) => setJobFormData({ ...jobFormData, salaryRange: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddJobOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold text-xs">
                Publish Requisition
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
