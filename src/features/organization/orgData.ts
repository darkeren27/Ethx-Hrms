import { 
  OrgNode, 
  DepartmentDetail, 
  JobGradeInfo, 
  DesignationDetail, 
  GeoHub, 
  SuccessionPlan,
  SpanAuditRecord 
} from './types';

export const INITIAL_ORG_HIERARCHY: OrgNode = {
  id: 'ETHX-001',
  name: 'Ram Chaturvedi',
  role: 'Company Director',
  department: 'Executive Board',
  departmentId: 'DEP-EXEC',
  tier: 'C-Suite',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  email: 'ram.chaturvedi@ethxsoftcon.com',
  phone: 'Not provided',
  location: 'Pune HQ (Main Campus)',
  country: 'India',
  workModality: 'Pune HQ',
  contractType: 'Permanent Leadership',
  directReportsCount: 4,
  totalTeamSize: 21,
  performanceScore: 98,
  status: 'In Office',
  jobGrade: 'EXEC',
  baseSalary: 0,
  budgetControlled: 5000000,
  tenure: '4.5 Years',
  skills: ['Corporate Governance', 'Executive Leadership', 'Board Strategy', 'Enterprise Expansion'],
  bio: 'Company Director on the ETHX Softcon Executive Board. Oversees corporate strategy, enterprise governance, and organizational calibration.',
  children: [
    {
      id: 'ETHX-002',
      name: 'Rohan',
      role: 'Company Director',
      department: 'Executive Board',
      departmentId: 'DEP-EXEC',
      tier: 'C-Suite',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      email: 'rohan@ethxsoftcon.com',
      phone: 'Not provided',
      location: 'Pune HQ (Main Campus)',
      country: 'India',
      workModality: 'Pune HQ',
      contractType: 'Permanent Leadership',
      directReportsCount: 0,
      totalTeamSize: 1,
      performanceScore: 96,
      status: 'In Office',
      jobGrade: 'EXEC',
      baseSalary: 0,
      tenure: '4.0 Years',
      reportsToId: 'ETHX-001',
      skills: ['Strategic Planning', 'Executive Oversight', 'Corporate Growth'],
      bio: 'Company Director on the ETHX Softcon Executive Board. Preserved single name record.'
    },
    {
      id: 'ETHX-003',
      name: 'Virender Kumar',
      role: 'Company Director',
      department: 'Executive Board',
      departmentId: 'DEP-EXEC',
      tier: 'C-Suite',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      email: 'virender.kumar@ethxsoftcon.com',
      phone: 'Not provided',
      location: 'Pune HQ (Main Campus)',
      country: 'India',
      workModality: 'Pune HQ',
      contractType: 'Permanent Leadership',
      directReportsCount: 2,
      totalTeamSize: 3,
      performanceScore: 97,
      status: 'In Office',
      jobGrade: 'EXEC',
      baseSalary: 0,
      tenure: '4.2 Years',
      reportsToId: 'ETHX-001',
      skills: ['International Business', 'US Contract Business', 'Client Solutions', 'Commercial Governance'],
      bio: 'Company Director. Handles ETHXSOFTCON US-based contract business and client engagements.',
      children: [
        {
          id: 'ETHX-012',
          name: 'Archit Sharma',
          role: 'Employee (Contract-based)',
          department: 'Contract Operations',
          departmentId: 'DEP-OPS',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
          email: 'archit.sharma@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Contract WFH (Pan-India)',
          country: 'India',
          workModality: 'Contract WFH',
          contractType: 'Deliverable Contract',
          contractPeriod: 'Contract Engagement',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 92,
          status: 'Remote',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.2 Years',
          reportsToId: 'ETHX-003',
          skills: ['Contract Delivery', 'Client Solutions', 'Fullstack Systems'],
          bio: 'Employee engaged on a contract basis for client technical deliverables.'
        },
        {
          id: 'ETHX-013',
          name: 'Rajnesh',
          role: 'Employee (Handles contract-related work)',
          department: 'Contract Operations',
          departmentId: 'DEP-OPS',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
          email: 'rajnesh@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 91,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.5 Years',
          reportsToId: 'ETHX-003',
          skills: ['Contract Coordination', 'Operations Management', 'Vendor Relations'],
          bio: 'Employee who handles contract-related work and vendor coordination. Personal employment arrangement unspecified.'
        }
      ]
    },
    {
      id: 'ETHX-004',
      name: 'Siva Kumar',
      role: 'IT Director / Manager',
      department: 'IT & Engineering',
      departmentId: 'DEP-IT',
      tier: 'Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      email: 'siva.kumar@ethxsoftcon.com',
      phone: 'Not provided',
      location: 'Pune HQ (Main Campus)',
      country: 'India',
      workModality: 'Pune HQ',
      contractType: 'Permanent Leadership',
      directReportsCount: 13,
      totalTeamSize: 14,
      performanceScore: 95,
      status: 'In Office',
      jobGrade: 'L8',
      baseSalary: 0,
      budgetControlled: 1200000,
      tenure: '3.5 Years',
      reportsToId: 'ETHX-001',
      skills: ['IT Architecture', 'Engineering Management', 'Team Leadership', 'ERP Systems', 'Technical Mentorship'],
      bio: 'IT Director / Manager leading technology operations, product engineering, and mentorship across general employees and the internship cohort.',
      children: [
        {
          id: 'ETHX-007',
          name: 'Shubham Patane',
          role: 'Employee',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          email: 'shubham.patane@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 91,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.0 Year',
          reportsToId: 'ETHX-004',
          skills: ['Software Engineering', 'System Architecture', 'Database Systems'],
          bio: 'Confirmed Employee in IT & Engineering.'
        },
        {
          id: 'ETHX-008',
          name: 'Saurav Sarkar',
          role: 'Employee',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
          email: 'saurav.sarkar@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 90,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.0 Year',
          reportsToId: 'ETHX-004',
          skills: ['Backend Development', 'API Design', 'Cloud Deployments'],
          bio: 'Confirmed Employee in IT & Engineering.'
        },
        {
          id: 'ETHX-009',
          name: 'Vishal Walunj',
          role: 'Employee',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
          email: 'vishal.walunj@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 89,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.0 Year',
          reportsToId: 'ETHX-004',
          skills: ['Frontend Engineering', 'State Management', 'UI/UX Performance'],
          bio: 'Confirmed Employee in IT & Engineering.'
        },
        {
          id: 'ETHX-010',
          name: 'Shruti Pawar',
          role: 'Employee',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
          email: 'shruti.pawar@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 93,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.0 Year',
          reportsToId: 'ETHX-004',
          skills: ['Quality Assurance', 'Test Automation', 'Continuous Integration'],
          bio: 'Confirmed Employee in IT & Engineering.'
        },
        {
          id: 'ETHX-011',
          name: 'Ganesh Kulkarni',
          role: 'Employee',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Engineer',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
          email: 'ganesh.kulkarni@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 88,
          status: 'In Office',
          jobGrade: 'L4',
          baseSalary: 0,
          tenure: '1.0 Year',
          reportsToId: 'ETHX-004',
          skills: ['DevOps', 'Infrastructure', 'Linux Systems'],
          bio: 'Confirmed Employee in IT & Engineering.'
        },
        // 8 Unpaid Interns (1 July – 30 September 2026)
        {
          id: 'ETHX-014',
          name: 'Deepti Tiwari',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          email: 'deepti.tiwari@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 88,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Web Development', 'Algorithms', 'TypeScript'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-015',
          name: 'Goraksh Kaduskar',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
          email: 'goraksh.kaduskar@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 86,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Python', 'SQL', 'Data Analytics'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-016',
          name: 'Rushikesh Kulkarni',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
          email: 'rushikesh.kulkarni@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 90,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['React', 'Node.js', 'API Integration'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-017',
          name: 'Utkarsh',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          email: 'utkarsh@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 92,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Cloud Architecture', 'DevOps', 'Microservices'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Single name preserved. Excluded from salary payroll.'
        },
        {
          id: 'ETHX-018',
          name: 'Shakti Thakur',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
          email: 'shakti.thakur@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 87,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Backend Systems', 'PostgreSQL', 'Java'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-019',
          name: 'Sayali Mahant',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
          email: 'sayali.mahant@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 91,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Frontend Engineering', 'TailwindCSS', 'JavaScript'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-020',
          name: 'Preeti Bagal',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
          email: 'preeti.bagal@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 89,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Software Quality', 'Functional Testing', 'Agile Principles'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        },
        {
          id: 'ETHX-021',
          name: 'Krishna Tiwari',
          role: 'Unpaid Intern',
          department: 'IT & Engineering',
          departmentId: 'DEP-IT',
          tier: 'Associate',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          email: 'krishna.tiwari@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Deliverable Contract',
          contractPeriod: '1 Jul 2026 - 30 Sep 2026',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 94,
          status: 'In Office',
          jobGrade: 'L1/L2',
          baseSalary: 0,
          tenure: '3 Months (Internship)',
          reportsToId: 'ETHX-004',
          skills: ['Enterprise Systems', 'React', 'Fullstack Architecture'],
          bio: 'Unpaid Intern (July–September 2026 Cohort). Excluded from salary payroll. Eligible for evaluation.'
        }
      ]
    },
    {
      id: 'ETHX-005',
      name: 'Niky Sharma',
      role: 'Main HR',
      department: 'Human Resources',
      departmentId: 'DEP-HR',
      tier: 'Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      email: 'niky.sharma@ethxsoftcon.com',
      phone: 'Not provided',
      location: 'Pune HQ (Main Campus)',
      country: 'India',
      workModality: 'Pune HQ',
      contractType: 'Permanent Leadership',
      directReportsCount: 1,
      totalTeamSize: 2,
      performanceScore: 96,
      status: 'In Office',
      jobGrade: 'L8',
      baseSalary: 0,
      budgetControlled: 250000,
      tenure: '3.0 Years',
      reportsToId: 'ETHX-001',
      skills: ['Strategic Human Resources', 'Organizational Governance', 'Talent Operations', 'Compliance'],
      bio: 'Main HR lead at ETHX Softcon. Oversees corporate people operations, directory governance, and talent policies.',
      children: [
        {
          id: 'ETHX-006',
          name: 'Madhavi Singh',
          role: 'IT HR',
          department: 'Human Resources',
          departmentId: 'DEP-HR',
          tier: 'Specialist',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
          email: 'madhavi.singh@ethxsoftcon.com',
          phone: 'Not provided',
          location: 'Pune HQ (Main Campus)',
          country: 'India',
          workModality: 'Pune HQ',
          contractType: 'Permanent Core',
          directReportsCount: 0,
          totalTeamSize: 1,
          performanceScore: 93,
          status: 'In Office',
          jobGrade: 'L6',
          baseSalary: 0,
          tenure: '2.0 Years',
          reportsToId: 'ETHX-005',
          skills: ['Technical Recruiting', 'IT Talent Partnering', 'Internship Management', 'HR Operations'],
          bio: 'IT HR partner at ETHX Softcon managing technical talent acquisition and cohort coordination.'
        }
      ]
    }
  ]
};

