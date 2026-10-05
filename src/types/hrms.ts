export type EngagementCategory = 'Intern' | 'Employee' | 'HR' | 'IT Leadership' | 'Company Director';

export type EmploymentArrangement = 'Contract' | 'Internship' | 'Full-time' | 'Part-time' | 'Probationary' | 'Not provided';

export type CompensationStatus = 'Unpaid' | 'Paid' | 'Not provided';

export type InternshipDateState = 'Scheduled' | 'Within internship period' | 'Internship period ended';

export type InternshipAdministrativeOutcome = 'Completion pending' | 'Completed' | 'Extended' | 'Early exit';

export type EvaluationWorkflowStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Reviewed';

export type ManagementDecisionOption = 
  | 'Pending decision'
  | 'Recommended for permanent employment'
  | 'Approved for offer preparation'
  | 'Internship extension proposed'
  | 'Not selected for permanent employment'
  | 'Decision deferred';

export type OfferWorkflowStatus = 'Draft' | 'Approved' | 'Issued' | 'Accepted' | 'Rejected' | 'Withdrawn';

export type ConversionStatusLabel = 
  | 'Unpaid Intern'
  | 'Evaluation Pending'
  | 'Recommended for Employment'
  | 'Offer Approved'
  | 'Offer Accepted — Joining Pending'
  | 'Permanent Employment Active'
  | 'Internship Completed — Not Converted';

export interface EvaluationCriterion {
  id: string;
  name?: string;
  label: string;
  weight: number; // percentage
  score: number | null; // 1-5 or null (unrated, NOT zero)
  feedback: string | null;
  description?: string;
}

export interface InternEvaluationRecord {
  id: string;
  internId: string;
  internName: string;
  evaluationPeriod: string;
  assignedReviewer: string;
  assignedApprover: string;
  reviewDeadline?: string | null;
  status: EvaluationWorkflowStatus;
  workflowStatus?: EvaluationWorkflowStatus;
  rubricVersion: string;
  criteria: EvaluationCriterion[];
  calculatedScore: number | null; // transparent average excluding nulls
  strengths: string | null;
  improvementAreas: string | null;
  advisoryRecommendation?: string | null;
  overallRecommendation?: string;
  evidenceReferences?: string | null;
  submissionDate?: string | null;
  approvalDate?: string | null;
  decisionRemarks: string | null;
  isDraftPrivate?: boolean;
  history?: Array<{
    fromStatus: string;
    toStatus: string;
    actor: string;
    timestamp: string;
    reason?: string;
  }>;
  revisionHistory?: Array<{
    returnedBy: string;
    returnedDate: string;
    reason: string;
    notes: string;
  }>;
}

export interface ManagementDecisionRecord {
  id: string;
  internId: string;
  internName: string;
  evaluationId: string;
  decision: ManagementDecisionOption;
  decidedBy: string;
  decisionDate: string | null;
  decisionRemarks?: string;
  remarks: string | null;
  history: Array<{
    decision: ManagementDecisionOption;
    actor: string;
    timestamp: string;
    remarks: string;
  }>;
}

export interface EmploymentOfferRecord {
  id: string;
  internId: string;
  internName: string;
  status?: OfferWorkflowStatus;
  offerStatus?: OfferWorkflowStatus;
  terms: {
    legalEmployer: string;
    designation: string;
    department: string;
    reportingManager: string;
    employmentArrangement: string;
    proposedJoiningDate: string;
    actualJoiningDate: string | null;
    approvedSalary: number | null;
    baseSalary?: number | null;
    salaryStructure?: string | null;
    workLocation: string;
    probationTerms?: string | null;
    probationPeriod?: string | null;
  };
  preparedBy?: string | null;
  approvedBy?: string | null;
  issuedDate?: string | null;
  responseDate?: string | null;
  acceptanceStatus?: 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn' | 'Rejected';
  conversionStatus: ConversionStatusLabel;
  effectiveConversionDate?: string | null;
  activatedAt?: string | null;
  history?: Array<{
    status: string;
    actor: string;
    timestamp: string;
    remarks: string;
  }>;
}

