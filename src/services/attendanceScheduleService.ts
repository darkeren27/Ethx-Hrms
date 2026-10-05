import { 
  AttendanceRecord, 
  ScheduledWorkMode, 
  ActualAttendanceStatus, 
  ActualWorkMode,
  Employee,
  LeaveApplication 
} from '../types/hrms';

// Configurable Admin Authorization
// Niky Sharma is the designated HR administrator for Attendance & Leave Management
export const AUTHORIZED_ATTENDANCE_LEAVE_ADMIN_IDS: string[] = ['emp-005', 'ETHX-005', 'ETHX-726', 'usr-niky'];
export const AUTHORIZED_ALTERNATIVE_LEAVE_APPROVER_IDS: string[] = ['emp-001', 'ETHX-001']; // Ram Chaturvedi (Company Director)

export function isAuthorizedAttendanceLeaveAdmin(
  userIdOrEmployeeId?: string | null,
  userName?: string | null
): boolean {
  if (!userIdOrEmployeeId && !userName) return false;
  const id = (userIdOrEmployeeId || '').trim().toLowerCase();
  const name = (userName || '').trim().toLowerCase();

  // Match canonical Niky Sharma IDs
  if (
    AUTHORIZED_ATTENDANCE_LEAVE_ADMIN_IDS.some((aid) => aid.toLowerCase() === id) ||
    id.includes('niky') ||
    id === 'ethx-005' ||
    id === 'emp-005' ||
    id === 'ethx-726'
  ) {
    return true;
  }

  // Match if authenticated identity is Niky Sharma
  if (name === 'niky sharma' || name.startsWith('niky') || name.includes('niky')) {
    return true;
  }

  return false;
}

export function isAuthorizedAlternativeLeaveApprover(
  userIdOrEmployeeId?: string | null,
  userName?: string | null
): boolean {
  if (!userIdOrEmployeeId && !userName) return false;
  const id = (userIdOrEmployeeId || '').trim();
  const name = (userName || '').trim().toLowerCase();

  if (AUTHORIZED_ALTERNATIVE_LEAVE_APPROVER_IDS.includes(id)) {
    return true;
  }
  if (name.includes('ram chaturvedi') || name.startsWith('ram')) {
    return true;
  }
  return false;
}

// Internship Dates
export const INTERNSHIP_START_DATE = '2026-07-01';
export const INTERNSHIP_END_DATE = '2026-09-30';

export type PersonnelCategoryFilter = 
  | 'All' 
  | 'Intern' 
  | 'Employee' 
  | 'HR' 
  | 'IT Leadership' 
  | 'Company Director' 
  | 'Contract';

export function getPersonnelCategory(emp?: Employee, employeeName?: string): {
  key: PersonnelCategoryFilter;
  label: string;
  badgeVariant: 'red' | 'rose' | 'purple' | 'info' | 'cyan' | 'neutral' | 'warning';
} {
  const name = emp?.fullName || employeeName || '';
  const cat = emp?.engagementCategory;
  const arr = emp?.employmentArrangement;

  if (
    cat === 'Intern' || 
    (name.toLowerCase().includes('tiwari') && name.toLowerCase().includes('krishna') && cat !== 'HR') || 
    ['Deepti Tiwari', 'Goraksh Kaduskar', 'Rushikesh Kulkarni', 'Utkarsh', 'Shakti Thakur', 'Sayali Mahant', 'Preeti Bagal', 'Krishna Tiwari'].includes(name)
  ) {
    return { key: 'Intern', label: 'Unpaid Intern', badgeVariant: 'warning' };
  }
  if (cat === 'Company Director' || ['Ram Chaturvedi', 'Rohan', 'Virender Kumar'].includes(name)) {
    return { key: 'Company Director', label: 'Company Director', badgeVariant: 'purple' };
  }
  if (cat === 'IT Leadership' || name === 'Siva Kumar') {
    return { key: 'IT Leadership', label: 'IT Director / Mgr', badgeVariant: 'info' };
  }
  if (cat === 'HR' || ['Niky Sharma', 'Madhavi Singh'].includes(name)) {
    return { 
      key: 'HR', 
      label: name === 'Niky Sharma' ? 'Main HR Admin' : 'IT HR', 
      badgeVariant: name === 'Niky Sharma' ? 'red' : 'rose' 
    };
  }
  if (arr === 'Contract' || ['Archit Sharma', 'Rajnesh'].includes(name) || emp?.workLocation?.includes('WFH')) {
    return { key: 'Contract', label: 'Contract Staff', badgeVariant: 'cyan' };
  }
  return { key: 'Employee', label: 'Permanent Staff', badgeVariant: 'neutral' };
}
export const ATTENDANCE_TRACKING_START_DATE = '2026-07-01';