export const INITIAL_DEPARTMENT_DETAILS: DepartmentDetail[] = [
  {
    id: 'DEP-EXEC',
    name: 'Executive Board',
    code: 'EXEC',
    headOfDepartment: 'ETHX-001',
    headName: 'Ram Chaturvedi',
    headAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    headcount: 3,
    openPositions: 0,
    monthlyBudget: 0,
    annualBudget: 0,
    budgetSpent: 0,
    healthScore: 98,
    locations: ['Pune HQ (Main Campus)'],
    description: 'Corporate directors, executive board oversight, enterprise growth, and US-based contract governance.',
    subUnits: ['Board Governance', 'US Contract Operations (Virender Kumar)']
  },
  {
    id: 'DEP-IT',
    name: 'IT & Engineering',
    code: 'IT',
    headOfDepartment: 'ETHX-004',
    headName: 'Siva Kumar',
    headAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    headcount: 14,
    openPositions: 2,
    monthlyBudget: 0,
    annualBudget: 0,
    budgetSpent: 0,
    healthScore: 95,
    locations: ['Pune HQ (Main Campus)'],
    description: 'Core product engineering, software platforms, and the July–September 2026 internship cohort.',
    subUnits: ['Engineering Staff (5)', 'Internship Cohort (8)']
  },
  {
    id: 'DEP-HR',
    name: 'Human Resources',
    code: 'HR',
    headOfDepartment: 'ETHX-005',
    headName: 'Niky Sharma',
    headAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    headcount: 2,
    openPositions: 1,
    monthlyBudget: 0,
    annualBudget: 0,
    budgetSpent: 0,
    healthScore: 96,
    locations: ['Pune HQ (Main Campus)'],
    description: 'Workforce governance, people experience, talent acquisition, and internship evaluation management.',
    subUnits: ['Main HR Operations', 'IT HR Partnering']
  },
  {
    id: 'DEP-OPS',
    name: 'Contract Operations',
    code: 'OPS',
    headOfDepartment: 'ETHX-003',
    headName: 'Virender Kumar',
    headAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    headcount: 2,
    openPositions: 0,
    monthlyBudget: 0,
    annualBudget: 0,
    budgetSpent: 0,
    healthScore: 92,
    locations: ['Pune HQ / Pan-India Contract WFH'],
    description: 'Handles ETHXSOFTCON US-based contract business and specialized contractor deliverables.',
    subUnits: ['Contract Engagements', 'Client Delivery Operations']
  }
];