export interface InternshipLifecycleRecord {
  internId: string;
  internName: string;
  startDate: string; // '2026-07-01'
  scheduledEndDate: string; // '2026-09-30'
  actualEndDate?: string | null;
  dateState: InternshipDateState;
  administrativeOutcome: InternshipAdministrativeOutcome;
  isExcludedFromPayroll: boolean;
  extensionHistory?: Array<{
    previousEndDate: string;
    newEndDate: string;
    reason: string;
    approvedBy: string;
    timestamp: string;
  }>;
  earlyExitDetails?: {
    exitDate: string;
    reason: string;
    approvedBy: string;
    timestamp: string;
  } | null;
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    details: string;
  }>;
}

export interface Employee {
  id: string; // name in Frappe / stable ID
  employeeId: string; // employee code
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  email: string;
  phone: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  department: string;
  designation: string;
  reportsTo?: string;
  managerName?: string;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Notice Period' | 'Terminated' | 'Suspended';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  workLocation: string;
  shift: string;
  baseSalary: number | null; // null if Not provided (NOT zero)
  salaryCurrency: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    panOrTaxId: string;
  };
  metrics?: {
    attendanceRate: number;
    leaveBalance: number;
    performanceScore: number;
    completedGoals: number;
    totalGoals: number;
  };
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  assignedAssets?: Array<{
    assetId: string;
    name: string;
    category: string;
    assignedDate: string;
  }>;
  // Specific Confirmed Separation Fields
  engagementCategory: EngagementCategory;
  organisationalRole: string;
  employmentArrangement: EmploymentArrangement;
  compensationStatus: CompensationStatus;
  stipend?: number | null;
  responsibility?: string | null;
  profileCompleteness: 'Complete' | 'Incomplete';
  missingFields: string[];
  internshipDetails?: InternshipLifecycleRecord;
  conversionDetails?: {
    conversionStatus: ConversionStatusLabel;
    permanentEmploymentActive?: boolean;
    offerId?: string;
    proposedJoiningDate?: string;
    actualJoiningDate?: string;
    effectiveDate?: string;
    effectiveJoiningDate?: string;
    convertedBy?: string;
    originalInternshipPeriod?: string;
  };
}

export interface Department {
  id: string;
  name: string;

  headOfDepartment?: string;
  headName?: string;
  parentDepartment?: string;
  headcount: number;
  openPositions: number;
  monthlyBudget: number;
}

export interface Designation {
  id: string;
  name: string;
  department: string;
  description?: string;
  jobGrade?: string;
}

export type ScheduledWorkMode = 'WFO' | 'WFH' | 'Weekly Off' | 'Holiday';
export type ActualAttendanceStatus = 'Present' | 'Absent' | 'Approved Leave' | 'Holiday' | 'Weekly Off' | 'Not Recorded' | 'Late' | 'Half Day';
export type ActualWorkMode = 'WFO' | 'WFH' | 'Not Recorded';

export interface AttendanceCorrectionLog {
  actor: string;
  actorId: string;
  timestamp: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  scheduledWorkMode?: ScheduledWorkMode;
  actualWorkMode?: ActualWorkMode;
  status: ActualAttendanceStatus;
  workHours: number;
  location?: string;
  device?: string;
  regularizationStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  regularizationReason?: string;
  correctionHistory?: AttendanceCorrectionLog[];
  conflictDetails?: string | null;
  leaveApplicationId?: string | null;
  isHistorical?: boolean;
  dataCoverage?: 'Recorded' | 'Not Recorded' | 'Pending';
  remarks?: string;
}

export type LeaveType = 
  | 'Annual Leave' 
  | 'Sick Leave' 
  | 'Casual Leave' 
  | 'Maternity/Paternity' 
  | 'Unpaid Leave'
  | 'Unpaid Internship Leave'
  | 'Academic Leave'
  | 'Medical Leave';

