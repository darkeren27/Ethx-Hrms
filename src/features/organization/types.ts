export type OrgTier = 'C-Suite' | 'Director' | 'Lead Architect' | 'Specialist' | 'Engineer' | 'Associate';

export type EmployeeStatus = 'In Office' | 'Remote' | 'On Leave' | 'Business Travel';

export type WorkModality = 'Pune HQ' | 'Contract WFH';

export interface OrgNode {
  id: string; // e.g. ETHX-001
  name: string;
  role: string;
  department: string;
  departmentId: string;
  tier: OrgTier;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  workModality?: WorkModality;
  contractType?: 'Permanent Leadership' | 'Permanent Core' | 'Deliverable Contract' | 'Staff Augmentation' | 'Retainer SLA';
  contractPeriod?: string;
  directReportsCount: number;
  totalTeamSize: number;
  performanceScore: number;
  status: EmployeeStatus;
  jobGrade: string; // e.g. EXEC, L8, L7, L6, L5, L4, L3
  baseSalary: number;
  budgetControlled?: number;
  tenure: string;
  reportsToId?: string;
  skills: string[];
  bio?: string;
  children?: OrgNode[];
}

export interface DepartmentDetail {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string; // employee ID
  headName: string;
  headAvatar: string;
  headcount: number;
  openPositions: number;
  monthlyBudget: number;
  annualBudget: number;
  budgetSpent: number;
  healthScore: number; // 0-100
  locations: string[];
  description: string;
  subUnits: string[];
}

export interface JobGradeInfo {
  grade: string; // EXEC, L8, L7, L6, L5, L4, L3, L2, L1
  title: string;
  levelCategory: 'Executive' | 'Director' | 'Staff / Principal' | 'Senior' | 'Mid-Level' | 'Associate';
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  activeHeadcount: number;
  standardBonusPct: number;
  equityEligible: boolean;
  requiredExperienceYears: string;
  coreCompetencies: string[];
}

export interface DesignationDetail {
  id: string;
  name: string;
  department: string;
  jobGrade: string;
  reportsToDesignation: string;
  headcount: number;
  openOpenings: number;
  description: string;
  salaryMin: number;
  salaryMax: number;
}

export interface SpanAuditRecord {
  managerId: string;
  managerName: string;
  role: string;
  department: string;
  tier: OrgTier;
  avatar: string;
  directReports: number;
  totalReports: number;
  spanRatio: string;
  spanHealth: 'Optimal' | 'Under-Leveraged' | 'Overburdened';
  recommendation: string;
  depthLevel: number;
}

export interface GeoHub {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  type: 'Global Headquarters' | 'Innovation Hub' | 'Regional Office' | 'Technology Center' | 'Virtual Zone' | 'Contract WFH Network';
  headcount: number;
  onSiteCount: number;
  hybridCount: number;
  remoteCount: number;
  directorName: string;
  address: string;
  timeZone: string;
}

export interface SuccessionPlan {
  roleId: string;
  roleTitle: string;
  department: string;
  criticality: 'High Priority' | 'Mission Critical' | 'Strategic';
  currentIncumbent: {
    id: string;
    name: string;
    avatar: string;
    tenure: string;
    flightRisk: 'Low' | 'Moderate' | 'Elevated';
  };
  successors: Array<{
    id: string;
    name: string;
    currentRole: string;
    avatar: string;
    readiness: 'Ready Now' | '1-2 Years' | 'Emergency Backup';
    performanceRating: number;
    developmentNeeds: string[];
  }>;
  benchStrengthScore: number; // 0-100
}

export interface ReorgSimulation {
  employeeId: string;
  employeeName: string;
  currentManagerId: string;
  proposedManagerId: string;
  currentDepartment: string;
  proposedDepartment: string;
  status: 'Pending' | 'Applied';
  dateSimulated: string;
}