export const JOB_GRADES: JobGradeInfo[] = [
  {
    grade: 'EXEC',
    title: 'Company Directors & Board Officers',
    levelCategory: 'Executive',
    minSalary: 175000,
    midSalary: 215000,
    maxSalary: 270000,
    activeHeadcount: 3,
    standardBonusPct: 35,
    equityEligible: true,
    requiredExperienceYears: '10+ Years',
    coreCompetencies: ['Enterprise Governance', 'Visionary Strategy', 'Board Reporting']
  },
  {
    grade: 'L8',
    title: 'Department Directors / Managers',
    levelCategory: 'Director',
    minSalary: 145000,
    midSalary: 170000,
    maxSalary: 205000,
    activeHeadcount: 2,
    standardBonusPct: 25,
    equityEligible: true,
    requiredExperienceYears: '8+ Years',
    coreCompetencies: ['Technical Leadership', 'Team Mentorship', 'Delivery Execution']
  },
  {
    grade: 'L6',
    title: 'Domain Specialists',
    levelCategory: 'Staff / Principal',
    minSalary: 110000,
    midSalary: 130000,
    maxSalary: 155000,
    activeHeadcount: 1,
    standardBonusPct: 15,
    equityEligible: true,
    requiredExperienceYears: '4+ Years',
    coreCompetencies: ['Talent Sourcing', 'IT HR Advisory', 'Process Compliance']
  },
  {
    grade: 'L4',
    title: 'Engineers & Staff Members',
    levelCategory: 'Mid-Level',
    minSalary: 85000,
    midSalary: 96000,
    maxSalary: 110000,
    activeHeadcount: 7,
    standardBonusPct: 10,
    equityEligible: false,
    requiredExperienceYears: '2 - 5 Years',
    coreCompetencies: ['Feature Implementation', 'Code Quality', 'Client Delivery']
  },
  {
    grade: 'L1/L2',
    title: 'Unpaid Interns (Cohort)',
    levelCategory: 'Associate',
    minSalary: 0,
    midSalary: 0,
    maxSalary: 0,
    activeHeadcount: 8,
    standardBonusPct: 0,
    equityEligible: false,
    requiredExperienceYears: '0 - 1 Years',
    coreCompetencies: ['Learning Agility', 'Task Execution', 'Team Collaboration']
  }
];

