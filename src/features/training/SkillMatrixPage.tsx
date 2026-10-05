import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  Sparkles,
  Layers,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookMarked,
  X,
  PieChart as PieIcon,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { hrmsService } from '../../services/hrmsService';
import { SkillMatrixItem, Employee } from '../../types/hrms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

const DOMAIN_COLORS: Record<string, string> = {
  Engineering: '#e11d2e',
  'Cloud & Infrastructure': '#0284c7',
  'HR & Operations': '#10b981',
  Architecture: '#a855f7',
};

// 13 Full-Time Employees & Leaders HP Enterprise Upskilling Syllabus
const EMPLOYEE_SYLLABUS = [
  {
    employeeId: 'ETHX-001',
    name: 'Ram Chaturvedi',
    designation: 'Company Director',
    department: 'Executive Board',
    workstation: 'HP Spectre x360 16" OLED (ETHX-HP-001)',
    track: 'Executive Corporate Governance & Global Strategy',
    executiveSponsor: 'Board of Directors',
    overallProgress: 99,
    capstoneStatus: 'Board Master Certified',
    capstoneScore: 100,
    modules: [
      { name: 'Global Expansion & Market Capitalization', status: 'Completed', score: '100%' },
      { name: 'Board Governance & Enterprise Valuation', status: 'Completed', score: '99%' },
      { name: 'Strategic Joint Ventures & M&A Policy', status: 'Completed', score: '98%' },
      { name: 'Fiscal Telemetry & Institutional Compliance', status: 'Completed', score: '99%' },
    ],
  },
  {
    employeeId: 'ETHX-002',
    name: 'Rohan',
    designation: 'Company Director',
    department: 'Executive Board',
    workstation: 'HP Elite Dragonfly G4 (ETHX-HP-002)',
    track: 'Enterprise Risk Management & Corporate Scale',
    executiveSponsor: 'Board of Directors',
    overallProgress: 98,
    capstoneStatus: 'Executive Governance Certified',
    capstoneScore: 98,
    modules: [
      { name: 'Enterprise Risk & Internal Controls', status: 'Completed', score: '99%' },
      { name: 'Digital Operational Excellence', status: 'Completed', score: '98%' },
      { name: 'Corporate Legal & Fiduciary Compliance', status: 'Completed', score: '97%' },
      { name: 'Talent Scaling & Leadership Succession', status: 'Completed', score: '98%' },
    ],
  },
  {
    employeeId: 'ETHX-003',
    name: 'Virender Kumar',
    designation: 'Company Director',
    department: 'Executive Board',
    workstation: 'HP ZBook Studio G9 Workstation (ETHX-HP-003)',
    track: 'US-India Cross-Border Contracts & Enterprise Sales',
    executiveSponsor: 'Board of Directors',
    overallProgress: 98,
    capstoneStatus: 'Global Commercial Strategy Lead',
    capstoneScore: 99,
    modules: [
      { name: 'US Commercial Contracting & Federal Law', status: 'Completed', score: '99%' },
      { name: 'Global Enterprise Sales Engineering', status: 'Completed', score: '98%' },
      { name: 'Cross-Border Financial Settlement', status: 'Completed', score: '97%' },
      { name: 'Enterprise Client Retention & SLA Policy', status: 'Completed', score: '98%' },
    ],
  },
  {
    employeeId: 'ETHX-004',
    name: 'Siva Kumar',
    designation: 'IT Director / Manager',
    department: 'IT & Engineering',
    workstation: 'HP ZBook Firefly 14 G10 (ETHX-HP-004)',
    track: 'Enterprise Cloud Architecture & Distributed Systems',
    executiveSponsor: 'Ram Chaturvedi (Director)',
    overallProgress: 98,
    capstoneStatus: 'Lead Cloud Architect Certified',
    capstoneScore: 98,
    modules: [
      { name: 'AWS Multi-Region High Availability', status: 'Completed', score: '99%' },
      { name: 'Frappe v15 Framework Kernel & ORM', status: 'Completed', score: '98%' },
      { name: 'Docker Swarm & Kubernetes Orchestration', status: 'Completed', score: '97%' },
      { name: 'Enterprise Information Security (ISO 27001)', status: 'Completed', score: '98%' },
    ],
  },
  {
    employeeId: 'ETHX-005',
    name: 'Niky Sharma',
    designation: 'Main HR',
    department: 'Human Resources',
    workstation: 'HP EliteBook 840 G10 (ETHX-HP-005)',
    track: 'Strategic HR Leadership & Predictive People Analytics',
    executiveSponsor: 'Virender Kumar (Director)',
    overallProgress: 97,
    capstoneStatus: 'SHRM Senior Fellow Certified',
    capstoneScore: 98,
    modules: [
      { name: 'Workforce Predictive Attrition Modeling', status: 'Completed', score: '98%' },
      { name: 'SHRM Global Compensation Benchmarking', status: 'Completed', score: '96%' },
      { name: 'ERPNext HRMS Payroll & Tax Compliance', status: 'Completed', score: '99%' },
      { name: 'Executive Leadership Talent Pipeline', status: 'Completed', score: '95%' },
    ],
  },
  {
    employeeId: 'ETHX-006',
    name: 'Madhavi Singh',
    designation: 'IT HR',
    department: 'Human Resources',
    workstation: 'HP EliteBook 840 G10 (ETHX-HP-006)',
    track: 'Tech Talent Acquisition & Mentorship Operations',
    executiveSponsor: 'Niky Sharma (Main HR)',
    overallProgress: 93,
    capstoneStatus: 'Talent Acquisition Specialist',
    capstoneScore: 94,
    modules: [
      { name: 'Full-Stack Technical Interview Rubrics', status: 'Completed', score: '95%' },
      { name: 'Internship Mentorship Governance', status: 'Completed', score: '94%' },
      { name: 'Diversity & Campus Recruitment Pipeline', status: 'Completed', score: '91%' },
      { name: 'Automated Onboarding & Asset Provisioning', status: 'Completed', score: '92%' },
    ],
  },
  {
    employeeId: 'ETHX-007',
    name: 'Shubham Patane',
    designation: 'Employee',
    department: 'IT & Engineering',
    workstation: 'HP ProBook 450 G10 (ETHX-HP-007)',
    track: 'Distributed Backend & MariaDB Performance Optimization',
    executiveSponsor: 'Siva Kumar (IT Director)',
    overallProgress: 96,
    capstoneStatus: 'Backend Engineering Lead',
    capstoneScore: 97,
    modules: [
      { name: 'Frappe Custom DocType & Hook Engines', status: 'Completed', score: '98%' },
      { name: 'MariaDB 10.6 Index & Query Optimization', status: 'Completed', score: '96%' },
      { name: 'Redis Cache Layer & Micro-Queue Design', status: 'Completed', score: '95%' },
      { name: 'High-Concurrency Webhook Pipelines', status: 'Completed', score: '95%' },
    ],
  },
  {
    employeeId: 'ETHX-008',
    name: 'Saurav Sarkar',
    designation: 'Employee',
    department: 'IT & Engineering',
    workstation: 'HP ProBook 450 G10 (ETHX-HP-008)',
    track: 'Modern Frontend Architecture & Micro-UIs',
    executiveSponsor: 'Siva Kumar (IT Director)',
    overallProgress: 94,
    capstoneStatus: 'Frontend Architect Specialist',
    capstoneScore: 95,
    modules: [
      { name: 'React 18 Concurrent Rendering & Fiber', status: 'Completed', score: '96%' },
      { name: 'Enterprise Design System & Theme Engine', status: 'Completed', score: '94%' },
      { name: 'Core Web Vitals & Bundle Optimization', status: 'Completed', score: '93%' },
      { name: 'State Synchronization with TanStack Query', status: 'Completed', score: '93%' },
    ],
  },
  {
    employeeId: 'ETHX-009',
    name: 'Vishal Walunj',
    designation: 'Employee',
    department: 'IT & Engineering',
    workstation: 'HP ProBook 450 G10 (ETHX-HP-009)',
    track: 'Enterprise Full-Stack & API Security',
    executiveSponsor: 'Siva Kumar (IT Director)',
    overallProgress: 92,
    capstoneStatus: 'Full-Stack Certified',
    capstoneScore: 93,
    modules: [
      { name: 'TypeScript 5.7 Strict Mode & Patterns', status: 'Completed', score: '94%' },
      { name: 'Frappe REST API Integration Security', status: 'Completed', score: '92%' },
      { name: 'Tailwind CSS Modern Enterprise UI', status: 'Completed', score: '91%' },
      { name: 'Cross-Origin Session & Cookie Handling', status: 'Completed', score: '91%' },
    ],
  },
  {
    employeeId: 'ETHX-010',
    name: 'Shruti Pawar',
    designation: 'Employee',
    department: 'IT & Engineering',
    workstation: 'HP EliteBook 840 G10 (ETHX-HP-010)',
    track: 'UX Engineering, Accessibility & Design Systems',
    executiveSponsor: 'Siva Kumar (IT Director)',
    overallProgress: 93,
    capstoneStatus: 'UX Lead Certified',
    capstoneScore: 94,
    modules: [
      { name: 'WCAG 2.1 AA Accessibility Standards', status: 'Completed', score: '95%' },
      { name: 'Figma to Production React Component Tokenization', status: 'Completed', score: '94%' },
      { name: 'Responsive Motion & Micro-Interactions', status: 'Completed', score: '92%' },
      { name: 'Enterprise Design Tokens & CSS Variables', status: 'Completed', score: '91%' },
    ],
  },
  {
    employeeId: 'ETHX-011',
    name: 'Ganesh Kulkarni',
    designation: 'Employee',
    department: 'IT & Engineering',
    workstation: 'HP ProBook 450 G10 (ETHX-HP-011)',
    track: 'DevOps, CI/CD Pipelines & Container Security',
    executiveSponsor: 'Siva Kumar (IT Director)',
    overallProgress: 91,
    capstoneStatus: 'DevOps Specialist Certified',
    capstoneScore: 92,
    modules: [
      { name: 'Docker Compose Multi-Container Networking', status: 'Completed', score: '93%' },
      { name: 'Linux Server Hardening & Kernel Tuning', status: 'Completed', score: '92%' },
      { name: 'Automated GitHub Actions CI/CD Workflows', status: 'Completed', score: '90%' },
      { name: 'SSL / Nginx Reverse Proxy Orchestration', status: 'Completed', score: '89%' },
    ],
  },
  {
    employeeId: 'ETHX-012',
    name: 'Archit Sharma',
    designation: 'Employee (Contract-based)',
    department: 'Contract Operations',
    workstation: 'HP EliteBook 650 G9 (ETHX-HP-012)',
    track: 'Cross-Border Delivery & SLA Management',
    executiveSponsor: 'Virender Kumar (Director)',
    overallProgress: 90,
    capstoneStatus: 'Contract Operations Lead',
    capstoneScore: 91,
    modules: [
      { name: 'US Enterprise Contract Governance', status: 'Completed', score: '93%' },
      { name: 'Remote Workforce Security Protocols', status: 'Completed', score: '90%' },
      { name: 'Agile Deliverables Sprint Tracking', status: 'Completed', score: '89%' },
      { name: 'Client Milestone Billing & Auditing', status: 'Completed', score: '88%' },
    ],
  },
  {
    employeeId: 'ETHX-013',
    name: 'Rajnesh',
    designation: 'Employee (Handles contract work)',
    department: 'Contract Operations',
    workstation: 'HP EliteBook 650 G9 (ETHX-HP-013)',
    track: 'Enterprise Procurement & Vendor Governance',
    executiveSponsor: 'Virender Kumar (Director)',
    overallProgress: 89,
    capstoneStatus: 'SLA Compliance Certified',
    capstoneScore: 90,
    modules: [
      { name: 'Vendor Legal Compliance & NDAs', status: 'Completed', score: '91%' },
      { name: 'Cross-Border Payroll Tax Compliance', status: 'Completed', score: '89%' },
      { name: 'Service Delivery Performance Audits', status: 'Completed', score: '88%' },
      { name: 'Enterprise Contract Lifecycle Management', status: 'Completed', score: '88%' },
    ],
  },
];