// Known Paid/Declared Public Holidays in Q3 2026 (Configurable policy)
export const DECLARED_HOLIDAYS: Record<string, string> = {
  '2026-08-15': 'Independence Day',
  '2026-08-27': 'Ganesh Chaturthi (Pune)',
  '2026-10-02': 'Gandhi Jayanti',
};

/**
 * Derives the scheduled work mode for an employee or intern on a given date string (YYYY-MM-DD).
 */
export function getScheduledWorkMode(dateStr: string, isIntern: boolean, isContractWfh: boolean = false): {
  mode: ScheduledWorkMode;
  isHoliday: boolean;
  holidayName?: string;
  isWeekend: boolean;
} {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  const holidayName = DECLARED_HOLIDAYS[dateStr];

  if (day === 0 || day === 6) {
    const defaultWeekendName = day === 0 ? 'Sunday (Weekend Holiday)' : 'Saturday (Weekend Holiday)';
    const fullHolidayName = holidayName ? `${holidayName} (${defaultWeekendName})` : defaultWeekendName;
    return { mode: 'Weekly Off', isHoliday: !!holidayName, holidayName: fullHolidayName, isWeekend: true };
  }

  if (holidayName) {
    return { mode: 'Holiday', isHoliday: true, holidayName, isWeekend: false };
  }

  if (isIntern) {
    // Intern Recurring Schedule:
    // Mon (1), Tue (2), Wed (3): WFO
    // Thu (4), Fri (5): WFH
    if (day >= 1 && day <= 3) {
      return { mode: 'WFO', isHoliday: false, isWeekend: false };
    }
    return { mode: 'WFH', isHoliday: false, isWeekend: false };
  }

  if (isContractWfh) {
    return { mode: 'WFH', isHoliday: false, isWeekend: false };
  }

  return { mode: 'WFO', isHoliday: false, isWeekend: false };
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates working days between two dates excluding weekends and declared holidays.
 */
export function calculateWorkingDays(fromDateStr: string, toDateStr: string, durationOption?: string): number {
  if (fromDateStr > toDateStr) return 0;

  const start = parseDateOnly(fromDateStr);
  const end = parseDateOnly(toDateStr);
  let days = 0;

  const curr = new Date(start);
  while (curr <= end) {
    const day = curr.getDay();
    const currStr = formatDateOnly(curr);
    const isWeekend = day === 0 || day === 6;
    const isHoliday = !!DECLARED_HOLIDAYS[currStr];

    if (!isWeekend && !isHoliday) {
      days++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  if (durationOption?.includes('Half Day')) {
    return Math.max(0.5, days * 0.5);
  }

  return days;
}

/**
 * Generates an honest day-wise calendar for an individual between startDate and endDate,
 * correctly separating scheduled work mode from actual attendance, and accurately representing
 * missing historical data as "Not Recorded".
 */
export function generateIndividualAttendanceTimeline(
  employee?: Employee,
  startDateStr: string = '2026-07-01',
  endDateStr: string = '2026-09-30',
  existingRecords: AttendanceRecord[] = [],
  approvedLeaves: LeaveApplication[] = []
): AttendanceRecord[] {
  if (!employee) return [];
  const isIntern =
    employee.engagementCategory === 'Intern' ||
    employee.designation?.toLowerCase().includes('intern') ||
    employee.employeeId?.startsWith('ETHX-INT-') ||
    [
      'emp-014', 'emp-015', 'emp-016', 'emp-017', 'emp-018', 'emp-019', 'emp-020', 'emp-021',
      'ETHX-014', 'ETHX-015', 'ETHX-016', 'ETHX-017', 'ETHX-018', 'ETHX-019', 'ETHX-020', 'ETHX-021',
    ].includes(employee.employeeId || employee.id);
  const isContract = employee.employmentArrangement === 'Contract' || employee.workLocation?.includes('WFH');

  // Map existing records by date
  const recordsByDate = new Map<string, AttendanceRecord>();
  existingRecords
    .filter((r) => r.employeeId === employee.employeeId || r.employeeId === employee.id)
    .forEach((r) => recordsByDate.set(r.date, r));

  // Filter approved leaves for this employee
  const userLeaves = approvedLeaves.filter(
    (l) => (l.employeeId === employee.employeeId || l.employeeId === employee.id) && l.status === 'Approved'
  );

  const start = parseDateOnly(startDateStr);
  const end = parseDateOnly(endDateStr);
  const todayStr = '2026-09-28'; // Current business simulation date in Asia/Kolkata

  const timeline: AttendanceRecord[] = [];
  const curr = new Date(start);

  while (curr <= end) {
    const dateStr = formatDateOnly(curr);

    // If intern and date is after 30 Sep 2026, stop generating unless extended
    if (isIntern && dateStr > INTERNSHIP_END_DATE) {
      break;
    }

    const { mode, isHoliday, holidayName, isWeekend } = getScheduledWorkMode(dateStr, isIntern, isContract);

    // Check if an approved leave covers this date
    const matchingLeave = userLeaves.find((l) => dateStr >= l.fromDate && dateStr <= l.toDate);
    const existingRec = recordsByDate.get(dateStr);

    let status: ActualAttendanceStatus = 'Not Recorded';
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let workHours = 0;
    let actualWorkMode: ActualWorkMode | undefined = undefined;
    let conflictDetails: string | null = null;

    if (isHoliday) {
      status = 'Holiday';
    } else if (isWeekend) {
      status = 'Weekly Off';
    }

    if (existingRec) {
      // Use verified record
      status = existingRec.status;
      checkIn = existingRec.checkIn || null;
      checkOut = existingRec.checkOut || null;
      workHours = existingRec.workHours || 0;
      actualWorkMode = existingRec.actualWorkMode || (checkIn ? (mode === 'WFH' ? 'WFH' : 'WFO') : undefined);
      conflictDetails = existingRec.conflictDetails || null;
    }

    // Apply approved leave consistency
    if (matchingLeave && !isHoliday && !isWeekend) {
      if (checkIn) {
        // Attendance punch exists while leave was approved -> FLAG CONFLICT!
        conflictDetails = `Conflict: Punch logged (${checkIn}) on ${dateStr} while Leave #${matchingLeave.id} was Approved. Requires HR review.`;
        status = 'Approved Leave'; // Flagged for HR review without silently erasing punch
      } else {
        status = 'Approved Leave';
      }
    }

    const isFuture = dateStr > todayStr;
    const isHistorical = dateStr < ATTENDANCE_TRACKING_START_DATE;

    timeline.push({
      id: existingRec ? existingRec.id : `GEN-${employee.employeeId}-${dateStr}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      department: employee.department || 'General Workforce',
      date: dateStr,
      scheduledWorkMode: mode,
      actualWorkMode: actualWorkMode || (status === 'Present' ? (mode === 'WFH' ? 'WFH' : 'WFO') : undefined),
      status: status,
      checkIn: checkIn,
      checkOut: checkOut,
      workHours: workHours,
      location: existingRec?.location || (mode === 'WFO' ? 'Pune HQ' : 'Remote WFH'),
      conflictDetails: conflictDetails,
      leaveApplicationId: matchingLeave?.id,
      isHistorical: isHistorical,
      dataCoverage: isFuture ? 'Pending' : (status === 'Not Recorded' ? 'Not Recorded' : 'Recorded'),
      remarks: holidayName ? `Public Holiday: ${holidayName}` : (existingRec?.remarks || undefined),
      correctionHistory: existingRec?.correctionHistory || [],
    });

    curr.setDate(curr.getDate() + 1);
  }

  return timeline;
}

export interface InternMonthConfig {
  key: string;
  label: string;
  shortLabel: string;
  phaseTitle: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}

export const INTERN_COHORT_MONTHS: InternMonthConfig[] = [
  {
    key: '2026-07',
    label: 'July 2026',
    shortLabel: 'July',
    phaseTitle: 'Month 1: Orientation, Tooling & Onboarding',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    totalDays: 31,
  },
  {
    key: '2026-08',
    label: 'August 2026',
    shortLabel: 'August',
    phaseTitle: 'Month 2: Core Engineering & Task Tracking',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    totalDays: 31,
  },
  {
    key: '2026-09',
    label: 'September 2026',
    shortLabel: 'September',
    phaseTitle: 'Month 3: Capstone Deliverables & Conversion Review',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    totalDays: 30,
  },
  {
    key: 'Q3',
    label: 'Full Q3 Cohort Lifecycle',
    shortLabel: 'Full Q3 (All 3 Months)',
    phaseTitle: 'Complete 3-Month Unpaid Internship (1 Jul – 30 Sep 2026)',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    totalDays: 92,
  },
];

export interface InternMonthlyMetrics {
  monthKey: string;
  monthLabel: string;
  totalDays: number;
  workingDays: number;
  weekendHolidays: number;
  publicHolidays: number;
  daysPresent: number;
  wfoPresentDays: number;
  wfhPresentDays: number;
  approvedLeaveDays: number;
  unrecordedDays: number;
  totalWorkHours: number;
  attendanceRate: string;
  stipend: number;
  isUnpaid: boolean;
}

export function calculateInternMonthlyMetrics(
  records: AttendanceRecord[],
  monthConfig: InternMonthConfig
): InternMonthlyMetrics {
  const monthRecords = records.filter(
    (r) => r.date >= monthConfig.startDate && r.date <= monthConfig.endDate
  );

  let workingDays = 0;
  let weekendHolidays = 0;
  let publicHolidays = 0;
  let daysPresent = 0;
  let wfoPresentDays = 0;
  let wfhPresentDays = 0;
  let approvedLeaveDays = 0;
  let unrecordedDays = 0;
  let totalWorkHours = 0;

  monthRecords.forEach((r) => {
    const d = new Date(r.date + 'T00:00:00+05:30');
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6 || r.scheduledWorkMode === 'Weekly Off';
    const isWeekdayHoliday = !isWeekend && r.scheduledWorkMode === 'Holiday';

    if (isWeekend) {
      weekendHolidays++;
    } else if (isWeekdayHoliday) {
      publicHolidays++;
    } else {
      workingDays++;
    }

    if (r.status === 'Present') {
      daysPresent++;
      totalWorkHours += r.workHours || 0;
      if (r.actualWorkMode === 'WFO' || r.scheduledWorkMode === 'WFO') {
        wfoPresentDays++;
      } else {
        wfhPresentDays++;
      }
    } else if (r.status === 'Approved Leave') {
      approvedLeaveDays++;
    } else if (r.status === 'Not Recorded') {
      unrecordedDays++;
    }
  });

  const recordedWorkingDays = workingDays - unrecordedDays;
  const attendanceRate =
    recordedWorkingDays > 0
      ? ((daysPresent / recordedWorkingDays) * 100).toFixed(1) + '%'
      : daysPresent > 0
      ? '100.0%'
      : '0.0%';

  return {
    monthKey: monthConfig.key,
    monthLabel: monthConfig.label,
    totalDays: monthRecords.length,
    workingDays,
    weekendHolidays,
    publicHolidays,
    daysPresent,
    wfoPresentDays,
    wfhPresentDays,
    approvedLeaveDays,
    unrecordedDays,
    totalWorkHours: Number(totalWorkHours.toFixed(1)),
    attendanceRate,
    stipend: 0,
    isUnpaid: true,
  };
}

// ---------------------------------------------------------------------------
// Employee Multi-Year Career & Tenure Utilities (2 to 3 Years Service)
// ---------------------------------------------------------------------------

export interface EmployeePeriodConfig {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  phaseTitle: string;
  isQuarter?: boolean;
}

export const EMPLOYEE_NAV_PERIODS: EmployeePeriodConfig[] = [
  { key: '2026-09', label: 'September 2026', startDate: '2026-09-01', endDate: '2026-09-30', phaseTitle: 'Current Operational Month' },
  { key: '2026-08', label: 'August 2026', startDate: '2026-08-01', endDate: '2026-08-31', phaseTitle: 'Previous Operational Month' },
  { key: '2026-07', label: 'July 2026', startDate: '2026-07-01', endDate: '2026-07-31', phaseTitle: 'Q3 Opening Month' },
  { key: '2026-Q3', label: 'Full Q3 2026', startDate: '2026-07-01', endDate: '2026-09-30', phaseTitle: 'Quarterly Ledger (Jul – Sep)', isQuarter: true },
  { key: '2026-Q2', label: 'Q2 2026 (Apr – Jun)', startDate: '2026-04-01', endDate: '2026-06-30', phaseTitle: 'Prior Quarter Archive', isQuarter: true },
  { key: '2026-YTD', label: 'Year-to-Date (2026)', startDate: '2026-01-01', endDate: '2026-09-30', phaseTitle: 'Annual 2026 Cumulative Summary', isQuarter: true },
];

export function calculateEmployeeTenure(employee?: Employee): {
  joiningDateStr: string;
  tenureYears: number;
  tenureMonths: number;
  tenureDisplay: string;
  isTwoToThreeYears: boolean;
} {
  // Established 2-3 years tenure mapping for ETHX regular employees
  const tenureDefaults: Record<string, string> = {
    'ETHX-007': '2023-11-15', // Shubham Patane (~2.9 yrs)
    'ETHX-008': '2024-01-10', // Saurav Sarkar (~2.7 yrs)
    'ETHX-009': '2024-03-01', // Vishal Walunj (~2.5 yrs)
    'ETHX-010': '2023-09-01', // Shruti Pawar (~3.1 yrs)
    'ETHX-011': '2024-02-15', // Ganesh Kulkarni (~2.6 yrs)
    'ETHX-012': '2023-12-01', // Archit Sharma (~2.8 yrs)
    'ETHX-013': '2024-04-01', // Rajnesh (~2.5 yrs)
    'ETHX-004': '2023-05-01', // Siva Kumar (~3.4 yrs)
    'ETHX-005': '2023-06-01', // Niky Sharma (~3.3 yrs)
    'ETHX-006': '2024-01-15', // Madhavi Singh (~2.7 yrs)
    'ETHX-001': '2022-04-01', // Ram Chaturvedi (~4.5 yrs)
    'ETHX-002': '2022-04-01', // Rohan (~4.5 yrs)
    'ETHX-003': '2022-04-01', // Virender Kumar (~4.5 yrs)
  };

  const id = employee?.employeeId || employee?.id || '';
  const joiningDateStr =
    employee?.joiningDate && employee.joiningDate !== 'Not provided'
      ? employee.joiningDate
      : tenureDefaults[id] || '2023-11-15';

  const refDate = new Date('2026-09-28T00:00:00+05:30');
  const jDate = new Date(joiningDateStr + 'T00:00:00+05:30');

  let years = refDate.getFullYear() - jDate.getFullYear();
  let months = refDate.getMonth() - jDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }

  const isTwoToThreeYears = years >= 2 && years <= 3;
  const tenureDisplay = `${years} Year${years !== 1 ? 's' : ''}, ${months} Month${months !== 1 ? 's' : ''}`;

  return {
    joiningDateStr,
    tenureYears: years,
    tenureMonths: months,
    tenureDisplay,
    isTwoToThreeYears,
  };
}

export function getEmployeeLeaveBalance(employee?: Employee) {
  return {
    annualLeaveTotal: 18,
    annualLeaveUsed: 3,
    annualLeaveRemaining: 15,
    casualLeaveTotal: 12,
    casualLeaveUsed: 4,
    casualLeaveRemaining: 8,
    sickLeaveTotal: 10,
    sickLeaveUsed: 1,
    sickLeaveRemaining: 9,
  };
}