export const INITIAL_DESIGNATIONS_DETAIL: DesignationDetail[] = [
  {
    id: 'DES-01',
    name: 'Company Director',
    department: 'Executive Board',
    jobGrade: 'EXEC',
    reportsToDesignation: 'Executive Board',
    headcount: 3,
    openOpenings: 0,
    description: 'Corporate oversight and enterprise strategy. Confirmed directors: Ram Chaturvedi, Rohan, Virender Kumar.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-02',
    name: 'IT Director / Manager',
    department: 'IT & Engineering',
    jobGrade: 'L8',
    reportsToDesignation: 'Company Director',
    headcount: 1,
    openOpenings: 0,
    description: 'Leads technology, software development, and manages engineering employees and interns.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-03',
    name: 'Main HR',
    department: 'Human Resources',
    jobGrade: 'L8',
    reportsToDesignation: 'Company Director',
    headcount: 1,
    openOpenings: 0,
    description: 'Organizational people operations lead and HR policy governance.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-04',
    name: 'IT HR',
    department: 'Human Resources',
    jobGrade: 'L6',
    reportsToDesignation: 'Main HR',
    headcount: 1,
    openOpenings: 0,
    description: 'Technical talent partner, internship cohort management, and hiring operations.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-05',
    name: 'Employee',
    department: 'IT & Engineering',
    jobGrade: 'L4',
    reportsToDesignation: 'IT Director / Manager',
    headcount: 5,
    openOpenings: 1,
    description: 'Confirmed general employees in software and technology operations.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-06',
    name: 'Employee (Contract-based)',
    department: 'Contract Operations',
    jobGrade: 'L4',
    reportsToDesignation: 'Company Director',
    headcount: 1,
    openOpenings: 0,
    description: 'Employee engaged on a contract basis for client technical deliverables.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-07',
    name: 'Employee (Handles contract-related work)',
    department: 'Contract Operations',
    jobGrade: 'L4',
    reportsToDesignation: 'Company Director',
    headcount: 1,
    openOpenings: 0,
    description: 'Employee who handles contract-related work and vendor coordination.',
    salaryMin: 0,
    salaryMax: 0
  },
  {
    id: 'DES-08',
    name: 'Unpaid Intern',
    department: 'IT & Engineering',
    jobGrade: 'L1/L2',
    reportsToDesignation: 'IT Director / Manager',
    headcount: 8,
    openOpenings: 0,
    description: 'Unpaid internship cohort (1 July – 30 September 2026). Excluded from salary payroll.',
    salaryMin: 0,
    salaryMax: 0
  }
];

