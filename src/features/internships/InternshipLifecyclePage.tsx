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
  DollarSign,
  LayoutGrid,
  Kanban,
  Table,
  Download,
  Zap,
  ChevronDown,
  CheckCircle,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  UserPlus,
  Star,
  ThumbsUp,
  ArrowUpRight
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

  // Interactive View Modes & Quick Filter
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'table'>('cards');
  const [quickFilter, setQuickFilter] = useState<'all' | 'pending_eval' | 'recommended' | 'ppo' | 'converted'>('all');

  // Modal / Drawer states
  const [evalModalInternId, setEvalModalInternId] = useState<string | null>(null);
  const [decisionModalInternId, setDecisionModalInternId] = useState<string | null>(null);
  const [offerModalInternId, setOfferModalInternId] = useState<string | null>(null);
  const [lifecycleModalInternId, setLifecycleModalInternId] = useState<string | null>(null);

  // Full 4-Step Career Progression Wizard State
  const [wizardModalInternId, setWizardModalInternId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardSalary, setWizardSalary] = useState('500000');
  const [wizardDesignation, setWizardDesignation] = useState('Junior Software Engineer');
  const [wizardDepartment, setWizardDepartment] = useState('Engineering');
  const [wizardManager, setWizardManager] = useState('Siva Kumar');
  const [wizardJoiningDate, setWizardJoiningDate] = useState('2026-10-01');
  const [wizardLocation, setWizardLocation] = useState('Pune Global HQ');
  const [wizardDecisionOption, setWizardDecisionOption] = useState<ManagementDecisionOption>('Approved for offer preparation');
  const [wizardDecisionRemarks, setWizardDecisionRemarks] = useState('Consistently demonstrated high code quality, ownership, and adherence to agile delivery standards.');

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

  // Selected intern for 4-Step Promotion Wizard
  const activeWizardIntern = internCohort.find((i) => i.id === wizardModalInternId);
  const activeWizardEval = evaluations.find((e) => e.internId === wizardModalInternId);
  const activeWizardDecision = decisions.find((d) => d.internId === wizardModalInternId);
  const activeWizardOffer = offers.find((o) => o.internId === wizardModalInternId);

  // High-Impact Conversion Analytics
  const conversionRate = originalCohortCount > 0 ? Math.round((completedConversions / originalCohortCount) * 100) : 0;
  const scoredEvals = evaluations.filter((e) => e.calculatedScore != null);
  const averageRubricScore = scoredEvals.length > 0 
    ? Math.round(scoredEvals.reduce((acc, curr) => acc + (curr.calculatedScore || 0), 0) / scoredEvals.length)
    : 0;

  // Intern Stage Calculator (1: Enrolled, 2: Evaluated, 3: Recommended/PPO, 4: Converted)
  const getInternStage = (internId: string) => {
    const intern = employees.find((e) => e.id === internId);
    const ev = evaluations.find((e) => e.internId === internId);
    const dc = decisions.find((d) => d.internId === internId);
    const ofr = offers.find((o) => o.internId === internId);
    const isConverted = intern?.conversionDetails?.permanentEmploymentActive === true;

    if (isConverted) return 4;
    if (ofr?.status === 'Accepted' || ofr?.status === 'Approved' || ofr?.status === 'Issued') return 3;
    if (dc?.decision === 'Recommended for permanent employment' || dc?.decision === 'Approved for offer preparation') return 2.5;
    if (ev?.workflowStatus === 'Reviewed' || ev?.status === 'Reviewed') return 2;
    if (ev?.workflowStatus === 'Submitted' || ev?.workflowStatus === 'In Progress') return 1.5;
    return 1;
  };

  // Quick Filtered Interns
  const displayedInterns = useMemo(() => {
    return filteredInterns.filter((intern) => {
      const ev = evaluations.find((e) => e.internId === intern.id);
      const dc = decisions.find((d) => d.internId === intern.id);
      const ofr = offers.find((o) => o.internId === intern.id);
      const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;

      if (quickFilter === 'pending_eval') {
        return (ev?.workflowStatus || ev?.status) !== 'Reviewed';
      }
      if (quickFilter === 'recommended') {
        return dc?.decision === 'Recommended for permanent employment' || dc?.decision === 'Approved for offer preparation';
      }
      if (quickFilter === 'ppo') {
        return ofr?.status === 'Approved' || ofr?.status === 'Issued' || ofr?.status === 'Accepted';
      }
      if (quickFilter === 'converted') {
        return isConverted;
      }
      return true;
    });
  }, [filteredInterns, quickFilter, evaluations, decisions, offers]);

  // Export Cohort Dossier CSV
  const handleExportCSV = () => {
    const headers = [
      'Intern Name',
      'Employee ID',
      'Cohort Window',
      'Engagement Category',
      'Stipend (INR)',
      'Evaluation Status',
      'Rubric Score (%)',
      'Reviewer',
      'Approver',
      'Management Decision',
      'Decided By',
      'PPO Offer Status',
      'Proposed Salary (INR)',
      'Employment State',
      'Permanent Converted',
    ];
    const rows = internCohort.map((intern) => {
      const ev = evaluations.find((e) => e.internId === intern.id);
      const dc = decisions.find((d) => d.internId === intern.id);
      const ofr = offers.find((o) => o.internId === intern.id);
      const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;
      return [
        `"${intern.fullName}"`,
        `"${intern.employeeId}"`,
        `"1 Jul 2026 – 30 Sep 2026"`,
        `"${intern.engagementCategory}"`,
        `"0"`,
        `"${ev?.workflowStatus || ev?.status || 'Not Started'}"`,
        `"${ev?.calculatedScore != null ? `${ev.calculatedScore}%` : 'Not graded'}"`,
        `"${ev?.assignedReviewer || 'Not assigned'}"`,
        `"${ev?.assignedApprover || 'Not assigned'}"`,
        `"${dc?.decision || 'Pending decision'}"`,
        `"${dc?.decidedBy || 'Not assigned'}"`,
        `"${ofr?.status || 'Draft'}"`,
        `"${ofr?.terms?.baseSalary ? String(ofr.terms.baseSalary) : 'Not provided'}"`,
        `"${isConverted ? 'Permanent Active' : 'Unpaid Intern'}"`,
        `"${isConverted ? 'Yes' : 'No'}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ETHX_Internship_Cohort_Dossier_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Cohort Governance Dossier exported to CSV');
  };

  // Open 4-Step Fast-Track Progression Wizard
  const handleOpenWizard = (internId: string, initialStep?: number) => {
    const targetIntern = employees.find((e) => e.id === internId);
    const ev = evaluations.find((e) => e.internId === internId);
    const dc = decisions.find((d) => d.internId === internId);
    const ofr = offers.find((o) => o.internId === internId);
    const isConverted = targetIntern?.conversionDetails?.permanentEmploymentActive === true;

    let step = initialStep || 1;
    if (!initialStep) {
      if (isConverted) step = 4;
      else if (ofr?.status === 'Accepted' || ofr?.status === 'Approved' || ofr?.status === 'Issued') step = 4;
      else if (dc?.decision === 'Approved for offer preparation' || dc?.decision === 'Recommended for permanent employment') step = 3;
      else if (ev?.workflowStatus === 'Reviewed' || ev?.status === 'Reviewed') step = 2;
      else step = 1;
    }
    setWizardStep(step);

    if (ofr) {
      setWizardDesignation(ofr.terms.designation !== 'Not provided' ? ofr.terms.designation : 'Junior Software Engineer');
      setWizardDepartment(ofr.terms.department !== 'Not provided' ? ofr.terms.department : targetIntern?.department || 'Engineering');
      setWizardManager(ofr.terms.reportingManager !== 'Not provided' ? ofr.terms.reportingManager : 'Siva Kumar');
      setWizardSalary(ofr.terms.baseSalary != null ? String(ofr.terms.baseSalary) : '500000');
      setWizardJoiningDate(ofr.terms.actualJoiningDate !== 'Not provided' ? ofr.terms.actualJoiningDate : '2026-10-01');
      setWizardLocation(ofr.terms.workLocation !== 'Not provided' ? ofr.terms.workLocation : 'Pune Global HQ');
    } else {
      setWizardDesignation('Junior Software Engineer');
      setWizardDepartment(targetIntern?.department || 'Engineering');
      setWizardManager('Siva Kumar');
      setWizardSalary('500000');
      setWizardJoiningDate('2026-10-01');
      setWizardLocation('Pune Global HQ');
    }

    if (dc) {
      setWizardDecisionOption(dc.decision || 'Approved for offer preparation');
      setWizardDecisionRemarks(dc.remarks || 'Exceptional contribution to core software modules.');
    } else {
      setWizardDecisionOption('Approved for offer preparation');
      setWizardDecisionRemarks('Consistently demonstrated high code quality and sprint reliability.');
    }

    // Populate eval form state for step 1
    handleOpenEvaluation(internId);
    setWizardModalInternId(internId);
  };

  // Direct 1-Click Fast Conversion to Permanent Employee
  const handleFastPromoteToPermanent = async (internId: string) => {
    try {
      const ofr = offers.find((o) => o.internId === internId);
      const targetIntern = internCohort.find((i) => i.id === internId);
      if (!targetIntern) return;

      let offerId = ofr?.id;
      if (!ofr) {
        const newOffer = await hrmsService.updateEmploymentOffer(`OFFER-TEMP-${internId}`, {
          internId,
          internName: targetIntern.fullName,
          status: 'Accepted',
          offerStatus: 'Accepted',
          terms: {
            legalEmployer: 'ETHXSOFTCON Technologies Pvt Ltd',
            designation: 'Junior Software Engineer',
            department: targetIntern.department || 'Engineering',
            reportingManager: 'Siva Kumar',
            employmentArrangement: 'Full-Time Regular',
            proposedJoiningDate: '2026-10-01',
            actualJoiningDate: '2026-10-01',
            baseSalary: 450000,
            approvedSalary: 450000,
            workLocation: 'Pune Global HQ',
            probationPeriod: '3 Months',
          }
        });
        offerId = newOffer.id;
      } else if (ofr.status !== 'Accepted') {
        await hrmsService.updateEmploymentOffer(ofr.id, {
          status: 'Accepted',
          offerStatus: 'Accepted',
        });
      }

      if (offerId) {
        await hrmsService.activatePermanentEmployment(offerId, user?.name || 'HR Management');
        showToast(`Congratulations! ${targetIntern.fullName} is now a Permanent Software Engineer!`);
        if (wizardModalInternId) setWizardModalInternId(null);
        await loadAllData();
      }
    } catch (err: any) {
      console.error('Fast promotion failed:', err);
      showToast(`Error: ${err?.message || 'Promotion failed'}`);
    }
  };

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

      {/* ========================================================================= */}
      {/* INTERACTIVE CONTROLS & MULTI-VIEW SWITCHER BAR */}
      {/* ========================================================================= */}
      <Card className="p-4 space-y-4">
        {/* Row 1: Search, View Mode Switcher, and Export */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-brand-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search intern name or ID (e.g. Utkarsh, Deepti, ETHX-014)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher Segmented Control */}
            <div className="flex items-center bg-brand-dark-subtle p-1 rounded-xl border border-brand-border/80">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-brand-slate hover:text-white hover:bg-white/5'
                }`}
                title="Executive Dossier Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dossier Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-brand-slate hover:text-white hover:bg-white/5'
                }`}
                title="5-Stage Lifecycle Pipeline Kanban"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lifecycle Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-brand-slate hover:text-white hover:bg-white/5'
                }`}
                title="Detailed Governance Registry Table"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Audit Table</span>
              </button>
            </div>

            {/* Export CSV Dossier */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs font-medium border-brand-border/90 hover:border-brand-red/50 hover:bg-brand-red/10"
              title="Export complete 2026 cohort audit dossier to CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Export Dossier (CSV)
            </Button>
          </div>
        </div>

        {/* Row 2: Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[11px] font-semibold text-brand-slate uppercase tracking-wider mr-1">
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              quickFilter === 'all'
                ? 'bg-brand-red text-white'
                : 'bg-brand-dark-subtle text-brand-slate border border-brand-border/60 hover:text-white'
            }`}
          >
            All Cohort ({internCohort.length})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('pending_eval')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              quickFilter === 'pending_eval'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-brand-dark-subtle text-brand-slate border border-brand-border/60 hover:text-white'
            }`}
          >
            Pending Review ({evalsPending})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('recommended')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              quickFilter === 'recommended'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-brand-dark-subtle text-brand-slate border border-brand-border/60 hover:text-white'
            }`}
          >
            Recommended for Employment ({recommendedForEmployment})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('ppo')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              quickFilter === 'ppo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-brand-dark-subtle text-brand-slate border border-brand-border/60 hover:text-white'
            }`}
          >
            PPO / Offer Prepared ({offersApprovedOrAccepted})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('converted')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              quickFilter === 'converted'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-brand-dark-subtle text-brand-slate border border-brand-border/60 hover:text-white'
            }`}
          >
            Permanent Active ({completedConversions})
          </button>

          {(search || filterEvalStatus !== 'All' || filterDecision !== 'All' || filterOfferStatus !== 'All' || quickFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterEvalStatus('All');
                setFilterDecision('All');
                setFilterOfferStatus('All');
                setQuickFilter('all');
              }}
              className="text-xs text-brand-slate hover:text-brand-red ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Row 3: Secondary Granular Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
          <div>
            <select
              value={filterEvalStatus}
              onChange={(e) => setFilterEvalStatus(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Evaluation Status: All States</option>
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
              <option value="All">Management Decision: All Decisions</option>
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
              <option value="All">Offer Status: All Statuses</option>
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

      {/* ========================================================================= */}
      {/* VIEW 1: EXECUTIVE DOSSIER CARDS WITH 4-STAGE MILESTONE PROGRESSION */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedInterns.length === 0 ? (
            <div className="col-span-full p-12 text-center text-brand-slate bg-brand-card rounded-2xl border border-brand-border">
              <GraduationCap className="w-12 h-12 mx-auto text-brand-slate/40 mb-3" />
              <p className="font-semibold text-sm">No intern records match the selected criteria</p>
              <p className="text-xs text-brand-slate/70 mt-1">Try clearing search filters or selecting All Cohort</p>
            </div>
          ) : (
            displayedInterns.map((intern) => {
              const lc = lifecycles.find((l) => l.internId === intern.id);
              const ev = evaluations.find((e) => e.internId === intern.id);
              const dc = decisions.find((d) => d.internId === intern.id);
              const ofr = offers.find((o) => o.internId === intern.id);
              const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;
              const stage = getInternStage(intern.id);

              return (
                <Card
                  key={intern.id}
                  className="p-5 flex flex-col justify-between hover:border-brand-red/40 transition-all duration-200 group bg-brand-card/90 hover:bg-brand-card-hover"
                >
                  <div className="space-y-4">
                    {/* Header: Identity, ID, Stipend */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={intern.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={intern.fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 shadow-inner flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-brand-ink group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                            <Link to={`/employees/${intern.id}`}>{intern.fullName}</Link>
                            {isConverted && (
                              <span title="Permanent Employee Verified">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-brand-slate font-medium">
                              {intern.employeeId}
                            </span>
                            <span className="text-brand-slate/50">•</span>
                            <span className="text-[11px] text-brand-slate">
                              {intern.department || 'Engineering'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      {isConverted ? (
                        <Badge variant="emerald" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          Permanent SWE
                        </Badge>
                      ) : ofr?.status === 'Accepted' ? (
                        <Badge variant="cyan" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          PPO Accepted
                        </Badge>
                      ) : dc?.decision === 'Recommended for permanent employment' ? (
                        <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          Recommended
                        </Badge>
                      ) : (
                        <Badge variant="slate" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          Unpaid Intern
                        </Badge>
                      )}
                    </div>

                    {/* 4-STAGE VISUAL PROGRESSION STEPPER */}
                    <div className="bg-brand-dark-subtle/80 rounded-xl p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-brand-slate">
                        <span>Career Milestone Progress</span>
                        <span className="text-brand-ink font-mono font-bold">
                          Stage {Math.min(4, Math.floor(stage))}/4
                        </span>
                      </div>

                      {/* Milestone Step Indicator */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {/* Step 1: Enrolled */}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                              stage >= 1
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            ✓
                          </div>
                          <span className="text-[9px] font-medium text-brand-slate line-clamp-1">
                            1. Unpaid Intern
                          </span>
                        </div>

                        {/* Step 2: Evaluation */}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                              stage >= 2
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : stage >= 1.5
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            {stage >= 2 ? '✓' : '2'}
                          </div>
                          <span
                            className={`text-[9px] font-medium line-clamp-1 ${
                              stage >= 2 ? 'text-brand-ink' : 'text-brand-slate'
                            }`}
                          >
                            2. Evaluation
                          </span>
                        </div>

                        {/* Step 3: Decision Gate */}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                              stage >= 3
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : stage >= 2.5
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            {stage >= 3 ? '✓' : '3'}
                          </div>
                          <span
                            className={`text-[9px] font-medium line-clamp-1 ${
                              stage >= 2.5 ? 'text-brand-ink' : 'text-brand-slate'
                            }`}
                          >
                            3. Decision Gate
                          </span>
                        </div>

                        {/* Step 4: Permanent SWE */}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                              stage >= 4
                                ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/30'
                                : 'bg-white/5 text-brand-slate border border-white/10'
                            }`}
                          >
                            {stage >= 4 ? '✓' : '4'}
                          </div>
                          <span
                            className={`text-[9px] font-medium line-clamp-1 ${
                              stage >= 4 ? 'text-emerald-400 font-bold' : 'text-brand-slate'
                            }`}
                          >
                            4. Permanent SWE
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-red via-blue-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${(Math.min(4, stage) / 4) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Evaluation Score Pill */}
                      <div className="p-2.5 rounded-xl bg-brand-dark-subtle/50 border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-brand-slate font-medium">Rubric Evaluation</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          {ev?.calculatedScore != null ? (
                            <>
                              <span className="text-sm font-extrabold text-emerald-400">
                                {ev.calculatedScore}%
                              </span>
                              <span className="text-[10px] text-brand-slate">
                                ({ev.workflowStatus || 'Reviewed'})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-brand-slate font-medium">
                              {ev?.workflowStatus || 'Not Started'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Decision Status Pill */}
                      <div className="p-2.5 rounded-xl bg-brand-dark-subtle/50 border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-brand-slate font-medium">Management Gate</span>
                        <div className="mt-1 truncate">
                          {dc?.decision === 'Recommended for permanent employment' ? (
                            <span className="text-xs font-semibold text-blue-300">
                              Recommended
                            </span>
                          ) : dc?.decision === 'Approved for offer preparation' ? (
                            <span className="text-xs font-semibold text-emerald-300">
                              Approved for Offer
                            </span>
                          ) : (
                            <span className="text-xs text-brand-slate">
                              {dc?.decision || 'Pending'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Offer / Terms Pill */}
                      <div className="p-2.5 rounded-xl bg-brand-dark-subtle/50 border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-brand-slate font-medium">Offer CTC Package</span>
                        <div className="mt-1 font-semibold text-xs text-brand-ink">
                          {ofr?.terms?.baseSalary
                            ? `₹${(ofr.terms.baseSalary / 100000).toFixed(1)}L CTC`
                            : '₹0 (Unpaid Intern)'}
                        </div>
                      </div>

                      {/* Employment Status Pill */}
                      <div className="p-2.5 rounded-xl bg-brand-dark-subtle/50 border border-white/5 flex flex-col justify-between">
                        <span className="text-[10px] text-brand-slate font-medium">Payroll / Arrangement</span>
                        <div className="mt-1 truncate text-xs font-semibold text-brand-ink">
                          {isConverted ? (
                            <span className="text-emerald-400">Active Salary Payroll</span>
                          ) : (
                            <span className="text-brand-slate">Excluded from Payroll</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RESPONSIVE ACTION BUTTONS */}
                  <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                    {/* Primary Action: 4-Step Career Progression Wizard */}
                    <Button
                      size="sm"
                      onClick={() => handleOpenWizard(intern.id)}
                      className="w-full text-xs font-bold py-2 bg-gradient-to-r from-brand-red to-brand-red-hover text-white shadow-md hover:shadow-brand-red/20"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                      4-Step Career Progression Wizard
                    </Button>

                    {/* Secondary Action Row: Non-crammed, wrapped buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[11px] h-7 px-2.5 flex-1 min-w-[70px]"
                        onClick={() => handleOpenEvaluation(intern.id)}
                        title="Open Rubric Evaluation"
                      >
                        <Edit3 className="w-3 h-3 mr-1 text-brand-red" />
                        Evaluate
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[11px] h-7 px-2.5 flex-1 min-w-[70px]"
                        onClick={() => handleOpenDecision(intern.id)}
                        title="Record Management Gate Decision"
                      >
                        <CheckCircle className="w-3 h-3 mr-1 text-blue-400" />
                        Decision
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[11px] h-7 px-2.5 flex-1 min-w-[70px]"
                        onClick={() => handleOpenOffer(intern.id)}
                        title="Manage PPO Terms & Conversion"
                      >
                        <FileText className="w-3 h-3 mr-1 text-emerald-400" />
                        PPO Offer
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-7 px-2 text-brand-slate hover:text-white"
                        onClick={() => handleOpenLifecycleAction(intern.id)}
                        title="Lifecycle: Extend, Early Exit, Complete"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Fast Direct Conversion Trigger (If recommended & not converted) */}
                    {!isConverted && (dc?.decision === 'Recommended for permanent employment' || dc?.decision === 'Approved for offer preparation' || ev?.workflowStatus === 'Reviewed') && (
                      <button
                        type="button"
                        onClick={() => handleFastPromoteToPermanent(intern.id)}
                        className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        One-Click Fast Convert to Permanent SWE (₹4.5L CTC)
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: 5-STAGE LIFECYCLE PIPELINE KANBAN */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1050px]">
            {/* Stage 1: Enrolled Unpaid Interns */}
            <div className="space-y-3 bg-brand-dark-subtle/50 p-3.5 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-slate" />
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    1. Enrolled Interns
                  </span>
                </div>
                <Badge variant="slate" className="text-[10px]">
                  {internCohort.length}
                </Badge>
              </div>
              <p className="text-[10px] text-brand-slate leading-tight">
                Confirmed 8 unpaid interns (1 Jul – 30 Sep 2026, ₹0 stipend).
              </p>

              <div className="space-y-2.5 flex-1">
                {internCohort.map((intern) => (
                  <div
                    key={`k1-${intern.id}`}
                    onClick={() => handleOpenWizard(intern.id, 1)}
                    className="p-3 rounded-xl bg-brand-card border border-brand-border/60 hover:border-brand-red/50 cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-ink group-hover:text-brand-red transition-colors">
                        {intern.fullName}
                      </span>
                      <span className="text-[10px] font-mono text-brand-slate">
                        {intern.employeeId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-brand-slate">
                      <span>{intern.department || 'Engineering'}</span>
                      <span className="text-emerald-400 font-medium">₹0 Unpaid</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 2: Under Rubric Evaluation */}
            <div className="space-y-3 bg-brand-dark-subtle/50 p-3.5 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    2. Rubric Evaluation
                  </span>
                </div>
                <Badge variant="amber" className="text-[10px]">
                  {evaluations.filter((e) => e.workflowStatus === 'Reviewed' || e.workflowStatus === 'Submitted').length}
                </Badge>
              </div>
              <p className="text-[10px] text-brand-slate leading-tight">
                7 performance criteria evaluated by engineering leads.
              </p>

              <div className="space-y-2.5 flex-1">
                {internCohort.map((intern) => {
                  const ev = evaluations.find((e) => e.internId === intern.id);
                  const isReviewed = ev?.workflowStatus === 'Reviewed';
                  return (
                    <div
                      key={`k2-${intern.id}`}
                      onClick={() => handleOpenEvaluation(intern.id)}
                      className={`p-3 rounded-xl bg-brand-card border cursor-pointer transition-all shadow-sm group ${
                        isReviewed ? 'border-amber-500/40 bg-amber-500/5' : 'border-brand-border/60 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-ink group-hover:text-amber-400 transition-colors">
                          {intern.fullName}
                        </span>
                        {ev?.calculatedScore != null ? (
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {ev.calculatedScore}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-brand-slate">Pending</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-brand-slate">
                        <span>{ev?.workflowStatus || 'Not Started'}</span>
                        <span className="text-brand-slate/80">{ev?.assignedReviewer || 'Unassigned'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 3: Management Decision Gate */}
            <div className="space-y-3 bg-brand-dark-subtle/50 p-3.5 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    3. Decision Gate
                  </span>
                </div>
                <Badge variant="blue" className="text-[10px]">
                  {recommendedForEmployment}
                </Badge>
              </div>
              <p className="text-[10px] text-brand-slate leading-tight">
                Executive recommendation for permanent SWE conversion.
              </p>

              <div className="space-y-2.5 flex-1">
                {internCohort.map((intern) => {
                  const dc = decisions.find((d) => d.internId === intern.id);
                  const isRec = dc?.decision === 'Recommended for permanent employment' || dc?.decision === 'Approved for offer preparation';
                  return (
                    <div
                      key={`k3-${intern.id}`}
                      onClick={() => handleOpenDecision(intern.id)}
                      className={`p-3 rounded-xl bg-brand-card border cursor-pointer transition-all shadow-sm group ${
                        isRec ? 'border-blue-500/40 bg-blue-500/5' : 'border-brand-border/60 hover:border-blue-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-ink group-hover:text-blue-400 transition-colors">
                          {intern.fullName}
                        </span>
                        {isRec ? (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Clock3 className="w-3.5 h-3.5 text-brand-slate" />
                        )}
                      </div>
                      <div className="mt-1 text-[10px] truncate text-brand-slate">
                        {dc?.decision || 'Pending decision'}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-brand-slate">
                        <span>Decider:</span>
                        <span className="text-brand-slate/80 font-mono">{dc?.decidedBy || 'Unassigned'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 4: PPO Offer In-Flight */}
            <div className="space-y-3 bg-brand-dark-subtle/50 p-3.5 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    4. PPO / Offer Terms
                  </span>
                </div>
                <Badge variant="cyan" className="text-[10px]">
                  {offersApprovedOrAccepted}
                </Badge>
              </div>
              <p className="text-[10px] text-brand-slate leading-tight">
                Pre-placement offer letters, CTC packages, and acceptance.
              </p>

              <div className="space-y-2.5 flex-1">
                {internCohort.map((intern) => {
                  const ofr = offers.find((o) => o.internId === intern.id);
                  const isAccepted = ofr?.status === 'Accepted';
                  return (
                    <div
                      key={`k4-${intern.id}`}
                      onClick={() => handleOpenOffer(intern.id)}
                      className={`p-3 rounded-xl bg-brand-card border cursor-pointer transition-all shadow-sm group ${
                        isAccepted ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-brand-border/60 hover:border-cyan-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-ink group-hover:text-cyan-400 transition-colors">
                          {intern.fullName}
                        </span>
                        <Badge variant="cyan" className="text-[9px] px-1.5 py-0">
                          {ofr?.status || 'Draft'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[10px] font-semibold text-brand-ink">
                        {ofr?.terms?.baseSalary
                          ? `₹${(ofr.terms.baseSalary / 100000).toFixed(1)}L CTC`
                          : 'Package Pending'}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-brand-slate">
                        <span>Joining:</span>
                        <span className="font-mono text-cyan-300">
                          {ofr?.terms?.actualJoiningDate !== 'Not provided' ? ofr?.terms?.actualJoiningDate : '1 Oct 2026'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 5: Permanent Active SWE */}
            <div className="space-y-3 bg-brand-dark-subtle/50 p-3.5 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                    5. Permanent SWE
                  </span>
                </div>
                <Badge variant="emerald" className="text-[10px]">
                  {completedConversions}
                </Badge>
              </div>
              <p className="text-[10px] text-brand-slate leading-tight">
                Full-time regular employees enrolled into salary payroll.
              </p>

              <div className="space-y-2.5 flex-1">
                {internCohort.map((intern) => {
                  const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;
                  return (
                    <div
                      key={`k5-${intern.id}`}
                      onClick={() => handleOpenWizard(intern.id, 4)}
                      className={`p-3 rounded-xl bg-brand-card border cursor-pointer transition-all shadow-sm group ${
                        isConverted
                          ? 'border-emerald-500/60 bg-emerald-500/10 shadow-emerald-500/10'
                          : 'border-brand-border/40 opacity-70 hover:opacity-100 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-ink group-hover:text-emerald-400 transition-colors">
                          {intern.fullName}
                        </span>
                        {isConverted ? (
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="text-[9px] text-brand-slate">Pending</span>
                        )}
                      </div>
                      <div className="mt-1 text-[10px] text-brand-slate">
                        {isConverted ? (
                          <span className="text-emerald-300 font-semibold">Active SWE • Roster Updated</span>
                        ) : (
                          <span>Conversion Pending</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-brand-slate">
                        <span>Original ID:</span>
                        <span className="font-mono text-emerald-400">{intern.employeeId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: UPGRADED RESPONSIVE AUDIT TABLE WITH WRAP-SAFE ACTIONS */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-brand-dark-subtle/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-brand-ink">
                Confirmed 8 Unpaid Interns Master Registry
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold">
                {displayedInterns.length} Records
              </span>
            </div>
            <span className="text-xs text-brand-slate font-medium">
              Compensation: Unpaid (Stipend ₹0) • Excluded from Salary Payroll
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-brand-dark-subtle/80 border-b border-brand-border/80 text-brand-slate uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Intern Identity</th>
                  <th className="py-3.5 px-4">Internship Window</th>
                  <th className="py-3.5 px-4">Milestone Stage</th>
                  <th className="py-3.5 px-4">Rubric Evaluation</th>
                  <th className="py-3.5 px-4">Management Decision</th>
                  <th className="py-3.5 px-4">Offer / Terms</th>
                  <th className="py-3.5 px-4">Employment State</th>
                  <th className="py-3.5 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedInterns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-slate">
                      No intern records found matching active filters.
                    </td>
                  </tr>
                ) : (
                  displayedInterns.map((intern) => {
                    const lc = lifecycles.find((l) => l.internId === intern.id);
                    const ev = evaluations.find((e) => e.internId === intern.id);
                    const dc = decisions.find((d) => d.internId === intern.id);
                    const ofr = offers.find((o) => o.internId === intern.id);
                    const isConverted = intern.conversionDetails?.permanentEmploymentActive === true;
                    const stage = getInternStage(intern.id);

                    return (
                      <tr
                        key={intern.id}
                        className="hover:bg-brand-card-hover/40 transition-colors group"
                      >
                        {/* 1. Intern Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={intern.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={intern.fullName}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="font-bold text-brand-ink group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                                <Link to={`/employees/${intern.id}`}>{intern.fullName}</Link>
                                {isConverted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              </div>
                              <div className="text-[11px] text-brand-slate font-mono">
                                {intern.employeeId} • <span className="text-emerald-400 font-medium">Stipend: ₹0</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Internship Window */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-brand-ink">
                            1 Jul 2026 – 30 Sep 2026
                          </div>
                          <div className="text-[11px] text-brand-slate">
                            Inclusive • Excluded from Payroll
                          </div>
                        </td>

                        {/* 3. Milestone Stage */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-brand-red"
                                style={{ width: `${(Math.min(4, stage) / 4) * 100}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-brand-ink">
                              Stage {Math.min(4, Math.floor(stage))}/4
                            </span>
                          </div>
                          <span className="text-[10px] text-brand-slate">
                            {stage >= 4
                              ? 'Permanent Converted'
                              : stage >= 3
                              ? 'Offer Approved'
                              : stage >= 2
                              ? 'Rubric Graded'
                              : 'Unpaid Intern'}
                          </span>
                        </td>

                        {/* 4. Rubric Evaluation */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {ev?.workflowStatus === 'Reviewed' ? (
                                <Badge variant="emerald" className="text-[10px]">
                                  Reviewed
                                </Badge>
                              ) : ev?.workflowStatus === 'Submitted' ? (
                                <Badge variant="blue" className="text-[10px]">
                                  Submitted
                                </Badge>
                              ) : ev?.workflowStatus === 'In Progress' ? (
                                <Badge variant="amber" className="text-[10px]">
                                  In Progress
                                </Badge>
                              ) : (
                                <Badge variant="slate" className="text-[10px]">
                                  Not Started
                                </Badge>
                              )}
                              {ev?.calculatedScore != null && (
                                <span className="text-xs font-bold text-brand-ink">
                                  {ev.calculatedScore}%
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-brand-slate">
                              Rev: {ev?.assignedReviewer || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        {/* 5. Management Decision */}
                        <td className="py-3.5 px-4">
                          {dc?.decision === 'Recommended for permanent employment' ? (
                            <Badge variant="blue" className="text-[10px]">
                              Recommended
                            </Badge>
                          ) : dc?.decision === 'Approved for offer preparation' ? (
                            <Badge variant="emerald" className="text-[10px]">
                              Approved for Offer
                            </Badge>
                          ) : (
                            <Badge variant="slate" className="text-[10px]">
                              {dc?.decision || 'Pending'}
                            </Badge>
                          )}
                          <div className="text-[10px] text-brand-slate mt-0.5">
                            By: {dc?.decidedBy || 'Not assigned'}
                          </div>
                        </td>

                        {/* 6. Offer / Terms */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={ofr?.status === 'Accepted' ? 'emerald' : ofr?.status === 'Issued' ? 'cyan' : 'slate'} className="text-[10px]">
                              {ofr?.status || 'Draft'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-brand-slate block mt-0.5">
                            {ofr?.terms?.baseSalary
                              ? `₹${(ofr.terms.baseSalary / 100000).toFixed(1)}L CTC`
                              : 'Package Pending'}
                          </span>
                        </td>

                        {/* 7. Employment State */}
                        <td className="py-3.5 px-4">
                          {isConverted ? (
                            <Badge variant="emerald" className="text-[10px] font-bold">
                              Permanent SWE
                            </Badge>
                          ) : (
                            <Badge variant="slate" className="text-[10px]">
                              Unpaid Intern
                            </Badge>
                          )}
                        </td>

                        {/* 8. Governance Actions: Non-cramped wrap-safe buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <Button
                              size="sm"
                              className="text-[11px] h-7 px-2.5 bg-brand-red hover:bg-brand-red-hover text-white font-bold"
                              onClick={() => handleOpenWizard(intern.id)}
                              title="Open 4-Step Career Progression Wizard"
                            >
                              <Zap className="w-3 h-3 mr-1 text-amber-300" />
                              Wizard
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              onClick={() => handleOpenEvaluation(intern.id)}
                              title="Evaluate Performance Rubric"
                            >
                              <Edit3 className="w-3 h-3 mr-1 text-brand-red" />
                              Eval
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              onClick={() => handleOpenDecision(intern.id)}
                              title="Management Decision Gate"
                            >
                              <CheckCircle className="w-3 h-3 mr-1 text-blue-400" />
                              Decision
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[11px] h-7 px-2"
                              onClick={() => handleOpenOffer(intern.id)}
                              title="Terms & PPO"
                            >
                              <FileText className="w-3 h-3 mr-1 text-emerald-400" />
                              PPO
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
      )}

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

      {/* ========================================================================= */}
      {/* MODAL 5: 4-STEP FAST-TRACK CAREER PROGRESSION WIZARD */}
      {/* ========================================================================= */}
      {wizardModalInternId && activeWizardIntern && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-brand-red/40 shadow-2xl bg-brand-dark">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-brand-card to-brand-card-hover border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-red to-brand-red/60 flex items-center justify-center text-white shadow-lg">
                  <Zap className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-brand-ink">
                      Career Progression Wizard: {activeWizardIntern.fullName}
                    </h3>
                    <Badge variant="slate" className="font-mono text-[10px]">
                      {activeWizardIntern.employeeId}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-slate">
                    Step-by-step transition from Unpaid Intern (₹0) to Permanent Software Engineer (Full-Time Paid)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWizardModalInternId(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-slate hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Navigation Bar */}
            <div className="p-4 bg-brand-dark-subtle/80 border-b border-white/5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: 'Rubric Evaluation', sub: 'Performance scoring' },
                  { num: 2, label: 'Decision Gate', sub: 'Management approval' },
                  { num: 3, label: 'Offer & Terms', sub: 'CTC & PPO details' },
                  { num: 4, label: 'Conversion & Roster', sub: 'Permanent SWE status' }
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setWizardStep(s.num)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      wizardStep === s.num
                        ? 'bg-brand-red/15 border-brand-red text-white shadow-md'
                        : wizardStep > s.num
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-brand-slate opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          wizardStep === s.num
                            ? 'bg-brand-red text-white'
                            : wizardStep > s.num
                            ? 'bg-emerald-500 text-black font-extrabold'
                            : 'bg-white/10 text-brand-slate'
                        }`}
                      >
                        {wizardStep > s.num ? '✓' : s.num}
                      </div>
                      <span className="text-xs font-bold truncate">{s.label}</span>
                    </div>
                    <span className="text-[10px] text-brand-slate block mt-1 truncate pl-7">
                      {s.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* STEP 1: PERFORMANCE EVALUATION */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Step 1: Evaluate 7 Core Competencies</span>
                      <p className="text-xs text-blue-200/80 mt-0.5">
                        Ensure all criteria are graded or confirmed. Current score for {activeWizardIntern.fullName}:{' '}
                        <strong className="text-white">
                          {activeWizardEval?.calculatedScore != null ? `${activeWizardEval.calculatedScore}%` : 'Not graded'}
                        </strong>{' '}
                        ({activeWizardEval?.workflowStatus || 'Not Started'}).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Assigned Technical Reviewer
                      </label>
                      <input
                        type="text"
                        value={evalReviewer}
                        onChange={(e) => setEvalReviewer(e.target.value)}
                        placeholder="e.g. WDKJNAKsdnl / Lead Architect"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Executive Approver
                      </label>
                      <input
                        type="text"
                        value={evalApprover}
                        onChange={(e) => setEvalApprover(e.target.value)}
                        placeholder="e.g. Company Directors / HR Admin"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-brand-slate font-semibold">
                      Key Strengths & Project Contributions
                    </label>
                    <textarea
                      rows={2}
                      value={evalStrengths}
                      onChange={(e) => setEvalStrengths(e.target.value)}
                      placeholder="e.g. Demonstrated exceptional problem-solving, active participation in sprint retrospectives..."
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-brand-slate font-semibold">
                      Growth Areas & Continued Development
                    </label>
                    <textarea
                      rows={2}
                      value={evalImprovements}
                      onChange={(e) => setEvalImprovements(e.target.value)}
                      placeholder="e.g. Deepen knowledge of distributed caching patterns and Redis session replication..."
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-brand-dark-subtle border border-white/5">
                    <span className="text-xs text-brand-slate">
                      Current Evaluation Status:{' '}
                      <strong className="text-brand-ink">{activeWizardEval?.workflowStatus || 'Not Started'}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveEvaluationDraft('Reviewed')}
                      className="text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Mark Evaluation as Reviewed
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: MANAGEMENT DECISION GATE */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Step 2: Formal Management Decision Gate</span>
                      <p className="text-xs text-purple-200/80 mt-0.5">
                        Authorizing permanent employment or extension requires an explicit gate decision recorded by authorized company leadership.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-brand-slate font-semibold mb-2">
                      Management Gate Decision <span className="text-brand-red">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          val: 'Recommended for permanent employment',
                          label: 'Recommended for Employment',
                          desc: 'Cleared technical bar, recommended for permanent SWE roster.'
                        },
                        {
                          val: 'Approved for offer preparation',
                          label: 'Approved for Offer Preparation',
                          desc: 'Executive approval granted to generate binding offer terms.'
                        },
                        {
                          val: 'Internship extension proposed',
                          label: 'Internship Extension',
                          desc: 'Extend unpaid learning window before making final decision.'
                        },
                        {
                          val: 'Not selected for permanent employment',
                          label: 'Not Selected for Permanent',
                          desc: 'Internship concludes on 30 Sep 2026 without offer.'
                        }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setWizardDecisionOption(opt.val as ManagementDecisionOption)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            wizardDecisionOption === opt.val
                              ? 'bg-blue-500/15 border-blue-500 text-white shadow-sm'
                              : 'bg-brand-dark-subtle border-brand-border/60 text-brand-slate hover:bg-white/5'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{opt.label}</span>
                            {wizardDecisionOption === opt.val && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-brand-slate mt-1 leading-snug">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Decision Remarks & Business Justification <span className="text-brand-red">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={wizardDecisionRemarks}
                      onChange={(e) => setWizardDecisionRemarks(e.target.value)}
                      placeholder="Provide executive rationale..."
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-brand-slate font-semibold mb-1">
                      Deciding Authority
                    </label>
                    <input
                      type="text"
                      value={decisionActor || user?.name || 'Company Directors'}
                      onChange={(e) => setDecisionActor(e.target.value)}
                      className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PRE-PLACEMENT OFFER & TERMS */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Step 3: Define Binding PPO & Compensation Package</span>
                      <p className="text-xs text-cyan-200/80 mt-0.5">
                        Set the formal terms for regular full-time employment commencing October 2026.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Permanent Designation <span className="text-brand-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={wizardDesignation}
                        onChange={(e) => setWizardDesignation(e.target.value)}
                        placeholder="e.g. Junior Software Engineer"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={wizardDepartment}
                        onChange={(e) => setWizardDepartment(e.target.value)}
                        placeholder="e.g. Engineering"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>

                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Reporting Manager
                      </label>
                      <input
                        type="text"
                        value={wizardManager}
                        onChange={(e) => setWizardManager(e.target.value)}
                        placeholder="e.g. Siva Kumar"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>

                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Annual Compensation CTC (INR) <span className="text-brand-red">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={wizardSalary}
                          onChange={(e) => setWizardSalary(e.target.value)}
                          placeholder="e.g. 500000"
                          className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl pl-9 pr-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-bold text-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Effective Joining Date
                      </label>
                      <input
                        type="date"
                        value={wizardJoiningDate}
                        onChange={(e) => setWizardJoiningDate(e.target.value)}
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>

                    <div>
                      <label className="block text-brand-slate font-semibold mb-1">
                        Work Location
                      </label>
                      <input
                        type="text"
                        value={wizardLocation}
                        onChange={(e) => setWizardLocation(e.target.value)}
                        placeholder="e.g. Pune Global HQ"
                        className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PERMANENT CONVERSION & ROSTER ACTIVATION */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                    <Award className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm">
                        Step 4: Activate Permanent Full-Time Software Engineer Status
                      </span>
                      <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                        This irreversible action promotes <strong>{activeWizardIntern.fullName}</strong> to full-time regular employee status. The original Person ID (<strong>{activeWizardIntern.employeeId}</strong>) is preserved with zero duplicates, and salary payroll is enabled.
                      </p>
                    </div>
                  </div>

                  {/* Promotion Dossier Summary Card */}
                  <div className="p-5 rounded-2xl bg-brand-card border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-brand-slate uppercase tracking-wider">
                      Confirmed Promotion Package
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[10px] text-brand-slate">Candidate</span>
                        <div className="font-bold text-brand-ink text-sm mt-0.5">
                          {activeWizardIntern.fullName}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-slate">Preserved Employee ID</span>
                        <div className="font-mono font-bold text-brand-red text-sm mt-0.5">
                          {activeWizardIntern.employeeId}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-slate">Promoted Designation</span>
                        <div className="font-bold text-emerald-400 text-sm mt-0.5">
                          {wizardDesignation}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-slate">Annual CTC Package</span>
                        <div className="font-bold text-emerald-400 text-sm mt-0.5">
                          ₹{(parseFloat(wizardSalary || '500000') / 100000).toFixed(1)} Lakhs / year
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-slate">Effective Date</span>
                        <div className="font-mono text-brand-ink text-xs mt-0.5">
                          {wizardJoiningDate}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-slate">Arrangement</span>
                        <div className="text-brand-ink text-xs font-semibold mt-0.5">
                          Regular Full-Time (Paid)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Zero duplicate record guarantee: Roster, attendance history, and leaves remain linked to {activeWizardIntern.employeeId}.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-brand-card-hover border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWizardModalInternId(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                {wizardStep > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="text-xs"
                  >
                    Previous Step
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {wizardStep < 4 ? (
                  <Button
                    size="sm"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="text-xs bg-brand-red hover:bg-brand-red-hover text-white font-bold"
                  >
                    Next Step: Stage {wizardStep + 1}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleFastPromoteToPermanent(activeWizardIntern.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/30"
                  >
                    <Award className="w-4 h-4 mr-1.5" />
                    Confirm & Promote to Permanent Software Engineer
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InternshipLifecyclePage;