// 8 Interns Q3 Upskilling Syllabus & Progress Data
const INTERN_SYLLABUS = [
  {
    internId: 'ETHX-014',
    name: 'Deepti Tiwari',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-014)',
    track: 'Cloud & Full-Stack Engineering',
    mentor: 'Siva Kumar (IT Director)',
    overallProgress: 92,
    capstoneStatus: 'Completed',
    capstoneScore: 94,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '95%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '92%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '90%' },
      { name: 'Enterprise HRMS Capstone', status: 'Completed', score: '94%' },
    ],
  },
  {
    internId: 'ETHX-015',
    name: 'Goraksh Kaduskar',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-015)',
    track: 'Backend API & Infrastructure',
    mentor: 'Shubham Patane (Backend Lead)',
    overallProgress: 88,
    capstoneStatus: 'In Review',
    capstoneScore: 88,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '86%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '91%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '89%' },
      { name: 'Enterprise HRMS Capstone', status: 'In Review', score: '88%' },
    ],
  },
  {
    internId: 'ETHX-016',
    name: 'Rushikesh Kulkarni',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-016)',
    track: 'Full-Stack & ERP Integration',
    mentor: 'Vishal Walunj (Full-Stack Engineer)',
    overallProgress: 85,
    capstoneStatus: 'In Progress',
    capstoneScore: 84,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '88%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '84%' },
      { name: 'Docker & Linux Deployment', status: 'In Progress', score: '82%' },
      { name: 'Enterprise HRMS Capstone', status: 'Drafting', score: '84%' },
    ],
  },
  {
    internId: 'ETHX-017',
    name: 'Utkarsh',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-017)',
    track: 'DevOps & Cloud Systems',
    mentor: 'Ganesh Kulkarni (DevOps Engineer)',
    overallProgress: 90,
    capstoneStatus: 'Completed',
    capstoneScore: 92,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '89%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '88%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '95%' },
      { name: 'Enterprise HRMS Capstone', status: 'Completed', score: '92%' },
    ],
  },
  {
    internId: 'ETHX-018',
    name: 'Shakti Thakur',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-018)',
    track: 'Full-Stack & UI/UX Systems',
    mentor: 'Shruti Pawar (UX Lead)',
    overallProgress: 89,
    capstoneStatus: 'Completed',
    capstoneScore: 91,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '94%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '86%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '87%' },
      { name: 'Enterprise HRMS Capstone', status: 'Completed', score: '91%' },
    ],
  },
  {
    internId: 'ETHX-019',
    name: 'Sayali Mahant',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-019)',
    track: 'Frontend Architecture & State',
    mentor: 'Saurav Sarkar (Frontend Architect)',
    overallProgress: 94,
    capstoneStatus: 'Completed',
    capstoneScore: 95,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '96%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '92%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '93%' },
      { name: 'Enterprise HRMS Capstone', status: 'Completed', score: '95%' },
    ],
  },
  {
    internId: 'ETHX-020',
    name: 'Preeti Bagal',
    workstation: 'Asus Vivobook 15 (ETHX-VIVO-020)',
    track: 'Cloud & Database Engineering',
    mentor: 'Shubham Patane (Backend Lead)',
    overallProgress: 87,
    capstoneStatus: 'Submitted',
    capstoneScore: 89,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '90%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '87%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '86%' },
      { name: 'Enterprise HRMS Capstone', status: 'Review Pending', score: '89%' },
    ],
  },
  {
    internId: 'ETHX-021',
    name: 'Krishna Tiwari',
    workstation: 'Asus Vivobook 15 Pro (ETHX-VIVO-021)',
    track: 'Enterprise Architecture & Cloud Systems',
    mentor: 'Siva Kumar (IT Director)',
    overallProgress: 96,
    capstoneStatus: 'Completed',
    capstoneScore: 98,
    modules: [
      { name: 'React 18 & TypeScript 5.7', status: 'Completed', score: '98%' },
      { name: 'Frappe REST API & DocTypes', status: 'Completed', score: '97%' },
      { name: 'Docker & Linux Deployment', status: 'Completed', score: '96%' },
      { name: 'Enterprise HRMS Capstone', status: 'Approved for Review', score: '98%' },
    ],
  },
];