export const INITIAL_GEO_HUBS: GeoHub[] = [
  {
    id: 'HUB-PUN',
    name: 'Pune Global Headquarters (Main Campus)',
    city: 'Pune',
    country: 'India',
    flag: '🇮🇳',
    type: 'Global Headquarters',
    headcount: 19,
    onSiteCount: 19,
    hybridCount: 0,
    remoteCount: 0,
    directorName: 'Ram Chaturvedi',
    address: 'ETHX Softcon Tech Park, Hinjewadi / Viman Nagar, Pune, Maharashtra 411057, India',
    timeZone: 'IST (UTC+5:30)'
  },
  {
    id: 'HUB-CON',
    name: 'Contract Operations & WFH Delivery',
    city: 'Pan-India Remote',
    country: 'India',
    flag: '🌐',
    type: 'Contract WFH Network',
    headcount: 2,
    onSiteCount: 0,
    hybridCount: 0,
    remoteCount: 2,
    directorName: 'Virender Kumar',
    address: 'Pan-India Remote Contract Delivery Hub (US Contract Business)',
    timeZone: 'IST / EST'
  }
];

export const INITIAL_SUCCESSION_PLANS: SuccessionPlan[] = [
  {
    roleId: 'SUC-01',
    roleTitle: 'IT Director / Manager',
    department: 'IT & Engineering',
    criticality: 'Mission Critical',
    currentIncumbent: {
      id: 'ETHX-004',
      name: 'Siva Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      tenure: '3.5 Years',
      flightRisk: 'Low'
    },
    successors: [
      {
        id: 'ETHX-007',
        name: 'Shubham Patane',
        currentRole: 'Employee',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        readiness: '1-2 Years',
        performanceRating: 91,
        developmentNeeds: ['System Architecture Leadership', 'Sprint Management']
      },
      {
        id: 'ETHX-008',
        name: 'Saurav Sarkar',
        currentRole: 'Employee',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        readiness: '1-2 Years',
        performanceRating: 90,
        developmentNeeds: ['Cloud Deployment Governance']
      }
    ],
    benchStrengthScore: 91
  },
  {
    roleId: 'SUC-02',
    roleTitle: 'Main HR',
    department: 'Human Resources',
    criticality: 'Mission Critical',
    currentIncumbent: {
      id: 'ETHX-005',
      name: 'Niky Sharma',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      tenure: '3.0 Years',
      flightRisk: 'Low'
    },
    successors: [
      {
        id: 'ETHX-006',
        name: 'Madhavi Singh',
        currentRole: 'IT HR',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        readiness: 'Ready Now',
        performanceRating: 93,
        developmentNeeds: ['Executive Board Compensation Modeling']
      }
    ],
    benchStrengthScore: 93
  },
  {
    roleId: 'SUC-03',
    roleTitle: 'US Contract Business Lead',
    department: 'Contract Operations',
    criticality: 'Mission Critical',
    currentIncumbent: {
      id: 'ETHX-003',
      name: 'Virender Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      tenure: '4.2 Years',
      flightRisk: 'Low'
    },
    successors: [
      {
        id: 'ETHX-012',
        name: 'Archit Sharma',
        currentRole: 'Employee (Contract-based)',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        readiness: '1-2 Years',
        performanceRating: 92,
        developmentNeeds: ['Client SLA Contract Negotiations']
      }
    ],
    benchStrengthScore: 92
  }
];