export type LeaveStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Cancelled' 
  | 'Pending Director Approval';

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  applicantCategory: 'Employee' | 'Intern';
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  durationOption?: 'Full Day' | 'Half Day (First Half)' | 'Half Day (Second Half)';
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  decidedBy?: string | null;
  decisionDate?: string | null;
  decisionRemarks?: string | null;
  rejectionReason?: string | null;
  conflictWithAttendance?: boolean;
  isSelfApprovalBlocked?: boolean;
  attachmentUrl?: string | null;
  managerComments?: string;
  hrComments?: string;
}

export interface LeaveBalance {
  leaveType: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  month: string;
  year: number;
  postingDate: string;
  basicSalary: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  currency: string;
  status: 'Draft' | 'Submitted' | 'Paid';
  earnings: Array<{ component: string; amount: number }>;
  deductions: Array<{ component: string; amount: number }>;
  bankAccount: string;
  paymentMethod: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  openPositions: number;
  applicantsCount: number;
  status: 'Draft' | 'Published' | 'Closed';
  publishDate: string;
  experienceLevel: string;
  salaryRange: string;
}

export interface JobApplicant {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  email: string;
  phone: string;
  stage: 'Applied' | 'Screening' | 'Technical Round' | 'HR Interview' | 'Offer Sent' | 'Hired' | 'Rejected';
  rating: number; // 1 - 5
  appliedDate: string;
  experienceYears: number;
  currentCompany?: string;
  resumeUrl?: string;
  notes?: string;
  skills?: string[];
  expectedSalary?: string;
  noticePeriod?: string;
  location?: string;
  technicalScore?: number;
  interviewNotes?: Array<{
    stage: string;
    interviewer: string;
    score: number;
    notes: string;
    date: string;
  }>;
  candidateType?: 'Intern PPO' | 'Lateral Hire' | 'Campus Fresher';
  internId?: string; // Links directly to intern employee record (e.g., emp-021)
  internshipDetails?: {
    completedPeriod: string;
    mentorScore: number;
    recommendation: string;
    mentorName?: string;
  };
  convertedToEmployee?: boolean;
  conversionDate?: string;
  offerDetails?: {
    salary: string;
    designation: string;
    joiningDate: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  };
}

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  category: 'Strategic' | 'Operational' | 'Learning' | 'Leadership';
  progress: number; // 0 - 100
  dueDate: string;
  weightage: number; // %
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Behind';
  metrics?: string;
}

export interface AppraisalCycle {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  cycleName: string;
  selfRating: number;
  managerRating: number;
  overallScore: number;
  status: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
  reviewPeriod: string;
  feedback?: string;
}

export interface SkillMatrixItem {
  id: string;
  skillName: string;
  category: 'Cloud & Infrastructure' | 'Engineering' | 'HR & Operations' | 'Finance' | 'Architecture' | string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | string;
  employeeCount: number;
  targetDemand: number;
  certifiedEmployees?: string[];
  learningTrack?: string;
  gapPriority?: 'Critical' | 'Moderate' | 'Optimal' | string;
  description?: string;
}

export interface AssetRecord {
  id: string;
  assetCode: string;
  assetName: string;
  category: 'Laptop' | 'Workstation' | 'Monitor' | 'Access Card' | 'Mobile';
  brand?: string;
  model?: string;
  specifications?: string;
  assignedTo?: string;
  assignedEmployeeName?: string;
  assignedDepartment?: string;
  allocatedDate?: string;
  status: 'In Use' | 'Available' | 'Under Maintenance';
  purchaseDate: string;
  warrantyExpiry?: string;
  serialNumber: string;
  condition?: 'Brand New' | 'Excellent' | 'Good' | 'Needs Service';
}

export interface HRNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'leave' | 'attendance' | 'payroll' | 'recruitment' | 'performance' | 'system';
  read: boolean;
  actionUrl?: string;
}