// Verified Certifications Held Across Workforce
const VERIFIED_CERTIFICATIONS = [
  { id: 'CERT-01', credential: 'AWS Certified Solutions Architect', authority: 'Amazon Web Services', holders: ['Siva Kumar', 'Virender Kumar'], validThrough: '2027-04-10', level: 'Professional' },
  { id: 'CERT-02', credential: 'Certified Frappe Framework Developer', authority: 'Frappe Technologies', holders: ['Siva Kumar', 'Shubham Patane', 'Krishna Tiwari'], validThrough: '2027-08-15', level: 'Specialist' },
  { id: 'CERT-03', credential: 'Meta Certified Front-End Developer', authority: 'Meta / Coursera', holders: ['Saurav Sarkar', 'Shruti Pawar', 'Sayali Mahant', 'Rushikesh Kulkarni'], validThrough: '2026-11-20', level: 'Associate' },
  { id: 'CERT-04', credential: 'SHRM Certified Professional (SHRM-CP)', authority: 'Society for HR Management', holders: ['Niky Sharma'], validThrough: '2027-01-30', level: 'Professional' },
  { id: 'CERT-05', credential: 'Docker Certified Associate (DCA)', authority: 'Mirantis / Docker Inc.', holders: ['Siva Kumar', 'Ganesh Kulkarni', 'Krishna Tiwari'], validThrough: '2026-12-15', level: 'Associate' },
  { id: 'CERT-06', credential: 'Certified ScrumMaster (CSM)', authority: 'Scrum Alliance', holders: ['Madhavi Singh', 'Archit Sharma'], validThrough: '2027-03-01', level: 'Practitioner' },
];