export function generateSpanAuditRecords(root: OrgNode = INITIAL_ORG_HIERARCHY, level: number = 1): SpanAuditRecord[] {
  const records: SpanAuditRecord[] = [];

  function traverse(node: OrgNode, depth: number) {
    if (node.children && node.children.length > 0) {
      const directCount = node.children.length;
      let totalDescendants = 0;

      function countSub(n: OrgNode) {
        if (n.children) {
          totalDescendants += n.children.length;
          n.children.forEach(countSub);
        }
      }
      node.children.forEach(c => {
        if (c.children) countSub(c);
      });

      let health: 'Optimal' | 'Under-Leveraged' | 'Overburdened' = 'Optimal';
      let rec = 'Healthy delegation span for high-autonomy teams.';

      if (directCount <= 2) {
        health = 'Under-Leveraged';
        rec = 'Manager has bandwidth to absorb 2-3 additional direct reports or take on broader strategic purview.';
      } else if (directCount >= 6) {
        health = 'Optimal';
        rec = 'Broad delegation spanning engineering staff and cohort mentees.';
      }

      records.push({
        managerId: node.id,
        managerName: node.name,
        role: node.role,
        department: node.department,
        tier: node.tier,
        avatar: node.avatar,
        directReports: directCount,
        totalReports: totalDescendants,
        spanRatio: `1 : ${directCount}`,
        spanHealth: health,
        recommendation: rec,
        depthLevel: depth
      });

      node.children.forEach(child => traverse(child, depth + 1));
    }
  }

  traverse(root, level);
  return records;
}

// Local Storage Sync Helpers
export function getSavedDepartments(): DepartmentDetail[] {
  try {
    const raw = localStorage.getItem('ethx_org_departments_v5');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some((d: any) => d.headName?.includes('Roy'))) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DEPARTMENT_DETAILS;
}

export function saveDepartments(departments: DepartmentDetail[]) {
  try {
    localStorage.setItem('ethx_org_departments_v5', JSON.stringify(departments));
    const standard = departments.map(d => ({
      id: d.id,
      name: d.name,
      headOfDepartment: d.headOfDepartment,
      headName: d.headName,
      headcount: d.headcount,
      openPositions: d.openPositions,
      monthlyBudget: d.monthlyBudget,
    }));
    localStorage.setItem('ethx_departments', JSON.stringify(standard));
  } catch (e) {
    console.error(e);
  }
}

export function getSavedDesignations(): DesignationDetail[] {
  try {
    const raw = localStorage.getItem('ethx_org_designations_v5');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DESIGNATIONS_DETAIL;
}

export function saveDesignations(designations: DesignationDetail[]) {
  try {
    localStorage.setItem('ethx_org_designations_v5', JSON.stringify(designations));
    const standard = designations.map(d => ({
      id: d.id,
      name: d.name,
      department: d.department,
      jobGrade: d.jobGrade,
      description: d.description,
    }));
    localStorage.setItem('ethx_designations', JSON.stringify(standard));
  } catch (e) {
    console.error(e);
  }
}
