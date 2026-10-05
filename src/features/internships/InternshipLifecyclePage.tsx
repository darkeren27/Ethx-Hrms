import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  FileCheck,
  Award,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
  FileText,
  SlidersHorizontal,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Send,
  RotateCcw,
  Check,
  X,
  Shield,
  Briefcase,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { hrmsService } from '../../services/hrmsService';
import {
  Employee,
  InternshipLifecycleRecord,
  InternEvaluationRecord,
  ManagementDecisionRecord,
  EmploymentOfferRecord,
  EvaluationWorkflowStatus,
  ManagementDecisionOption,
  OfferWorkflowStatus,
  InternshipDateState,
  InternshipAdministrativeOutcome
} from '../../types/hrms';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const InternshipLifecyclePage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lifecycles, setLifecycles] = useState<InternshipLifecycleRecord[]>([]);
  const [evaluations, setEvaluations] = useState<InternEvaluationRecord[]>([]);
  const [decisions, setDecisions] = useState<ManagementDecisionRecord[]>([]);
  const [offers, setOffers] = useState<EmploymentOfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDateState, setFilterDateState] = useState<string>('All');
  const [filterEvalStatus, setFilterEvalStatus] = useState<string>('All');
  const [filterDecision, setFilterDecision] = useState<string>('All');
  const [filterOfferStatus, setFilterOfferStatus] = useState<string>('All');

  // Modal / Drawer states
  const [evalModalInternId, setEvalModalInternId] = useState<string | null>(null);
  const [decisionModalInternId, setDecisionModalInternId] = useState<string | null>(null);
  const [offerModalInternId, setOfferModalInternId] = useState<string | null>(null);
  const [lifecycleModalInternId, setLifecycleModalInternId] = useState<string | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [emps, lcs, evs, dcs, ofs] = await Promise.all([
        hrmsService.getEmployees(),
        hrmsService.getInternshipLifecycles(),
        hrmsService.getInternEvaluations(),
        hrmsService.getManagementDecisions(),
        hrmsService.getEmploymentOffers(),
      ]);
      setEmployees(emps);
      setLifecycles(lcs);
      setEvaluations(evs);
      setDecisions(dcs);
      setOffers(ofs);
    } catch (err) {
      console.error('Failed to load internship cohort data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter 8 Confirmed Interns
  const internCohort = useMemo(() => {
    return employees.filter(
      (e) => e.engagementCategory === 'Intern' || e.internshipDetails != null
    );
  }, [employees]);

  // Filtered view
  const filteredInterns = useMemo(() => {
    return internCohort.filter((intern) => {
      const lc = lifecycles.find((l) => l.internId === intern.id);
      const ev = evaluations.find((e) => e.internId === intern.id);
      const dc = decisions.find((d) => d.internId === intern.id);
      const ofr = offers.find((o) => o.internId === intern.id);

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = intern.fullName.toLowerCase().includes(q);
        const matchesId = intern.employeeId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      if (filterDateState !== 'All' && lc && lc.dateState !== filterDateState) {
        return false;
      }
      if (filterEvalStatus !== 'All' && ev && ev.workflowStatus !== filterEvalStatus) {
        return false;
      }
      if (filterDecision !== 'All' && dc && dc.decision !== filterDecision) {
        return false;
      }
      if (filterOfferStatus !== 'All' && ofr && ofr.status !== filterOfferStatus) {
        return false;
      }

      return true;
    });
  }, [internCohort, lifecycles, evaluations, decisions, offers, search, filterDateState, filterEvalStatus, filterDecision, filterOfferStatus]);

  // Cohort Metrics
  const originalCohortCount = 8;
  const currentInternCount = employees.filter((e) => e.engagementCategory === 'Intern').length;
  const evalsPending = evaluations.filter((e) => e.workflowStatus === 'Not Started' || e.workflowStatus === 'In Progress').length;
  const evalsSubmitted = evaluations.filter((e) => e.workflowStatus === 'Submitted').length;
  const evalsReviewed = evaluations.filter((e) => e.workflowStatus === 'Reviewed').length;
  const recommendedForEmployment = decisions.filter((d) => d.decision === 'Recommended for permanent employment' || d.decision === 'Approved for offer preparation').length;
  const offersApprovedOrAccepted = offers.filter((o) => o.status === 'Approved' || o.status === 'Issued' || o.status === 'Accepted').length;
  const joiningPending = offers.filter((o) => o.status === 'Accepted').length;
  const completedConversions = employees.filter((e) => e.conversionDetails?.permanentEmploymentActive === true).length;
  const extendedInternships = lifecycles.filter((l) => l.administrativeOutcome === 'Extended').length;
  const earlyExits = lifecycles.filter((l) => l.administrativeOutcome === 'Early exit').length;

  // Selected intern for evaluation
  const activeEvalIntern = internCohort.find((i) => i.id === evalModalInternId);
  const activeEvalRecord = evaluations.find((e) => e.internId === evalModalInternId);

  // Selected intern for decision
  const activeDecisionIntern = internCohort.find((i) => i.id === decisionModalInternId);
  const activeDecisionRecord = decisions.find((d) => d.internId === decisionModalInternId);
  const activeDecisionEval = evaluations.find((e) => e.internId === decisionModalInternId);

  // Selected intern for offer
  const activeOfferIntern = internCohort.find((i) => i.id === offerModalInternId);
  const activeOfferRecord = offers.find((o) => o.internId === offerModalInternId);
  const activeOfferDecision = decisions.find((d) => d.internId === offerModalInternId);

  // Selected intern for lifecycle action
  const activeLifecycleIntern = internCohort.find((i) => i.id === lifecycleModalInternId);
  const activeLifecycleRecord = lifecycles.find((l) => l.internId === lifecycleModalInternId);

  // Evaluation Form State
  const [evalReviewer, setEvalReviewer] = useState('');
  const [evalApprover, setEvalApprover] = useState('');
  const [evalScores, setEvalScores] = useState<Record<string, number | null>>({});
  const [evalStrengths, setEvalStrengths] = useState('');
  const [evalImprovements, setEvalImprovements] = useState('');
  const [evalRecommendation, setEvalRecommendation] = useState<string>('Undecided');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);

  // Decision Form State
  const [selectedDecision, setSelectedDecision] = useState<ManagementDecisionOption>('Pending decision');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [decisionActor, setDecisionActor] = useState('');

  // Offer Form State
  const [offerDesignation, setOfferDesignation] = useState('');
  const [offerDepartment, setOfferDepartment] = useState('');
  const [offerReportingManager, setOfferReportingManager] = useState('');
  const [offerEmploymentArrangement, setOfferEmploymentArrangement] = useState('');
  const [offerJoiningDate, setOfferJoiningDate] = useState('2026-10-01');
  const [offerSalary, setOfferSalary] = useState<string>('');
  const [offerLocation, setOfferLocation] = useState('');
  const [offerProbation, setOfferProbation] = useState('');
  const [offerStatusSelect, setOfferStatusSelect] = useState<OfferWorkflowStatus>('Draft');

  // Lifecycle Action State
  const [lifecycleActionType, setLifecycleActionType] = useState<'extend' | 'early_exit' | 'complete'>('extend');
  const [lifecycleNewEndDate, setLifecycleNewEndDate] = useState('2026-10-31');
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [lifecycleActor, setLifecycleActor] = useState(user?.name || 'Niky Sharma');

  // Open Evaluation Drawer
  const handleOpenEvaluation = (internId: string) => {
    const ev = evaluations.find((e) => e.internId === internId);
    if (ev) {
      setEvalReviewer(
        ev.assignedReviewer && ev.assignedReviewer !== 'Not assigned' ? ev.assignedReviewer : ''
      );
      setEvalApprover(
        ev.assignedApprover && ev.assignedApprover !== 'Not assigned' ? ev.assignedApprover : ''
      );
      const scoreMap: Record<string, number | null> = {};
      (ev.criteria || []).forEach((c) => {
        scoreMap[c.id] = c.score;
      });
      setEvalScores(scoreMap);
      setEvalStrengths(
        ev.strengths && ev.strengths !== 'Not provided' ? ev.strengths : ''
      );
      setEvalImprovements(
        ev.improvementAreas && ev.improvementAreas !== 'Not provided' ? ev.improvementAreas : ''
      );
      setEvalRecommendation(ev.overallRecommendation || 'Undecided');
      setEvalRemarks(
        ev.decisionRemarks && ev.decisionRemarks !== 'Not provided' ? ev.decisionRemarks : ''
      );
    } else {
      setEvalReviewer('');
      setEvalApprover('');
      setEvalScores({});
      setEvalStrengths('');
      setEvalImprovements('');
      setEvalRecommendation('Undecided');
      setEvalRemarks('');
    }
    setShowReturnInput(false);
    setReturnReason('');
    setEvalModalInternId(internId);
  };

  // Open Decision Drawer
  const handleOpenDecision = (internId: string) => {
    const dc = decisions.find((d) => d.internId === internId);
    if (dc) {
      setSelectedDecision(dc.decision || 'Pending decision');
      setDecisionRemarks(
        dc.decisionRemarks && dc.decisionRemarks !== 'Pending management evaluation review'
          ? dc.decisionRemarks
          : ''
      );
      setDecisionActor(
        dc.decidedBy && dc.decidedBy !== 'Not assigned' ? dc.decidedBy : user?.name || 'Company Directors'
      );
    } else {
      setSelectedDecision('Pending decision');
      setDecisionRemarks('');
      setDecisionActor(user?.name || 'Company Directors');
    }
    setDecisionModalInternId(internId);
  };

  // Open Offer Drawer
  const handleOpenOffer = (internId: string) => {
    const ofr = offers.find((o) => o.internId === internId);
    if (ofr) {
      setOfferDesignation(ofr.terms.designation === 'Not provided' ? 'Junior Software Engineer' : ofr.terms.designation);
      setOfferDepartment(ofr.terms.department === 'Not provided' ? 'Engineering' : ofr.terms.department);
      setOfferReportingManager(ofr.terms.reportingManager === 'Not provided' ? 'Siva Kumar' : ofr.terms.reportingManager);
      setOfferEmploymentArrangement(ofr.terms.employmentArrangement === 'Not provided' ? 'Full-Time Regular' : ofr.terms.employmentArrangement);
      setOfferJoiningDate(ofr.terms.actualJoiningDate === 'Not provided' ? '2026-10-01' : ofr.terms.actualJoiningDate);
      setOfferSalary(ofr.terms.baseSalary != null ? String(ofr.terms.baseSalary) : '450000');
      setOfferLocation(ofr.terms.workLocation === 'Not provided' ? 'Pune Global HQ' : ofr.terms.workLocation);
      setOfferProbation(ofr.terms.probationPeriod === 'Not provided' ? '3 Months' : ofr.terms.probationPeriod);
      setOfferStatusSelect(ofr.status);
    }
    setOfferModalInternId(internId);
  };

  // Open Lifecycle Action Drawer
  const handleOpenLifecycleAction = (internId: string) => {
    setLifecycleModalInternId(internId);
    setLifecycleReason('');
  };

  // Calculate live score in evaluation modal
  const computedEvalScore = useMemo(() => {
    if (!activeEvalRecord) return null;
    let totalScore = 0;
    let scoredCriteriaCount = 0;
    let totalWeight = 0;

    activeEvalRecord.criteria.forEach((c) => {
      const score = evalScores[c.id];
      if (score != null) {
        totalScore += (score / 5) * 100 * (c.weight / 100);
        totalWeight += c.weight;
        scoredCriteriaCount++;
      }
    });

    if (scoredCriteriaCount === 0 || totalWeight === 0) return null;
    // Normalize if only some are filled
    const normalized = Math.round((totalScore / totalWeight) * 100);
    return {
      score: normalized,
      completed: scoredCriteriaCount === activeEvalRecord.criteria.length,
      scoredCount: scoredCriteriaCount,
      totalCount: activeEvalRecord.criteria.length
    };
  }, [evalScores, activeEvalRecord]);

  // Save Draft Evaluation
  const handleSaveEvaluationDraft = async (status: EvaluationWorkflowStatus = 'In Progress') => {
    if (!activeEvalRecord || !evalModalInternId) return;

    try {
      const updatedCriteria = (activeEvalRecord.criteria || []).map((c) => ({
        ...c,
        score: evalScores[c.id] ?? null,
      }));

      const finalScore = computedEvalScore?.completed ? computedEvalScore.score : null;

      const reviewerVal = (evalReviewer || '').trim() || 'Not assigned';
      const approverVal = (evalApprover || '').trim() || 'Not assigned';
      const strengthsVal = (evalStrengths || '').trim() || 'Not provided';
      const improvementsVal = (evalImprovements || '').trim() || 'Not provided';
      const remarksVal = (evalRemarks || '').trim() || 'Not provided';
      const recommendationVal = (evalRecommendation || 'Undecided') as any;

      const payload: Partial<InternEvaluationRecord> = {
        assignedReviewer: reviewerVal,
        assignedApprover: approverVal,
        criteria: updatedCriteria,
        calculatedScore: finalScore,
        strengths: strengthsVal,
        improvementAreas: improvementsVal,
        overallRecommendation: recommendationVal,
        decisionRemarks: remarksVal,
        status: status,
        workflowStatus: status,
        isDraftPrivate: status === 'In Progress',
        ...(status === 'Submitted' ? { submissionDate: new Date().toISOString().split('T')[0] } : {}),
        ...(status === 'Reviewed' ? { approvalDate: new Date().toISOString().split('T')[0] } : {}),
      };

      const res = await hrmsService.updateInternEvaluation(activeEvalRecord.id, payload);
      if (res) {
        // Optimistically update local evaluation state immediately so table & KPIs update reactively
        setEvaluations((prev) =>
          prev.map((e) => (e.id === activeEvalRecord.id ? { ...e, ...payload, ...res } : e))
        );
        showToast(`Evaluation saved for ${activeEvalIntern?.fullName || 'Intern'} (${status})`);
        setEvalModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Failed to save evaluation:', err);
      showToast(`Error: ${err?.message || 'Failed to save evaluation'}`);
    }
  };

  // Return Evaluation for revision
  const handleReturnEvaluation = async () => {
    if (!activeEvalRecord || !returnReason.trim()) return;
    try {
      const res = await hrmsService.returnEvaluationForRevision(
        activeEvalRecord.id,
        user?.name || 'HR Management',
        returnReason.trim(),
        'Returned for reviewer revision'
      );
      if (res) {
        setEvaluations((prev) =>
          prev.map((e) => (e.id === activeEvalRecord.id ? { ...e, ...res } : e))
        );
        showToast(`Evaluation returned to In Progress for revision.`);
        setEvalModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Failed to return evaluation:', err);
      showToast(`Error: ${err?.message || 'Failed to return evaluation'}`);
    }
  };

  // Save Management Decision
  const handleSaveDecision = async () => {
    if (!activeDecisionIntern) return;
    try {
      const res = await hrmsService.recordManagementDecision(
        activeDecisionIntern.id,
        selectedDecision,
        (decisionRemarks || '').trim() || 'Recorded by management',
        (decisionActor || '').trim() || user?.name || 'HR Executive'
      );
      if (res) {
        setDecisions((prev) => {
          const idx = prev.findIndex((d) => d.internId === activeDecisionIntern.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...res };
            return next;
          }
          return [...prev, res];
        });
        showToast(`Management decision recorded: ${selectedDecision}`);
        setDecisionModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Failed to save decision:', err);
      showToast(`Error: ${err?.message || 'Failed to record decision'}`);
    }
  };

  // Save Offer Terms & Update Offer Workflow
  const handleSaveOfferTerms = async () => {
    if (!activeOfferRecord || !activeOfferIntern) return;

    try {
      const updatedTerms = {
        legalEmployer: 'ETHXSOFTCON Technologies Pvt Ltd',
        designation: (offerDesignation || '').trim() || 'Not provided',
        department: (offerDepartment || '').trim() || 'Not provided',
        reportingManager: (offerReportingManager || '').trim() || 'Not provided',
        employmentArrangement: (offerEmploymentArrangement || '').trim() || 'Not provided',
        proposedJoiningDate: offerJoiningDate || '2026-10-01',
        actualJoiningDate: offerJoiningDate || 'Not provided',
        approvedSalary: offerSalary ? parseFloat(offerSalary) : null,
        baseSalary: offerSalary ? parseFloat(offerSalary) : null,
        workLocation: (offerLocation || '').trim() || 'Not provided',
        probationTerms: (offerProbation || '').trim() || 'Not provided',
        probationPeriod: (offerProbation || '').trim() || 'Not provided',
      };

      const payload: Partial<EmploymentOfferRecord> = {
        terms: updatedTerms,
        status: offerStatusSelect,
        offerStatus: offerStatusSelect,
        ...(offerStatusSelect === 'Approved' ? { approvedBy: user?.name || 'Company Directors', approvalDate: new Date().toISOString().split('T')[0] } : {}),
        ...(offerStatusSelect === 'Issued' ? { issuedDate: new Date().toISOString().split('T')[0] } : {}),
      };

      const res = await hrmsService.updateEmploymentOffer(activeOfferRecord.id, payload);

      if (res) {
        setOffers((prev) =>
          prev.map((o) => (o.id === activeOfferRecord.id ? { ...o, ...payload, ...res } : o))
        );
        showToast(`Employment terms updated for ${activeOfferIntern.fullName} (${offerStatusSelect})`);
        setOfferModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Failed to update offer:', err);
      showToast(`Error: ${err?.message || 'Failed to update offer'}`);
    }
  };

  // Candidate Response Action (Accept / Reject)
  const handleCandidateResponse = async (status: 'Accepted' | 'Rejected') => {
    if (!activeOfferRecord || !activeOfferIntern) return;
    try {
      const res = await hrmsService.recordOfferResponse(
        activeOfferRecord.id,
        status,
        activeOfferRecord.terms.actualJoiningDate || undefined,
        user?.name || 'Authorized HR'
      );
      if (res) {
        setOffers((prev) =>
          prev.map((o) => (o.id === activeOfferRecord.id ? { ...o, ...res } : o))
        );
        showToast(`Offer response recorded: ${status}`);
        setOfferModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Failed to record response:', err);
      showToast(`Error: ${err?.message || 'Failed to record response'}`);
    }
  };

  // Activate Permanent Employment (Authorized Conversion)
  const handleActivateConversion = async () => {
    if (!activeOfferRecord || !activeOfferIntern) return;

    const res = await hrmsService.activatePermanentEmployment(
      activeOfferRecord.id,
      user?.name || 'HR Management'
    );

    if (res) {
      showToast(`Permanent employment activated for ${activeOfferIntern.fullName}! Person ID preserved.`);
      setOfferModalInternId(null);
      loadAllData();
    }
  };

  // Lifecycle Actions Submit (Extend / Early Exit / Complete)
  const handleExecuteLifecycleAction = async () => {
    if (!activeLifecycleIntern) return;

    if (lifecycleActionType === 'extend') {
      const res = await hrmsService.recordInternshipExtension(
        activeLifecycleIntern.id,
        lifecycleNewEndDate,
        lifecycleReason || 'Internship extension approved by management',
        lifecycleActor
      );
      if (res) showToast(`Internship extended to ${lifecycleNewEndDate}`);
    } else if (lifecycleActionType === 'early_exit') {
      const res = await hrmsService.recordInternshipEarlyExit(
        activeLifecycleIntern.id,
        new Date().toISOString().split('T')[0],
        lifecycleReason || 'Approved early exit',
        lifecycleActor
      );
      if (res) showToast(`Early exit recorded.`);
    } else {
      const res = await hrmsService.recordInternshipCompletion(
        activeLifecycleIntern.id,
        lifecycleReason || 'Internship period successfully concluded',
        lifecycleActor
      );
      if (res) showToast(`Internship marked as completed.`);
    }

    setLifecycleModalInternId(null);
    loadAllData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-card via-brand-card-hover to-brand-card border border-brand-border/80 shadow-card-dark relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial-gradient pointer-events-none opacity-60" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/25 text-brand-red text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              CONFIRMED PERSONNEL ROSTER: COHORT GOVERNANCE
            </span>
            <span className="text-xs text-brand-slate font-medium hidden sm:inline-block">
              Window: <span className="text-brand-ink font-semibold">1 July 2026 – 30 September 2026 (Inclusive)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-slate/80 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-red" />
              Timezone: IST (Asia/Kolkata)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-red' : ''}`} />
              Sync Roster
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-ink tracking-tight flex items-center gap-2.5">
              Internship Evaluation & Employment Conversion
            </h1>
            <p className="text-xs sm:text-sm text-brand-slate mt-1 max-w-3xl leading-relaxed">
              Managing the 8 confirmed unpaid interns with strict governance: zero stipend validation, excluded from salary payroll, rubric-based performance scoring, management decision gates, and controlled permanent employment activation from October 2026 onward.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/employees">
              <Button variant="secondary" size="sm" className="hover:border-brand-red/40">
                Directory Roster ({employees.length})
              </Button>
            </Link>
          </div>
        </div>

        {/* Cohort Rule Safeguard Notice */}
        <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Architectural Boundary Enforcement:</span> Reaching 30 September 2026 does not automatically pass evaluations, approve permanent employment, or activate salary payroll. A recommendation is not an approval, and an accepted offer remains <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">Offer Accepted — Joining Pending</code> until its effective start date. Original person identity is strictly preserved.
          </div>
        </div>
      </div>

      {/* Cohort Dynamic Governance Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Original 2026 Cohort"
          value={String(originalCohortCount)}
          subtitle="Fixed 8 Interns Roster"
          icon={GraduationCap}
          variant="red"
        />
        <StatCard
          title="Evaluations Pending"
          value={String(evalsPending)}
          subtitle={`${evalsSubmitted} Submitted • ${evalsReviewed} Reviewed`}
          icon={Clock3}
        />
        <StatCard
          title="Recommended / Prep"
          value={String(recommendedForEmployment)}
          subtitle="Management Approved"
          icon={UserCheck}
        />
        <StatCard
          title="Offers In-Flight"
          value={String(offersApprovedOrAccepted)}
          subtitle={`${joiningPending} Accepted (Joining Pending)`}
          icon={FileCheck}
        />
        <StatCard
          title="Permanent Active"
          value={String(completedConversions)}
          subtitle="Converted Employees"
          icon={Award}
          variant="emerald"
        />
        <StatCard
          title="Extensions / Exits"
          value={`${extendedInternships} / ${earlyExits}`}
          subtitle="Audited Exceptions"
          icon={AlertTriangle}
        />
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-brand-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search intern name (e.g. Utkarsh, Krishna, Sayali)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div>
            <select
              value={filterEvalStatus}
              onChange={(e) => setFilterEvalStatus(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Evaluation: All States</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>

          <div>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Decision: All Decisions</option>
              <option value="Pending decision">Pending decision</option>
              <option value="Recommended for permanent employment">Recommended for Employment</option>
              <option value="Approved for offer preparation">Approved for Offer Prep</option>
              <option value="Internship extension proposed">Extension Proposed</option>
              <option value="Not selected for permanent employment">Not Selected</option>
              <option value="Decision deferred">Decision Deferred</option>
            </select>
          </div>

          <div>
            <select
              value={filterOfferStatus}
              onChange={(e) => setFilterOfferStatus(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Offer: All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Prepared">Prepared</option>
              <option value="Approved">Approved</option>
              <option value="Issued">Issued</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cohort Master Registry Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-brand-dark-subtle/60 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-ink">
              Confirmed 8 Unpaid Interns Master Registry
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold">
              {filteredInterns.length} Records
            </span>
          </div>
          <span className="text-xs text-brand-slate font-medium">
            Compensation: Unpaid (Stipend ₹0) • Excluded from Salary Payroll
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark-subtle/80 border-b border-brand-border/80 text-brand-slate uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Intern Identity</th>
                <th className="py-3.5 px-4">Internship Window</th>
                <th className="py-3.5 px-4">Lifecycle State</th>
                <th className="py-3.5 px-4">Evaluation</th>
                <th className="py-3.5 px-4">Management Decision</th>
                <th className="py-3.5 px-4">Offer / Terms</th>
                <th className="py-3.5 px-4">Employment State</th>
                <th className="py-3.5 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInterns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-brand-slate">
                    No interns found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInterns.map((intern) => {
                  const lc = lifecycles.find((l) => l.internId === intern.id);
                  const ev = evaluations.find((e) => e.internId === intern.id);
                  const dc = decisions.find((d) => d.internId === intern.id);
                  const ofr = offers.find((o) => o.internId === intern.id);
                  const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;

                  // Label resolution
                  let lifecycleLabel = 'Unpaid Intern';
                  if (isConverted) {
                    lifecycleLabel = 'Permanent Employment Active';
                  } else if (ofr?.status === 'Accepted') {
                    lifecycleLabel = 'Offer Accepted — Joining Pending';
                  } else if (ofr?.status === 'Approved' || ofr?.status === 'Issued') {
                    lifecycleLabel = 'Offer Approved';
                  } else if (dc?.decision === 'Recommended for permanent employment') {
                    lifecycleLabel = 'Recommended for Employment';
                  } else if (ev?.workflowStatus === 'Not Started' || ev?.workflowStatus === 'In Progress') {
                    lifecycleLabel = 'Evaluation Pending';
                  } else if (lc?.administrativeOutcome === 'Completed' && !isConverted) {
                    lifecycleLabel = 'Internship Completed — Not Converted';
                  }

                  return (
                    <tr
                      key={intern.id}
                      className="hover:bg-brand-card-hover/70 transition-colors group"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={intern.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={intern.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <Link
                              to={`/employees/${intern.id}`}
                              className="font-bold text-brand-ink group-hover:text-brand-red transition-colors flex items-center gap-1"
                            >
                              {intern.fullName}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-brand-slate">{intern.employeeId}</span>
                              <span className="text-[10px] text-brand-slate">•</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Stipend: ₹0</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Internship Window */}
                      <td className="py-3.5 px-4">
                        <div className="text-brand-ink font-medium">
                          1 Jul 2026 – 30 Sep 2026
                        </div>
                        <span className="text-[10px] text-brand-slate block">
                          Inclusive • Excluded from Payroll
                        </span>
                      </td>

                      {/* Lifecycle State */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Badge variant="neutral" dot>
                            {lc?.dateState || 'Within internship period'}
                          </Badge>
                          <span className="text-[10px] text-brand-slate block">
                            Outcome: <span className="font-semibold text-brand-ink">{lc?.administrativeOutcome || 'Completion pending'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Evaluation */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              ev?.workflowStatus === 'Reviewed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : ev?.workflowStatus === 'Submitted'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : ev?.workflowStatus === 'In Progress'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            {ev?.workflowStatus || 'Not Started'}
                          </span>
                          {ev?.calculatedScore != null ? (
                            <span className="text-[11px] font-bold text-brand-ink block">
                              Score: {ev.calculatedScore}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand-slate block italic">
                              Score: Not graded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Decision */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold max-w-[170px] truncate ${
                              dc?.decision === 'Approved for offer preparation'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : dc?.decision === 'Recommended for permanent employment'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : dc?.decision === 'Not selected for permanent employment'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : dc?.decision === 'Decision deferred'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                            title={dc?.decision}
                          >
                            {dc?.decision || 'Pending decision'}
                          </span>
                          <span className="text-[10px] text-brand-slate block truncate max-w-[170px]">
                            By: {dc?.decidedBy || 'Not assigned'}
                          </span>
                        </div>
                      </td>

                      {/* Offer / Terms */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              ofr?.status === 'Accepted'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : ofr?.status === 'Approved' || ofr?.status === 'Issued'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                : ofr?.status === 'Rejected'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            {ofr?.status || 'Draft'}
                          </span>
                          <span className="text-[10px] text-brand-slate block">
                            Joining: {ofr?.terms.actualJoiningDate || 'Not provided'}
                          </span>
                        </div>
                      </td>

                      {/* Dynamic Calculated Master Label */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            isConverted
                              ? 'success'
                              : ofr?.status === 'Accepted'
                              ? 'warning'
                              : dc?.decision === 'Recommended for permanent employment'
                              ? 'info'
                              : 'neutral'
                          }
                          dot
                        >
                          {lifecycleLabel}
                        </Badge>
                      </td>

                      {/* Actions Group */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] h-7 px-2"
                            onClick={() => handleOpenEvaluation(intern.id)}
                            title="Open Performance Evaluation Rubric"
                          >
                            <Edit3 className="w-3 h-3 mr-1 text-brand-red" />
                            Evaluate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-7 px-2"
                            onClick={() => handleOpenDecision(intern.id)}
                            title="Record Management Decision"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1 text-blue-400" />
                            Decision
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-7 px-2"
                            onClick={() => handleOpenOffer(intern.id)}
                            title="Manage Terms & Conversion"
                          >
                            <FileText className="w-3 h-3 mr-1 text-emerald-400" />
                            Offer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] h-7 px-1.5 text-brand-slate hover:text-white"
                            onClick={() => handleOpenLifecycleAction(intern.id)}
                            title="Extend, Complete, or Exit"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: PERFORMANCE EVALUATION RUBRIC DRAWER */}
      {/* ========================================================================= */}
      {evalModalInternId && activeEvalIntern && activeEvalRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-brand-red/30 shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 bg-brand-card-hover border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-red/15 border border-brand-red/30 flex items-center justify-center text-brand-red">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink">
                    Internship Evaluation: {activeEvalIntern.fullName}
                  </h3>
                  <p className="text-xs text-brand-slate">
                    ID: {activeEvalIntern.employeeId} • Period: 1 Jul – 30 Sep 2026 • 7 Configured Criteria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEvalModalInternId(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-slate hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Reviewer & Approver Explicit Assignment */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Assigned Reviewer <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={evalReviewer}
                    onChange={(e) => setEvalReviewer(e.target.value)}
                    placeholder="e.g. Siva Kumar / Niky Sharma (Explicit assignment)"
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                  />
                  <span className="text-[10px] text-brand-slate mt-1 block">
                    Reviewers are assigned explicitly, not inferred from title.
                  </span>
                </div>
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Assigned Approver <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={evalApprover}
                    onChange={(e) => setEvalApprover(e.target.value)}
                    placeholder="e.g. Ram Chaturvedi / Company Directors"
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                  />
                  <span className="text-[10px] text-brand-slate mt-1 block">
                    Final authority for evaluation sign-off.
                  </span>
                </div>
              </div>

              {/* Live Rubric Score Indicator */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-brand-red/10 via-brand-card to-brand-card border border-brand-red/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red block">
                    Calculated Advisory Rubric Score
                  </span>
                  <p className="text-xs text-brand-slate mt-0.5">
                    Missing ratings are not counted as zero. Final score calculated only when all required criteria are complete.
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-brand-ink">
                      {computedEvalScore ? `${computedEvalScore.score}%` : 'Incomplete'}
                    </span>
                    <span className="text-[10px] text-brand-slate block">
                      {computedEvalScore
                        ? `${computedEvalScore.scoredCount} of ${computedEvalScore.totalCount} graded`
                        : '0 of 7 graded'}
                    </span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${computedEvalScore?.completed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                </div>
              </div>

              {/* 7 Criteria Evaluation Form */}
              <div className="space-y-3">
                <h4 className="font-bold text-brand-ink text-xs uppercase tracking-wider">
                  Assessment Criteria (1 to 5 Rating Scale)
                </h4>
                {activeEvalRecord.criteria.map((c) => {
                  const currentScore = evalScores[c.id];
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-brand-card-hover border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-brand-ink">{c.label || c.name}</h5>
                          <span className="text-[10px] font-mono text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded">
                            Weight: {c.weight}%
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-slate mt-0.5">{c.description || c.feedback || 'Configured rubric benchmark'}</p>
                      </div>

                      {/* 1 to 5 Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setEvalScores((prev) => ({
                                ...prev,
                                [c.id]: prev[c.id] === star ? null : star,
                              }))
                            }
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                              currentScore === star
                                ? 'bg-brand-red text-white shadow-glow-red-sm ring-1 ring-brand-red'
                                : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
                            }`}
                          >
                            {star}
                          </button>
                        ))}
                        {currentScore != null && (
                          <button
                            type="button"
                            onClick={() =>
                              setEvalScores((prev) => ({ ...prev, [c.id]: null }))
                            }
                            className="text-[10px] text-brand-slate hover:text-brand-red ml-1"
                            title="Clear rating"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Written Feedback, Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Key Strengths Observed
                  </label>
                  <textarea
                    rows={3}
                    value={evalStrengths}
                    onChange={(e) => setEvalStrengths(e.target.value)}
                    placeholder="Specific technical, analytical, or teamwork highlights..."
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                  />
                </div>
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Areas for Growth & Improvement
                  </label>
                  <textarea
                    rows={3}
                    value={evalImprovements}
                    onChange={(e) => setEvalImprovements(e.target.value)}
                    placeholder="Specific functional guidance, code architecture, or domain gaps..."
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                  />
                </div>
              </div>

              {/* Overall Recommendation & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Overall Reviewer Recommendation (Advisory Only)
                  </label>
                  <select
                    value={evalRecommendation}
                    onChange={(e) => setEvalRecommendation(e.target.value)}
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                  >
                    <option value="Undecided">Undecided / Review Pending</option>
                    <option value="Recommended for permanent employment">
                      Recommended for Permanent Employment
                    </option>
                    <option value="Internship extension proposed">
                      Internship Extension Proposed
                    </option>
                    <option value="Not recommended">Not Recommended</option>
                  </select>
                  <span className="text-[10px] text-brand-slate mt-1 block">
                    Advisory recommendation does not automatically approve an offer.
                  </span>
                </div>
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Supporting Remarks / Evidence
                  </label>
                  <input
                    type="text"
                    value={evalRemarks}
                    onChange={(e) => setEvalRemarks(e.target.value)}
                    placeholder="Task tickets, PR reviews, or project milestones..."
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Revision History & Return Drawer */}
              {activeEvalRecord.history && activeEvalRecord.history.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <h5 className="font-bold text-brand-ink text-xs">Evaluation Audit & Revision History</h5>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {activeEvalRecord.history.map((h, i) => (
                      <div key={i} className="text-[11px] text-brand-slate flex items-start gap-2">
                        <span className="font-mono text-brand-red">• {h.timestamp}:</span>
                        <span>
                          <strong className="text-brand-ink">{h.actor}</strong> changed status from{' '}
                          <code className="bg-black/30 px-1 rounded">{h.fromStatus}</code> to{' '}
                          <code className="bg-black/30 px-1 rounded">{h.toStatus}</code>
                          {h.reason && ` — "${h.reason}"`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Return for revision box */}
              {showReturnInput && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <h5 className="font-bold text-amber-300 text-xs">Return Evaluation for Revision</h5>
                  <textarea
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Enter explicit reason for returning this evaluation for revision..."
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-2.5 text-xs text-brand-ink focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowReturnInput(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleReturnEvaluation}
                      disabled={!returnReason.trim()}
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                    >
                      Confirm Return for Revision
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-brand-card-hover border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeEvalRecord.workflowStatus === 'Submitted' && !showReturnInput && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnInput(true)}
                    className="text-amber-400 hover:border-amber-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Return for Revision
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEvalModalInternId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveEvaluationDraft('In Progress')}
                >
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveEvaluationDraft('Submitted')}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  Submit for Review
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveEvaluationDraft('Reviewed')}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Mark as Reviewed
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANAGEMENT DECISION DESK */}
      {/* ========================================================================= */}
      {decisionModalInternId && activeDecisionIntern && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-2xl p-0 overflow-hidden border-blue-500/30 shadow-2xl">
            <div className="p-5 bg-brand-card-hover border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink">
                    Management Decision Desk: {activeDecisionIntern.fullName}
                  </h3>
                  <p className="text-xs text-brand-slate">
                    Record formal management determination for potential post-September 2026 engagement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModalInternId(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-slate hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Snapshot of evaluation */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate">
                  Performance Evaluation Snapshot
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-brand-slate block text-[10px]">Workflow Status</span>
                    <span className="font-bold text-brand-ink">{activeDecisionEval?.workflowStatus || 'Not Started'}</span>
                  </div>
                  <div>
                    <span className="text-brand-slate block text-[10px]">Calculated Score</span>
                    <span className="font-bold text-emerald-400">
                      {activeDecisionEval?.calculatedScore != null ? `${activeDecisionEval.calculatedScore}%` : 'Not graded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-slate block text-[10px]">Advisory Recommendation</span>
                    <span className="font-bold text-blue-400">{activeDecisionEval?.overallRecommendation || 'Undecided'}</span>
                  </div>
                </div>
              </div>

              {/* 6 Decision Options */}
              <div>
                <label className="block text-brand-slate font-semibold mb-2">
                  Select Management Decision <span className="text-brand-red">*</span>
                </label>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: 'Pending decision',
                        label: 'Pending decision',
                        desc: 'Under management deliberation. No action taken.',
                      },
                      {
                        value: 'Recommended for permanent employment',
                        label: 'Recommended for permanent employment',
                        desc: 'Management endorses candidate for permanent conversion consideration.',
                      },
                      {
                        value: 'Approved for offer preparation',
                        label: 'Approved for offer preparation',
                        desc: 'Authorizes HR to prepare legal offer terms and compensation package.',
                      },
                      {
                        value: 'Internship extension proposed',
                        label: 'Internship extension proposed',
                        desc: 'Proposes extending learning period under an authorized extension.',
                      },
                      {
                        value: 'Not selected for permanent employment',
                        label: 'Not selected for permanent employment',
                        desc: 'Internship will conclude at scheduled end date without employment offer.',
                      },
                      {
                        value: 'Decision deferred',
                        label: 'Decision deferred',
                        desc: 'Decision delayed pending business headcount or project requirements.',
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        selectedDecision === opt.value
                          ? 'bg-brand-red/10 border-brand-red/50 text-brand-ink shadow-glow-red-sm'
                          : 'bg-brand-card-hover border-white/5 text-brand-slate hover:border-white/15'
                      }`}
                    >
                      <input
                        type="radio"
                        name="management_decision"
                        value={opt.value}
                        checked={selectedDecision === opt.value}
                        onChange={() => setSelectedDecision(opt.value)}
                        className="mt-0.5 text-brand-red focus:ring-brand-red"
                      />
                      <div>
                        <span className="font-bold text-brand-ink block">{opt.label}</span>
                        <span className="text-[11px] text-brand-slate">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Decided By & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Decided By / Authorizing Authority <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={decisionActor}
                    onChange={(e) => setDecisionActor(e.target.value)}
                    placeholder="e.g. Ram Chaturvedi / Siva Kumar"
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Decision Remarks & Justification
                  </label>
                  <input
                    type="text"
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    placeholder="Executive notes, evaluation references..."
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-brand-card-hover border-t border-white/10 flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setDecisionModalInternId(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDecision} className="bg-blue-600 hover:bg-blue-500">
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Record Decision
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EMPLOYMENT OFFER & CONVERSION DESK */}
      {/* ========================================================================= */}
      {offerModalInternId && activeOfferIntern && activeOfferRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-emerald-500/30 shadow-2xl">
            <div className="p-5 bg-brand-card-hover border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink">
                    Employment Terms & Conversion Desk: {activeOfferIntern.fullName}
                  </h3>
                  <p className="text-xs text-brand-slate">
                    Controlled 8-stage transition from Unpaid Intern to Permanent Employee.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfferModalInternId(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-slate hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Conversion Rule Reminder */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                <strong>Idempotent Conversion Contract:</strong> Activating employment retains original person identity, preserves original 1 Jul – 30 Sep 2026 unpaid internship dates, and enables salary payroll only starting from the confirmed effective joining date.
              </div>

              {/* Offer Status Flow Selector */}
              <div>
                <label className="block text-brand-slate font-semibold mb-2">
                  Offer Lifecycle State
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {(['Draft', 'Prepared', 'Approved', 'Issued', 'Accepted', 'Rejected'] as OfferWorkflowStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOfferStatusSelect(st)}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                        offerStatusSelect === st
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-glow-red-sm'
                          : 'bg-white/5 border-white/10 text-brand-slate hover:bg-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employment Terms Form */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-ink text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Confirmed Employment Terms
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Legal Employer / Company
                    </label>
                    <input
                      type="text"
                      disabled
                      value="ETHXSOFTCON Technologies Pvt Ltd"
                      className="w-full bg-brand-dark-subtle/50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-slate cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Proposed Designation <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={offerDesignation}
                      onChange={(e) => setOfferDesignation(e.target.value)}
                      placeholder="e.g. Junior Software Engineer"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={offerDepartment}
                      onChange={(e) => setOfferDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Reporting Manager
                    </label>
                    <input
                      type="text"
                      value={offerReportingManager}
                      onChange={(e) => setOfferReportingManager(e.target.value)}
                      placeholder="e.g. Siva Kumar"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Employment Arrangement
                    </label>
                    <input
                      type="text"
                      value={offerEmploymentArrangement}
                      onChange={(e) => setOfferEmploymentArrangement(e.target.value)}
                      placeholder="e.g. Full-Time Regular"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Effective Joining Date <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={offerJoiningDate}
                      onChange={(e) => setOfferJoiningDate(e.target.value)}
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[10px] text-brand-slate mt-1 block">
                      Joining pending until this date.
                    </span>
                  </div>
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Approved Annual Fixed CTC (₹) <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      value={offerSalary}
                      onChange={(e) => setOfferSalary(e.target.value)}
                      placeholder="e.g. 450000"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-[10px] text-brand-slate mt-1 block">
                      Missing salary is unknown, not zero.
                    </span>
                  </div>
                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Probation Terms
                    </label>
                    <input
                      type="text"
                      value={offerProbation}
                      onChange={(e) => setOfferProbation(e.target.value)}
                      placeholder="e.g. 3 Months / 6 Months"
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    placeholder="e.g. Pune Global HQ"
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Offer Acceptance Controls */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-brand-ink block">Candidate Response Actions</span>
                  <span className="text-brand-slate text-[11px]">
                    Record candidate's written decision regarding the offered terms.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCandidateResponse('Rejected')}
                    className="text-red-400 hover:border-red-400"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Record Rejection
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCandidateResponse('Accepted')}
                    className="text-emerald-400 hover:border-emerald-400"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Record Acceptance
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-brand-card-hover border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                {activeOfferRecord.status === 'Accepted' && (
                  <Button
                    size="sm"
                    onClick={handleActivateConversion}
                    className="bg-emerald-600 hover:bg-emerald-500 shadow-glow-red-sm"
                  >
                    <Award className="w-4 h-4 mr-1.5" />
                    Activate Permanent Employment Now
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOfferModalInternId(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveOfferTerms} className="bg-emerald-700 hover:bg-emerald-600">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Save Terms & State
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LIFECYCLE ACTIONS (EXTEND / EARLY EXIT / COMPLETE) */}
      {/* ========================================================================= */}
      {lifecycleModalInternId && activeLifecycleIntern && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-xl p-0 overflow-hidden border-brand-border/80 shadow-2xl">
            <div className="p-5 bg-brand-card-hover border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-ink">
                    Lifecycle Exception: {activeLifecycleIntern.fullName}
                  </h3>
                  <p className="text-xs text-brand-slate">
                    Record authorized extension, early exit, or scheduled completion.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLifecycleModalInternId(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-slate hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-brand-slate font-semibold mb-2">
                  Action Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLifecycleActionType('extend')}
                    className={`p-2.5 rounded-xl border font-bold text-xs text-center transition-all ${
                      lifecycleActionType === 'extend'
                        ? 'bg-brand-red/10 border-brand-red/50 text-brand-ink'
                        : 'bg-white/5 border-white/10 text-brand-slate hover:bg-white/10'
                    }`}
                  >
                    Extend Internship
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifecycleActionType('early_exit')}
                    className={`p-2.5 rounded-xl border font-bold text-xs text-center transition-all ${
                      lifecycleActionType === 'early_exit'
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-brand-slate hover:bg-white/10'
                    }`}
                  >
                    Record Early Exit
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifecycleActionType('complete')}
                    className={`p-2.5 rounded-xl border font-bold text-xs text-center transition-all ${
                      lifecycleActionType === 'complete'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-brand-slate hover:bg-white/10'
                    }`}
                  >
                    Mark Completed
                  </button>
                </div>
              </div>

              {lifecycleActionType === 'extend' && (
                <div>
                  <label className="block text-brand-slate font-semibold mb-1">
                    New Extension End Date <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={lifecycleNewEndDate}
                    onChange={(e) => setLifecycleNewEndDate(e.target.value)}
                    className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                  />
                  <span className="text-[10px] text-brand-slate mt-1 block">
                    Extensions require explicit dates and authorization.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-brand-slate font-semibold mb-1">
                  Reason & Business Justification <span className="text-brand-red">*</span>
                </label>
                <textarea
                  rows={3}
                  value={lifecycleReason}
                  onChange={(e) => setLifecycleReason(e.target.value)}
                  placeholder="Provide explicit operational rationale for audit logging..."
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                />
              </div>

              <div>
                <label className="block text-brand-slate font-semibold mb-1">
                  Authorized By <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={lifecycleActor}
                  onChange={(e) => setLifecycleActor(e.target.value)}
                  placeholder="e.g. Niky Sharma / Siva Kumar"
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="p-4 bg-brand-card-hover border-t border-white/10 flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setLifecycleModalInternId(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleExecuteLifecycleAction}>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Confirm & Log Audit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InternshipLifecyclePage;