export const SkillMatrixPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'HR Admin' || user?.role === 'System Administrator' || user?.role === 'HR Executive' || user?.role === 'Manager';
  const isIntern = user?.designation?.toLowerCase().includes('intern') || user?.employeeId === 'ETHX-021';

  const [skills, setSkills] = useState<SkillMatrixItem[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'employees' | 'interns' | 'certifications'>(
    isIntern ? 'interns' : 'employees'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNominateModalOpen, setIsNominateModalOpen] = useState<boolean>(false);
  const [nominateSuccess, setNominateSuccess] = useState<string | null>(null);

  // New Nomination Form State
  const [nomination, setNomination] = useState({
    employeeName: '',
    skillId: 'SK-01',
    targetLevel: 'Advanced',
    programName: 'Q4 Enterprise Cloud Bootcamp',
  });

  useEffect(() => {
    hrmsService.getSkillMatrix().then(setSkills);
  }, []);

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const isShortage = s.employeeCount < s.targetDemand;
      const matchPriority =
        selectedPriority === 'All' ||
        (selectedPriority === 'Gap' && isShortage) ||
        (selectedPriority === 'Optimal' && !isShortage);
      const matchSearch =
        searchTerm === '' ||
        s.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.learningTrack && s.learningTrack.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchCat && matchPriority && matchSearch;
    });
  }, [skills, selectedCategory, selectedPriority, searchTerm]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return EMPLOYEE_SYLLABUS.filter((emp) => {
      return (
        searchTerm === '' ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.track.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.workstation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm]);

  // Filtered Interns
  const filteredInterns = useMemo(() => {
    return INTERN_SYLLABUS.filter((intern) => {
      return (
        searchTerm === '' ||
        intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.internId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.track.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.mentor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm]);

  // Aggregate Metrics
  const totalCapabilities = skills.length || 10;
  const totalProficientCount = skills.reduce((sum, s) => sum + (s.employeeCount || 0), 0) || 81;
  const optimalCoverageCount = skills.filter((s) => s.employeeCount >= s.targetDemand).length || 3;
  const skillGapsCount = skills.filter((s) => s.employeeCount < s.targetDemand).length || 7;

  const meanEmployeeProgress = Math.round(
    EMPLOYEE_SYLLABUS.reduce((sum, e) => sum + e.overallProgress, 0) / EMPLOYEE_SYLLABUS.length
  );

  const meanInternProgress = Math.round(
    INTERN_SYLLABUS.reduce((sum, i) => sum + i.overallProgress, 0) / INTERN_SYLLABUS.length
  );

  // Chart Data: Supply vs Demand
  const supplyDemandChartData = useMemo(() => {
    return skills.map((s) => ({
      name: s.skillName.split(',')[0].split('&')[0].trim(),
      active: s.employeeCount,
      target: s.targetDemand,
    }));
  }, [skills]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: DOMAIN_COLORS[name] || '#64748b',
    }));
  }, [skills]);

  const handleExportCSV = () => {
    const headers = ['Skill ID,Skill Name,Category,Target Level,Active Count,Target Demand,Gap,Learning Track'];
    const rows = filteredSkills.map((s) =>
      `"${s.id}","${s.skillName}","${s.category}","${s.proficiencyLevel}",${s.employeeCount},${s.targetDemand},${Math.max(0, s.targetDemand - s.employeeCount)},"${s.learningTrack || 'N/A'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ETHX_Skill_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // User's own personal syllabus (intern or full-time employee)
  const mySyllabus = useMemo(() => {
    const foundIntern = INTERN_SYLLABUS.find(
      (i) =>
        i.internId.toLowerCase() === user?.employeeId?.toLowerCase() ||
        (user?.name && i.name.toLowerCase() === user.name.toLowerCase())
    );
    if (foundIntern) {
      return {
        ...foundIntern,
        isInternTrack: true,
      };
    }

    const foundEmp = EMPLOYEE_SYLLABUS.find(
      (e) =>
        e.employeeId.toLowerCase() === user?.employeeId?.toLowerCase() ||
        (user?.name && e.name.toLowerCase() === user.name.toLowerCase())
    );
    if (foundEmp) {
      return {
        ...foundEmp,
        internId: foundEmp.employeeId,
        mentor: foundEmp.executiveSponsor,
        isInternTrack: false,
      };
    }

    return {
      ...INTERN_SYLLABUS[7], // Krishna Tiwari (ETHX-021)
      isInternTrack: true,
    };
  }, [user]);

  // User's own certifications
  const myCertifications = useMemo(() => {
    return VERIFIED_CERTIFICATIONS.filter(
      (c) => user?.name && c.holders.some((h) => h.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // STRICT RBAC: If logged-in user is an Employee/Intern, render EXCLUSIVELY their personal curriculum
  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        {/* Top Banner & Hero Section for Personal Curriculum */}
        <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0c121e] via-[#101726] to-[#170e17] border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                  My Engineering Syllabus &amp; Learning Track
                </span>
                <span className="text-slate-400 text-xs font-mono">• {mySyllabus.track}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                My Professional Learning &amp; Upskilling Syllabus
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Authorized corporate syllabus tracking, allocated workstation telemetry, curriculum module scores, and verified capstone progress for {user?.name || 'Krishna Tiwari'} ({user?.employeeId || 'ETHX-021'}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold shadow-lg hover:border-white/20 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-brand-red" />
                <span>Download My Syllabus (CSV)</span>
              </button>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Track: {mySyllabus.capstoneStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Personal Learning Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-card/95 border border-white/10 rounded-2xl p-5 shadow-card-dark relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">My Learning Progress</p>
                <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-display">
                  {mySyllabus.overallProgress}% <span className="text-xs font-normal text-slate-400">Completed</span>
                </h3>
                <p className="text-xs text-brand-slate mt-1">{mySyllabus.modules?.length || 4} Core Modules</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> On Schedule
              </span>
              <span className="text-slate-400 font-mono">Q3 Cohort</span>
            </div>
          </div>

          <div className="bg-brand-card/95 border border-white/10 rounded-2xl p-5 shadow-card-dark relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Assigned Workstation</p>
                <h3 className="text-base font-extrabold text-white mt-1.5 tracking-tight">
                  {mySyllabus.workstation}
                </h3>
                <p className="text-xs text-slate-400 mt-1">BitLocker Encrypted &amp; Managed</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-red/15 text-brand-red border border-brand-red/30">
                <Laptop className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-sky-400 font-semibold">100% In Custody</span>
              <Link to="/assets" className="text-brand-red hover:underline font-semibold">View Hardware</Link>
            </div>
          </div>

          <div className="bg-brand-card/95 border border-white/10 rounded-2xl p-5 shadow-card-dark relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Capstone Status</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1.5 tracking-tight font-display">
                  {mySyllabus.capstoneScore}%
                </h3>
                <p className="text-xs text-slate-300 mt-1">{mySyllabus.capstoneStatus}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">Passed Evaluation</span>
              <span className="text-slate-400 font-mono">Defense Approved</span>
            </div>
          </div>

          <div className="bg-brand-card/95 border border-white/10 rounded-2xl p-5 shadow-card-dark relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Assigned Mentor</p>
                <h3 className="text-base font-extrabold text-white mt-1.5 tracking-tight">
                  {mySyllabus.mentor || 'Siva Kumar'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Direct Technical Supervision</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-purple-300 font-semibold">Weekly Reviews</span>
              <span className="text-slate-400 font-mono">1:1 Bi-Weekly</span>
            </div>
          </div>
        </div>

        {/* Detailed Personal Learning Syllabus Dossier */}
        <Card className="p-6 relative overflow-hidden border-white/10 bg-gradient-to-br from-[#0c121e] to-[#121929]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                  {mySyllabus.internId || user?.employeeId || 'ETHX-021'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {mySyllabus.track}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Your Active Curriculum
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-display mt-2">{user?.name || mySyllabus.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Workstation: {mySyllabus.workstation} • Lead Mentor: {mySyllabus.mentor}
              </p>
            </div>

            <div className="text-right bg-black/40 border border-white/10 rounded-2xl p-4 min-w-[160px]">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Overall Progress</span>
              <div className="text-3xl font-extrabold text-sky-400 font-display mt-1">{mySyllabus.overallProgress}%</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: `${mySyllabus.overallProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Assigned Curriculum Modules ({mySyllabus.modules?.length || 4})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mySyllabus.modules?.map((mod, i) => (
                <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">MODULE 0{i + 1}</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{mod.name}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold inline-flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> {mod.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-white">{mod.score}</span>
                    <span className="text-[10px] text-slate-500 block">Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capstone Project Showcase */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-black/40 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Enterprise HRMS Capstone Defense</span>
                <span className="text-[11px] text-slate-400">
                  Status: <strong className="text-emerald-400">{mySyllabus.capstoneStatus}</strong> • Evaluation Score: <strong className="text-white">{mySyllabus.capstoneScore}%</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                Defense Approved
              </span>
            </div>
          </div>

          {/* Verified Personal Certifications */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>My Verified Accreditations &amp; Badges</span>
            </h3>

            {myCertifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myCertifications.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl bg-black/30 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {cert.level} Level
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5">{cert.credential}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Authority: {cert.authority}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Valid Through</span>
                      <span className="text-xs font-mono font-bold text-white">{cert.validThrough}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No external certifications currently linked. Complete your capstone to receive your certification badge.</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const handleNominateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNominateSuccess(`Nomination submitted for ${nomination.employeeName} in ${nomination.programName}!`);
    setIsNominateModalOpen(false);
    setTimeout(() => setNominateSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Hero Section (Focused & Clean) */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0c121e] via-[#101726] to-[#170e17] border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red-hover text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-red animate-pulse" />
                Workforce Competency Telemetry
              </span>
              <span className="text-slate-400 text-xs font-mono">• 21 Personnel Mapped (13 Staff • 8 Interns)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Enterprise Skill Matrix &amp; Professional Academy
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time competency topology, HP Enterprise employee upskilling, ASUS Vivobook intern curriculum progression, and accredited certifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold shadow-lg hover:border-white/20 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-brand-red" />
              <span>Export Matrix (CSV)</span>
            </button>
            {isAdmin ? (
              <button
                onClick={() => setIsNominateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold shadow-glow-red-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nominate for Upskilling</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Corporate Curriculum Enrolled</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {nominateSuccess && (
          <div className="relative z-10 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{nominateSuccess}</span>
            </div>
            <button onClick={() => setNominateSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4 Spacious, Balanced Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-brand-card/95 border border-brand-border/80 rounded-2xl p-5 shadow-card-dark relative overflow-hidden group hover:border-brand-red/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Tracked Capabilities</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-display">
                {totalCapabilities} <span className="text-xs font-normal text-slate-400">Core Skills</span>
              </h3>
              <p className="text-xs text-brand-slate mt-1">Engineering, Cloud &amp; Operations</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-red/15 text-brand-red border border-brand-red/30 shadow-glow-red-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Roster Mapped
            </span>
            <span className="text-slate-400 font-mono">21 Personnel</span>
          </div>
        </div>

        {/* Card 2: Employees */}
        <div className="bg-brand-card/95 border border-brand-border/80 rounded-2xl p-5 shadow-card-dark relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Staff Upskilling Pace</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-display">
                {meanEmployeeProgress}% <span className="text-xs font-normal text-slate-400">Avg Progress</span>
              </h3>
              <p className="text-xs text-brand-slate mt-1">13 Full-Time Staff on HP Fleet</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold">Continuous Dev Tracks</span>
            <span className="text-slate-400 font-mono">13 Personnel</span>
          </div>
        </div>

        {/* Card 3: Interns */}
        <div className="bg-brand-card/95 border border-brand-border/80 rounded-2xl p-5 shadow-card-dark relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Intern Academy Pace</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-display">
                {meanInternProgress}% <span className="text-xs font-normal text-slate-400">Avg Completion</span>
              </h3>
              <p className="text-xs text-brand-slate mt-1">8 Interns on Asus Vivobooks</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-sky-300 font-semibold">4 Active Modules</span>
            <span className="text-slate-400 font-mono">Q3 Cohort</span>
          </div>
        </div>

        {/* Card 4: Certifications */}
        <div className="bg-brand-card/95 border border-brand-border/80 rounded-2xl p-5 shadow-card-dark relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Industry Accreditations</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight font-display">
                {VERIFIED_CERTIFICATIONS.length} <span className="text-xs font-normal text-slate-400">Credentials</span>
              </h3>
              <p className="text-xs text-brand-slate mt-1">AWS, Frappe, Docker &amp; SHRM</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-purple-300 font-semibold">100% Verified</span>
            <span className="text-slate-400 font-mono">Active Badges</span>
          </div>
        </div>
      </div>

      {/* Spacious Secondary Navigation & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-3">
        {/* Navigation Tabs (Now featuring both Employees and Interns!) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'employees'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-300" />
            <span>Employee Upskilling Track ({EMPLOYEE_SYLLABUS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('interns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'interns'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Laptop className="w-4 h-4 text-sky-400" />
            <span>Intern Upskilling Academy ({INTERN_SYLLABUS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-brand-red text-white shadow-glow-red-sm'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Competency Matrix ({totalCapabilities})</span>
          </button>

          <button
            onClick={() => setActiveTab('certifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'certifications'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Award className="w-4 h-4 text-purple-300" />
            <span>Accreditations ({VERIFIED_CERTIFICATIONS.length})</span>
          </button>
        </div>

        {/* Search & Domain Filter Controls (Comfortable Width, Not Cramped) */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'employees'
                  ? 'Search 13 employees or tracks...'
                  : activeTab === 'interns'
                  ? 'Search 8 interns or tracks...'
                  : 'Search competencies, tracks...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-red"
            />
          </div>

          {activeTab === 'matrix' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black/40 border border-white/10 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-brand-red focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Engineering">Engineering</option>
              <option value="Cloud & Infrastructure">Cloud &amp; Infrastructure</option>
              <option value="HR & Operations">HR &amp; Operations</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB: EMPLOYEE PROFESSIONAL UPSKILLING (DEDICATED FULL-TIME HP FLEET TRACK) */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Employee Cohort Overview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0d1e1c] to-[#0c121e] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  HP Enterprise Fleet • 13 Full-Time Personnel
                </span>
                <span className="text-slate-400 text-xs font-mono">• Directors, Engineers, HR &amp; Operations</span>
              </div>
              <h2 className="text-xl font-bold text-white">HP Enterprise Workstation Professional Development &amp; Mastery Tracker</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Continuous executive leadership, distributed cloud architecture, Frappe Framework core, and people analytics roadmaps for full-time employees on assigned HP Enterprise Laptops.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400">Mean Staff Progress</span>
                <div className="text-2xl font-extrabold text-emerald-400 font-display">{meanEmployeeProgress}%</div>
              </div>
              <Link
                to="/assets"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>View HP Fleet in Assets</span>
              </Link>
            </div>
          </div>

          {/* Responsive 2-Column Grid of 13 Employee Cards (Spacious, No Congestion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredEmployees.map((emp) => {
              const isSelf = emp.employeeId === user?.employeeId || emp.name.toLowerCase() === user?.name?.toLowerCase();
              return (
                <Card
                  key={emp.employeeId}
                  className={`p-5 transition-all flex flex-col justify-between ${
                    isSelf
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20 shadow-glow-sm'
                      : 'hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-red">{emp.employeeId}</span>
                          <h3 className="font-bold text-base text-white">{emp.name}</h3>
                          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            {emp.designation}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                              Your Assigned Track
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-400 mt-1 font-medium">{emp.track}</p>
                      </div>

                    <div className="text-right">
                      <span className="font-mono text-lg font-extrabold text-white">{emp.overallProgress}%</span>
                      <span className="text-[10px] block text-slate-400">Overall</span>
                    </div>
                  </div>

                  {/* Workstation & Executive Sponsor Info */}
                  <div className="mt-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                        Workstation:
                      </span>
                      <span className="font-mono font-medium text-slate-200">{emp.workstation}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        Executive Alignment:
                      </span>
                      <span className="font-medium text-white">{emp.executiveSponsor}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-500"
                        style={{ width: `${emp.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Syllabus Modules */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professional Mastery Modules</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {emp.modules.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                          <span className="text-slate-300 truncate max-w-[140px] text-[11px]">{m.name}</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">{m.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Status */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400">Milestone:</span>
                    <span className="font-semibold text-emerald-400">{emp.capstoneStatus} ({emp.capstoneScore}%)</span>
                  </div>
                  <Link
                    to={`/employees/${emp.employeeId.toLowerCase()}`}
                    className="text-emerald-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <span>360 Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
          </div>
        </div>
      )}

      {/* TAB: INTERN UPSKILLING ACADEMY (DEDICATED ASUS VIVOBOOK COHORT WORKSPACE) */}
      {activeTab === 'interns' && (
        <div className="space-y-6">
          {/* Cohort Overview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0d1726] to-[#0c121e] border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
                  Q3 2026 Cohort (1 Jul - 30 Sep)
                </span>
                <span className="text-slate-400 text-xs font-mono">• 8 ASUS Vivobook 15 Allocations</span>
              </div>
              <h2 className="text-xl font-bold text-white">ASUS Vivobook 15 Fleet Curriculum &amp; Capstone Tracker</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Dedicated engineering syllabus tracking for the 8 Unpaid Interns. All development is conducted on assigned ASUS Vivobook 15 workstations with senior mentorship from Core Leadership.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400">Mean Cohort Progress</span>
                <div className="text-2xl font-extrabold text-sky-400 font-display">{meanInternProgress}%</div>
              </div>
              <Link
                to="/assets"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>View Hardware Fleet</span>
              </Link>
            </div>
          </div>

          {/* Responsive 2-Column Grid of 8 Intern Cards (Spacious, No Congestion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredInterns.map((intern) => {
              const isSelf = intern.internId === user?.employeeId || intern.name.toLowerCase() === user?.name?.toLowerCase();
              return (
                <Card
                  key={intern.internId}
                  className={`p-5 transition-all flex flex-col justify-between ${
                    isSelf
                      ? 'border-sky-400 ring-2 ring-sky-500/30 bg-sky-950/20 shadow-glow-sm'
                      : 'hover:border-sky-500/40'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-red">{intern.internId}</span>
                          <h3 className="font-bold text-base text-white">{intern.name}</h3>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-white uppercase tracking-wider">
                              Your Assigned Track
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-sky-400 mt-0.5 font-medium">{intern.track}</p>
                      </div>

                    <div className="text-right">
                      <span className="font-mono text-lg font-extrabold text-white">{intern.overallProgress}%</span>
                      <span className="text-[10px] block text-slate-400">Overall</span>
                    </div>
                  </div>

                  {/* Workstation & Mentor Info */}
                  <div className="mt-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-sky-400" />
                        Workstation:
                      </span>
                      <span className="font-mono font-medium text-slate-200">{intern.workstation}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        Assigned Mentor:
                      </span>
                      <span className="font-medium text-white">{intern.mentor}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${intern.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Syllabus Modules */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Modules</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {intern.modules.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                          <span className="text-slate-300 truncate max-w-[140px] text-[11px]">{m.name}</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">{m.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Capstone Status */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400">Capstone Status:</span>
                    <span className="font-semibold text-emerald-400">{intern.capstoneStatus} ({intern.capstoneScore}%)</span>
                  </div>
                  <Link
                    to={`/employees/${intern.internId.toLowerCase()}`}
                    className="text-sky-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
          </div>
        </div>
      )}

      {/* TAB: COMPETENCY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Visual Analytics Grid: Charts with Breathing Space */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Supply vs Demand */}
            <div className="lg:col-span-7">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Skill Capacity vs. Target Demand</CardTitle>
                      <p className="text-xs text-brand-slate mt-0.5">Active proficient engineers vs. approved organizational target</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-brand-red font-medium">
                        <span className="w-2.5 h-2.5 rounded bg-brand-red" /> Current Staff
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded bg-slate-600" /> Target Demand
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <div className="h-64 w-full pt-2 px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supplyDemandChartData} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={45} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0b0f19',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar dataKey="active" fill="#e11d2e" radius={[4, 4, 0, 0]} name="Active Engineers" />
                      <Bar dataKey="target" fill="#334155" radius={[4, 4, 0, 0]} name="Target Demand" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Total Engineering Deployments: <strong className="text-white">96 Competency Slots</strong></span>
                  <span className="text-emerald-400 font-medium">Optimal in 5 Domains</span>
                </div>
              </Card>
            </div>

            {/* Chart 2: Category Breakdown */}
            <div className="lg:col-span-5">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div>
                    <CardTitle>Skill Domain Breakdown</CardTitle>
                    <p className="text-xs text-brand-slate mt-0.5">Distribution across enterprise capability pillars</p>
                  </div>
                </CardHeader>

                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="#0b0f19"
                          strokeWidth={3}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0b0f19',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-white font-display">{totalCapabilities}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Skills</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {categoryChartData.map((c) => (
                      <div key={c.name} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-slate-200 font-medium">{c.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{c.value} Skills</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Core Architecture: <strong className="text-white">Frappe &amp; React</strong></span>
                  <span className="text-sky-400 font-medium">Enterprise Scalable</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Departmental Skill Competency Table with Spacious Layout */}
          <Card className="p-0 overflow-hidden">
            <CardHeader className="p-5 border-b border-white/5 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Departmental Skill Competency Inventory</CardTitle>
                <p className="text-xs text-brand-slate mt-0.5">
                  Showing {filteredSkills.length} of {totalCapabilities} competencies
                </p>
              </div>

              {/* Status Priority Filter */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="bg-black/40 border border-white/10 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-red"
                >
                  <option value="All">All Coverage Statuses</option>
                  <option value="Gap">Skill Shortage (Gaps Only)</option>
                  <option value="Optimal">Optimal Coverage</option>
                </select>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-5">Skill &amp; Specialization</th>
                    <th className="py-3.5 px-4">Category Domain</th>
                    <th className="py-3.5 px-4">Target Level</th>
                    <th className="py-3.5 px-4">Capacity Gauge</th>
                    <th className="py-3.5 px-4">Demand</th>
                    <th className="py-3.5 px-4">Coverage Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSkills.map((skill) => {
                    const isGap = skill.employeeCount < skill.targetDemand;
                    const gap = Math.max(0, skill.targetDemand - skill.employeeCount);
                    const pct = Math.min(100, Math.round((skill.employeeCount / skill.targetDemand) * 100));

                    return (
                      <tr key={skill.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-white text-sm">{skill.skillName}</div>
                          {skill.learningTrack && (
                            <div className="text-[11px] text-brand-slate flex items-center gap-1 mt-0.5">
                              <BookOpen className="w-3 h-3 text-brand-red" />
                              <span>{skill.learningTrack}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${DOMAIN_COLORS[skill.category] || '#64748b'}20`,
                              color: DOMAIN_COLORS[skill.category] || '#e2e8f0',
                              border: `1px solid ${DOMAIN_COLORS[skill.category] || '#64748b'}40`,
                            }}
                          >
                            {skill.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                              skill.proficiencyLevel === 'Advanced'
                                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                : skill.proficiencyLevel === 'Intermediate'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                            }`}
                          >
                            {skill.proficiencyLevel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 w-48">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-white font-bold">{skill.employeeCount} Experts</span>
                              <span className="text-slate-400">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-sky-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                          {skill.targetDemand} Needed
                        </td>
                        <td className="py-3.5 px-4">
                          {isGap ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {gap} Gap Target
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Optimal Coverage
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => {
                                setNomination({
                                  ...nomination,
                                  skillId: skill.id,
                                  programName: skill.learningTrack || skill.skillName,
                                });
                                setIsNominateModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-red text-slate-200 hover:text-white border border-white/10 hover:border-brand-red transition-all font-semibold text-xs"
                            >
                              <span>Nominate</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              Managed by HR
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: VERIFIED INDUSTRY ACCREDITATIONS */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#160d26] to-[#0c121e] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                  Verified Industry Credentials
                </span>
                <span className="text-slate-400 text-xs font-mono">• 6 Active Licenses</span>
              </div>
              <h2 className="text-xl font-bold text-white">Workforce Professional Accreditations &amp; Licenses</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Certified practitioner registry verifying external cloud, architecture, and framework competencies with official authority registries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-400 font-mono font-bold bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                100% Audit Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {VERIFIED_CERTIFICATIONS.map((cert) => (
              <Card key={cert.id} className="p-5 hover:border-purple-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {cert.id} • {cert.level}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{cert.credential}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{cert.authority}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Credential Holders ({cert.holders.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.holders.map((holder, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-medium">
                          <Users className="w-3 h-3 text-purple-400" />
                          {holder}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Valid Through: <strong className="text-white font-mono">{cert.validThrough}</strong></span>
                  <span className="inline-flex items-center gap-1 text-purple-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Active in ERPNext
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Nomination Modal - Admin Only */}
      {isAdmin && isNominateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1422] border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Nominate for Upskilling Program</h3>
                <p className="text-xs text-brand-slate mt-0.5">Enroll an employee into an accelerated learning track</p>
              </div>
              <button
                onClick={() => setIsNominateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNominateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee Name / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Mehta (ETHX-005) or Intern Deepti Tiwari"
                  value={nomination.employeeName}
                  onChange={(e) => setNomination({ ...nomination, employeeName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-red text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Capability</label>
                  <select
                    value={nomination.skillId}
                    onChange={(e) => setNomination({ ...nomination, skillId: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-red text-xs"
                  >
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.skillName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Proficiency</label>
                  <select
                    value={nomination.targetLevel}
                    onChange={(e) => setNomination({ ...nomination, targetLevel: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-red text-xs"
                  >
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Mastery">Mastery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Learning Track / Bootcamp Name</label>
                <input
                  type="text"
                  required
                  value={nomination.programName}
                  onChange={(e) => setNomination({ ...nomination, programName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-red text-xs"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNominateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold shadow-glow-red-sm"
                >
                  Confirm Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
