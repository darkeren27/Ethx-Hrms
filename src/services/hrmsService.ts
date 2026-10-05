import { frappeClient } from './frappeClient';
import { 
  Employee, 
  Department, 
  Designation, 
  AttendanceRecord, 
  LeaveApplication, 
  SalarySlip, 
  JobOpening, 
  JobApplicant, 
  PerformanceGoal, 
  SkillMatrixItem, 
  AssetRecord,
  HRNotification,
  InternshipLifecycleRecord,
  InternEvaluationRecord,
  ManagementDecisionRecord,
  EmploymentOfferRecord,
  ManagementDecisionOption,
  ActualAttendanceStatus,
  ActualWorkMode,
  LeaveType,
  LeaveStatus,
} from '../types/hrms';
import {
  isAuthorizedAttendanceLeaveAdmin,
  isAuthorizedAlternativeLeaveApprover,
  getScheduledWorkMode,
  calculateWorkingDays,
  generateIndividualAttendanceTimeline,
  INTERNSHIP_END_DATE,
  parseDateOnly,
  formatDateOnly,
} from './attendanceScheduleService';

export interface ActiveSession {
  user: any | null;
  isHrAdmin: boolean;
  isDirector: boolean;
  isEmployee: boolean;
}

export function getActiveSessionUser(): ActiveSession {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ethx_auth_user') : null;
    if (raw) {
      const u = JSON.parse(raw);
      const isHrAdmin =
        u.role === 'HR Admin' ||
        u.role === 'System Administrator' ||
        u.role === 'HR Executive' ||
        isAuthorizedAttendanceLeaveAdmin(u.id || u.employeeId, u.name);
      const isDirector =
        isAuthorizedAlternativeLeaveApprover(u.id || u.employeeId, u.name) ||
        Boolean(u.designation && u.designation.toLowerCase().includes('director'));
      const isEmployee = !isHrAdmin && !isDirector;
      return { user: u, isHrAdmin, isDirector, isEmployee };
    }
  } catch (e) {
    console.error('Error reading active session in hrmsService:', e);
  }
  return { user: null, isHrAdmin: false, isDirector: false, isEmployee: true };
}

export const hrmsService = {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    const employees = await frappeClient.getList<Employee>('Employee', {
      fields: ['name', 'employee_name', 'department', 'designation', 'status', 'company_email', 'image'],
      order_by: 'creation desc',
    });
    const { user, isHrAdmin } = getActiveSessionUser();
    // Non-admin users see public directory info (name, department, designation, email)
    // but private financial and KYC fields of others are strictly redacted
    if (!isHrAdmin && user) {
      const currentEmpId = user.employeeId || user.id;
      return employees.map((emp) => {
        const isSelf = emp.id === currentEmpId || emp.employeeId === currentEmpId || emp.email === user.email;
        if (isSelf) return emp;
        return {
          ...emp,
          baseSalary: null,
          bankInfo: undefined,
          emergencyContact: undefined,
          phone: '',
        };
      });
    }
    return employees;
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    const employee = await frappeClient.getDoc<Employee>('Employee', id);
    if (!employee) return null;
    const { user, isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin && user) {
      const currentEmpId = user.employeeId || user.id;
      const isSelf = employee.id === currentEmpId || employee.employeeId === currentEmpId || employee.email === user.email;
      if (!isSelf) {
        // Redact confidential compensation, banking, and private identity details
        return {
          ...employee,
          baseSalary: null,
          bankInfo: undefined,
          emergencyContact: undefined,
          phone: '',
        };
      }
    }
    return employee;
  },

  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR Administrators can onboard new personnel.');
    }
    return frappeClient.createDoc<Employee>('Employee', {
      ...employee,
      employee_name: employee.fullName,
      status: 'Active',
    });
  },

  // Organization
  async getDepartments(): Promise<Department[]> {
    return frappeClient.getList<Department>('Department', { fields: ['name', 'department_name', 'head_of_department'] });
  },

  async getDesignations(): Promise<Designation[]> {
    return frappeClient.getList<Designation>('Designation');
  },

  // Attendance Roster & Logs
  async getAttendanceRecords(callerUserId?: string, callerUserName?: string): Promise<AttendanceRecord[]> {
    const allRecords = await frappeClient.getList<AttendanceRecord>('Attendance', { order_by: 'date desc' });
    const { user, isHrAdmin } = getActiveSessionUser();
    
    // Strict Backend Access Control:
    // If the active logged-in user is an employee/intern, scope strictly to their records ONLY
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      const empName = (user.name || '').toLowerCase();
      return allRecords.filter(
        (r) => r.employeeId === empId || 
               r.employeeId === user.id || 
               (r.employeeName && r.employeeName.toLowerCase() === empName)
      );
    }

    if (callerUserId || callerUserName) {
      const isNiky = isAuthorizedAttendanceLeaveAdmin(callerUserId, callerUserName);
      if (!isNiky) {
        const employees = await frappeClient.getList<Employee>('Employee');
        const callerEmp = employees.find((e) => e.employeeId === callerUserId || e.id === callerUserId || (callerUserName && e.fullName.toLowerCase() === callerUserName.toLowerCase()));
        return allRecords.filter(
          (r) => r.employeeId === callerUserId || 
                 (callerEmp && (r.employeeId === callerEmp.employeeId || r.employeeId === callerEmp.id))
        );
      }
    }
    return allRecords;
  },

  async getDailyOrganizationRoster(dateStr: string, callerUserId?: string, callerUserName?: string): Promise<AttendanceRecord[]> {
    const employees = await frappeClient.getList<Employee>('Employee');
    const allAttendance = await frappeClient.getList<AttendanceRecord>('Attendance');
    const allLeaves = await frappeClient.getList<LeaveApplication>('Leave Application');
    const todayStr = new Date().toISOString().split('T')[0];
    const { user, isHrAdmin } = getActiveSessionUser();

    // Authorization: If caller/active user is non-admin, scope strictly to caller only
    let targetEmployees = employees;
    if (user && !isHrAdmin) {
      targetEmployees = employees.filter(
        (e) => e.employeeId === user.employeeId || e.id === user.id || e.fullName.toLowerCase() === (user.name || '').toLowerCase()
      );
    } else if (callerUserId || callerUserName) {
      const isNiky = isAuthorizedAttendanceLeaveAdmin(callerUserId, callerUserName);
      if (!isNiky) {
        targetEmployees = employees.filter(
          (e) => e.employeeId === callerUserId || e.id === callerUserId || (callerUserName && e.fullName.toLowerCase() === callerUserName.toLowerCase())
        );
      }
    }

    return targetEmployees.map((emp) => {
      const isIntern = emp.engagementCategory === 'Intern';
      const isContract = emp.employmentArrangement === 'Contract' || emp.workLocation?.includes('WFH') || emp.fullName === 'Archit Sharma';
      const scheduled = getScheduledWorkMode(dateStr, isIntern, isContract);

      // Check if existing record matches
      const existing = allAttendance.find(
        (r) => (r.employeeId === emp.employeeId || r.employeeId === emp.id) && r.date === dateStr
      );
      if (existing) {
        return {
          ...existing,
          scheduledWorkMode: existing.scheduledWorkMode || scheduled.mode,
          actualWorkMode: existing.actualWorkMode || (existing.checkIn ? (scheduled.mode === 'WFH' ? 'WFH' : 'WFO') : undefined),
        };
      }

      // Check approved leave
      const matchingLeave = allLeaves.find(
        (l) => (l.employeeId === emp.employeeId || l.employeeId === emp.id) &&
               l.status === 'Approved' &&
               dateStr >= l.fromDate &&
               dateStr <= l.toDate
      );

      if (matchingLeave) {
        return {
          id: `ATT-${dateStr.replace(/-/g, '')}-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          department: emp.department !== 'Not provided' ? emp.department : (isIntern ? 'Engineering & Cloud' : 'Operations'),
          date: dateStr,
          scheduledWorkMode: scheduled.mode,
          actualWorkMode: undefined,
          checkIn: null,
          checkOut: null,
          status: 'Approved Leave' as const,
          workHours: 0,
          location: scheduled.mode === 'WFH' ? 'Remote' : 'Pune HQ',
          dataCoverage: 'Recorded' as const,
          leaveApplicationId: matchingLeave.id,
          correctionHistory: [],
        };
      }

      if (scheduled.isHoliday) {
        return {
          id: `ATT-${dateStr.replace(/-/g, '')}-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          department: emp.department !== 'Not provided' ? emp.department : (isIntern ? 'Engineering & Cloud' : 'Operations'),
          date: dateStr,
          scheduledWorkMode: 'Holiday' as const,
          actualWorkMode: undefined,
          checkIn: null,
          checkOut: null,
          status: 'Holiday' as const,
          workHours: 0,
          location: scheduled.holidayName || 'Declared Public Holiday',
          dataCoverage: 'Recorded' as const,
          correctionHistory: [],
        };
      }

      if (scheduled.isWeekend) {
        return {
          id: `ATT-${dateStr.replace(/-/g, '')}-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          department: emp.department !== 'Not provided' ? emp.department : (isIntern ? 'Engineering & Cloud' : 'Operations'),
          date: dateStr,
          scheduledWorkMode: 'Weekly Off' as const,
          actualWorkMode: undefined,
          checkIn: null,
          checkOut: null,
          status: 'Weekly Off' as const,
          workHours: 0,
          location: 'Weekly Off',
          dataCoverage: 'Recorded' as const,
          correctionHistory: [],
        };
      }

      const isFuture = dateStr > todayStr;
      return {
        id: `ATT-${dateStr.replace(/-/g, '')}-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        department: emp.department !== 'Not provided' ? emp.department : (isIntern ? 'Engineering & Cloud' : 'Operations'),
        date: dateStr,
        scheduledWorkMode: scheduled.mode,
        actualWorkMode: undefined,
        checkIn: null,
        checkOut: null,
        status: isFuture ? ('Scheduled (Pending)' as any) : ('Not Recorded' as const),
        workHours: 0,
        location: scheduled.mode === 'WFH' ? 'Remote WFH' : 'Pune HQ (Main Campus)',
        dataCoverage: isFuture ? ('Pending' as any) : ('Not Recorded' as const),
        correctionHistory: [],
      };
    });
  },

  async getAttendanceHistory(
    callerUserId: string, 
    targetEmployeeId: string, 
    startDate: string = '2026-07-01', 
    endDate: string = '2026-09-30'
  ): Promise<AttendanceRecord[]> {
    // Backend Authorization Check:
    // Only Niky Sharma (emp-005) or the employee themselves can view their day-wise history
    const isTargetSelf = callerUserId === targetEmployeeId || callerUserId.includes(targetEmployeeId) || targetEmployeeId.includes(callerUserId);
    if (!isAuthorizedAttendanceLeaveAdmin(callerUserId) && !isTargetSelf) {
      throw new Error(
        'Permission Denied: Only designated HR administrator (Niky Sharma) can view other employees\' attendance history.'
      );
    }

    const employees = await this.getEmployees();
    const targetEmployee = employees.find((e) => e.employeeId === targetEmployeeId || e.id === targetEmployeeId);
    if (!targetEmployee) {
      throw new Error(`Target personnel with ID ${targetEmployeeId} not found in verified master.`);
    }

    const allAttendance = await frappeClient.getList<AttendanceRecord>('Attendance');
    const allLeaves = await frappeClient.getList<LeaveApplication>('Leave Application');

    return generateIndividualAttendanceTimeline(targetEmployee, startDate, endDate, allAttendance, allLeaves);
  },

  async punchAttendance(
    employeeId: string, 
    employeeName: string, 
    department: string, 
    type: 'IN' | 'OUT', 
    workMode?: 'WFO' | 'WFH'
  ): Promise<AttendanceRecord> {
    const records = await frappeClient.getList<AttendanceRecord>('Attendance');
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const employees = await this.getEmployees();
    const employee = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    const isIntern = employee?.engagementCategory === 'Intern';
    const isContract = employee?.employmentArrangement === 'Contract' || employee?.workLocation?.includes('WFH');

    const scheduled = getScheduledWorkMode(today, isIntern, isContract);
    const existing = records.find((r) => (r.employeeId === employeeId || r.employeeId === employee?.employeeId) && r.date === today);

    if (existing) {
      if (type === 'OUT') {
        const inParts = existing.checkIn?.split(':') || ['09', '00'];
        const inHour = parseInt(inParts[0]) || 9;
        const outHour = new Date().getHours();
        const duration = Math.max(0.5, Math.min(12, outHour - inHour));

        return frappeClient.updateDoc<AttendanceRecord>('Attendance', existing.id, {
          checkOut: nowTime,
          workHours: Number(duration.toFixed(1)),
          actualWorkMode: workMode || existing.actualWorkMode || (scheduled.mode === 'WFH' ? 'WFH' : 'WFO'),
          dataCoverage: 'Recorded',
        });
      }
      return existing;
    }

    return frappeClient.createDoc<AttendanceRecord>('Attendance', {
      employeeId,
      employeeName,
      department,
      date: today,
      checkIn: nowTime,
      checkOut: null,
      scheduledWorkMode: scheduled.mode,
      actualWorkMode: workMode || (scheduled.mode === 'WFH' ? 'WFH' : 'WFO'),
      status: 'Present',
      workHours: 0.1,
      location: workMode === 'WFH' ? 'Remote WFH' : 'Pune HQ (Main Campus)',
      dataCoverage: 'Recorded',
      correctionHistory: [],
    });
  },

  async markManualAttendance(
    employeeId: string,
    date: string,
    data: {
      status: ActualAttendanceStatus;
      actualWorkMode?: ActualWorkMode;
      checkIn?: string | null;
      checkOut?: string | null;
      workHours?: number;
      reason: string;
    },
    callerUserId: string
  ): Promise<AttendanceRecord> {
    if (!isAuthorizedAttendanceLeaveAdmin(callerUserId)) {
      throw new Error(
        'Permission Denied: Only designated HR administrator (Niky Sharma) can mark manual attendance.'
      );
    }
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Validation Error: A mandatory justification reason must be provided for manual attendance entry.');
    }

    const employees = await this.getEmployees();
    const employee = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    if (!employee) {
      throw new Error(`Personnel with ID ${employeeId} not found in verified master roster.`);
    }

    const isIntern = employee.engagementCategory === 'Intern';
    const isContract = employee.employmentArrangement === 'Contract' || employee.workLocation?.includes('WFH');
    const scheduled = getScheduledWorkMode(date, isIntern, isContract);

    const records = await frappeClient.getList<AttendanceRecord>('Attendance');
    const existing = records.find(
      (r) => (r.employeeId === employee.employeeId || r.employeeId === employee.id) && r.date === date
    );

    const auditEntry = {
      actor: 'Niky Sharma',
      actorId: callerUserId,
      timestamp: new Date().toISOString(),
      previousStatus: existing ? existing.status : ('Not Recorded' as ActualAttendanceStatus),
      newStatus: data.status,
      reason: data.reason.trim(),
    };

    if (existing) {
      const newHistory = [...(existing.correctionHistory || []), auditEntry];
      return frappeClient.updateDoc<AttendanceRecord>('Attendance', existing.id, {
        status: data.status,
        checkIn: data.checkIn !== undefined ? data.checkIn : existing.checkIn,
        checkOut: data.checkOut !== undefined ? data.checkOut : existing.checkOut,
        workHours: data.workHours !== undefined ? data.workHours : existing.workHours,
        actualWorkMode: data.actualWorkMode || existing.actualWorkMode || (scheduled.mode === 'WFH' ? 'WFH' : 'WFO'),
        correctionHistory: newHistory,
        remarks: `Manual attendance recorded by Niky Sharma: ${data.reason.trim()}`,
        dataCoverage: 'Recorded',
      });
    } else {
      const newRecordId = `ATT-${date.replace(/-/g, '')}-${employee.employeeId}`;
      return frappeClient.createDoc<AttendanceRecord>('Attendance', {
        id: newRecordId,
        employeeId: employee.employeeId,
        employeeName: employee.fullName,
        department: employee.department !== 'Not provided' ? employee.department : (isIntern ? 'Engineering & Cloud' : 'Operations'),
        date,
        scheduledWorkMode: scheduled.mode,
        actualWorkMode: data.actualWorkMode || (scheduled.mode === 'WFH' ? 'WFH' : 'WFO'),
        checkIn: data.checkIn || '09:00 AM',
        checkOut: data.checkOut || '06:00 PM',
        status: data.status,
        workHours: data.workHours !== undefined ? data.workHours : 8.0,
        location: data.actualWorkMode === 'WFH' || scheduled.mode === 'WFH' ? 'Remote WFH' : 'Pune HQ (Main Campus)',
        dataCoverage: 'Recorded',
        correctionHistory: [auditEntry],
        remarks: `Manual attendance marked by HR (Niky Sharma): ${data.reason.trim()}`,
      });
    }
  },

  async correctAttendance(
    recordId: string, 
    updates: { 
      status: ActualAttendanceStatus; 
      checkIn?: string | null; 
      checkOut?: string | null; 
      reason: string;
      workHours?: number;
      actualWorkMode?: ActualWorkMode;
    }, 
    callerUserId: string
  ): Promise<AttendanceRecord> {
    // Authorization Check:
    // Only Niky Sharma (emp-005 / ETHX-005) can make authorized attendance corrections
    if (!isAuthorizedAttendanceLeaveAdmin(callerUserId)) {
      throw new Error(
        'Permission Denied: Only designated HR administrator (Niky Sharma) can make authorized attendance corrections.'
      );
    }

    if (!updates.reason || !updates.reason.trim()) {
      throw new Error('Validation Error: A mandatory justification reason must be provided for attendance corrections.');
    }

    const records = await frappeClient.getList<AttendanceRecord>('Attendance');
    let existing = records.find((r) => r.id === recordId || r.id.includes(recordId));

    if (!existing) {
      // If record is a synthesized daily or timeline record like ATT-20260928-ETHX-008
      const match = recordId.match(/^ATT-(\d{4})(\d{2})(\d{2})-(.+)$/);
      if (match) {
        const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
        const empId = match[4];
        return this.markManualAttendance(
          empId,
          dateStr,
          {
            status: updates.status,
            checkIn: updates.checkIn,
            checkOut: updates.checkOut,
            workHours: updates.workHours,
            actualWorkMode: updates.actualWorkMode,
            reason: updates.reason,
          },
          callerUserId
        );
      }
      throw new Error(`Attendance record #${recordId} not found.`);
    }

    const auditEntry = {
      actor: 'Niky Sharma',
      actorId: callerUserId,
      timestamp: new Date().toISOString(),
      previousStatus: existing.status,
      newStatus: updates.status,
      reason: updates.reason.trim(),
    };

    const newHistory = [...(existing.correctionHistory || []), auditEntry];

    return frappeClient.updateDoc<AttendanceRecord>('Attendance', existing.id, {
      status: updates.status,
      checkIn: updates.checkIn !== undefined ? updates.checkIn : existing.checkIn,
      checkOut: updates.checkOut !== undefined ? updates.checkOut : existing.checkOut,
      workHours: updates.workHours !== undefined ? updates.workHours : existing.workHours,
      actualWorkMode: updates.actualWorkMode || existing.actualWorkMode,
      correctionHistory: newHistory,
      remarks: `Corrected by Niky Sharma: ${updates.reason.trim()}`,
      dataCoverage: 'Recorded',
    });
  },

  async requestRegularization(attendanceId: string, reason: string): Promise<AttendanceRecord> {
    return frappeClient.updateDoc<AttendanceRecord>('Attendance', attendanceId, {
      regularizationStatus: 'Pending',
      regularizationReason: reason,
    });
  },

  // Leave Management & Approvals Workflow
  async getLeaveApplications(callerUserId?: string): Promise<LeaveApplication[]> {
    const allLeaves = await frappeClient.getList<LeaveApplication>('Leave Application', { order_by: 'appliedOn desc' });
    const { user, isHrAdmin, isDirector } = getActiveSessionUser();

    // Strict Backend Access Control:
    // If the active session is a non-admin, non-director employee/intern, scope strictly to caller's records ONLY
    if (user && !isHrAdmin && !isDirector) {
      const empId = user.employeeId || user.id;
      const empName = (user.name || '').toLowerCase();
      return allLeaves.filter(
        (l) => l.employeeId === empId || 
               l.employeeId === user.id || 
               (l.employeeName && l.employeeName.toLowerCase() === empName)
      );
    }

    if (callerUserId) {
      const employees = await frappeClient.getList<Employee>('Employee');
      const callerEmp = employees.find((e) => e.employeeId === callerUserId || e.id === callerUserId);
      const isNiky = isAuthorizedAttendanceLeaveAdmin(callerUserId, callerEmp?.fullName);
      const isDir = isAuthorizedAlternativeLeaveApprover(callerUserId, callerEmp?.fullName);
      if (!isNiky && !isDir) {
        return allLeaves.filter(
          (l) => l.employeeId === callerUserId || 
                 (callerEmp && (l.employeeId === callerEmp.employeeId || l.employeeId === callerEmp.id))
        );
      }
    }
    return allLeaves;
  },

  async applyLeave(
    application: {
      employeeId: string;
      employeeName: string;
      department: string;
      applicantCategory: 'Employee' | 'Intern';
      leaveType: LeaveType;
      fromDate: string;
      toDate: string;
      durationOption?: 'Full Day' | 'Half Day (First Half)' | 'Half Day (Second Half)';
      reason: string;
      attachmentUrl?: string | null;
    },
    callerUserId?: string
  ): Promise<LeaveApplication> {
    // 1. Validate dates
    if (application.fromDate > application.toDate) {
      throw new Error('Validation Error: From Date cannot be after To Date.');
    }

    // 2. Validate intern engagement boundaries
    if (application.applicantCategory === 'Intern') {
      if (application.toDate > INTERNSHIP_END_DATE) {
        throw new Error(
          `Validation Error: Internship period concludes on 30 September 2026. Cannot apply for leave beyond engagement period.`
        );
      }
      const validInternLeaveTypes: LeaveType[] = [
        'Unpaid Internship Leave',
        'Academic Leave',
        'Medical Leave',
        'Unpaid Leave',
      ];
      if (!validInternLeaveTypes.includes(application.leaveType)) {
        throw new Error(
          'Validation Error: Unpaid interns are not eligible for paid leave entitlements (Annual/Casual). Please select Unpaid Internship Leave, Academic Leave, or Medical Leave.'
        );
      }
    }

    // 3. Validate overlapping applications for the same applicant
    const existingLeaves = await frappeClient.getList<LeaveApplication>('Leave Application');
    const applicantLeaves = existingLeaves.filter(
      (l) => (l.employeeId === application.employeeId || l.employeeName === application.employeeName) &&
             l.status !== 'Rejected' && 
             l.status !== 'Cancelled'
    );

    const hasOverlap = applicantLeaves.some((l) => {
      return application.fromDate <= l.toDate && application.toDate >= l.fromDate;
    });

    if (hasOverlap) {
      throw new Error('Validation Error: An active leave application already exists for the selected date range.');
    }

    // 4. Calculate duration
    const totalDays = calculateWorkingDays(application.fromDate, application.toDate, application.durationOption);
    if (totalDays <= 0) {
      throw new Error('Validation Error: The requested dates fall entirely on non-working days (Weekly Offs/Holidays).');
    }

    // 5. Self-Approval Guard:
    // If Niky Sharma (emp-005 / ETHX-005) applies for leave, route to Director review
    const isNiky = application.employeeId === 'ETHX-005' || application.employeeId === 'emp-005' || callerUserId === 'emp-005';
    const initialStatus: LeaveStatus = isNiky ? 'Pending Director Approval' : 'Pending';

    return frappeClient.createDoc<LeaveApplication>('Leave Application', {
      ...application,
      totalDays,
      status: initialStatus,
      appliedOn: new Date().toISOString().split('T')[0],
      isSelfApprovalBlocked: isNiky,
      conflictWithAttendance: false,
    });
  },

  async updateLeaveStatus(
    id: string, 
    status: 'Approved' | 'Rejected', 
    callerUserId?: string, 
    remarks?: string,
    rejectionReason?: string
  ): Promise<LeaveApplication> {
    const { user, isHrAdmin, isDirector } = getActiveSessionUser();
    const effectiveCallerId = callerUserId || user?.employeeId || user?.id || '';

    // Backend Access Enforcement: Non-admins cannot approve or reject leaves
    if (!isHrAdmin && !isDirector) {
      throw new Error(
        'Permission Denied: Only authorized HR administrator (Niky Sharma) or Company Director (Ram Chaturvedi) can approve or reject leave applications.'
      );
    }

    const allLeaves = await frappeClient.getList<LeaveApplication>('Leave Application');
    const application = allLeaves.find((l) => l.id === id);

    if (!application) {
      throw new Error(`Leave Application #${id} not found.`);
    }

    // 1. Strict Self-Approval Prevention:
    // Niky Sharma cannot self-approve her own leave requests
    const isApplicantNiky = application.employeeId === 'ETHX-005' || application.employeeId === 'emp-005';
    if (isApplicantNiky && (effectiveCallerId === 'emp-005' || effectiveCallerId === 'ETHX-005')) {
      throw new Error(
        'Self-approval prohibited: Niky Sharma cannot approve her own leave applications. Requests must be reviewed by Company Director (Ram Chaturvedi).'
      );
    }

    // 2. Authorization Verification:
    if (application.status === 'Pending Director Approval') {
      if (!isAuthorizedAlternativeLeaveApprover(effectiveCallerId)) {
        throw new Error(
          'Permission Denied: Niky Sharma\'s leave application must be reviewed by Company Director (Ram Chaturvedi).'
        );
      }
    } else {
      if (!isAuthorizedAttendanceLeaveAdmin(effectiveCallerId)) {
        throw new Error(
          'Permission Denied: Only designated HR administrator (Niky Sharma) can approve or reject leave applications.'
        );
      }
    }

    // 3. Mandatory Rejection Reason
    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      throw new Error('Validation Error: A mandatory rejection reason is required when rejecting a leave application.');
    }

    // 4. Ledger Reconciliation on Approval
    let conflictDetected = false;
    if (status === 'Approved') {
      const attendanceRecords = await frappeClient.getList<AttendanceRecord>('Attendance');
      const start = parseDateOnly(application.fromDate);
      const end = parseDateOnly(application.toDate);
      const curr = new Date(start);

      while (curr <= end) {
        const dateStr = formatDateOnly(curr);
        const existingAtt = attendanceRecords.find(
          (r) => (r.employeeId === application.employeeId || r.employeeId.includes(application.employeeId)) && r.date === dateStr
        );

        if (existingAtt) {
          if (existingAtt.checkIn) {
            // Conflict: Punch logged while leave approved!
            conflictDetected = true;
            await frappeClient.updateDoc<AttendanceRecord>('Attendance', existingAtt.id, {
              status: 'Approved Leave',
              conflictDetails: `Conflict: Punch logged (${existingAtt.checkIn}) on ${dateStr} while Leave #${application.id} was Approved. Requires HR review.`,
              leaveApplicationId: application.id,
            });
          } else {
            await frappeClient.updateDoc<AttendanceRecord>('Attendance', existingAtt.id, {
              status: 'Approved Leave',
              leaveApplicationId: application.id,
              dataCoverage: 'Recorded',
            });
          }
        } else {
          // Create ledger entry
          await frappeClient.createDoc<AttendanceRecord>('Attendance', {
            employeeId: application.employeeId,
            employeeName: application.employeeName,
            department: application.department,
            date: dateStr,
            status: 'Approved Leave',
            workHours: 0,
            leaveApplicationId: application.id,
            dataCoverage: 'Recorded',
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    return frappeClient.updateDoc<LeaveApplication>('Leave Application', id, {
      status,
      decidedBy: isApplicantNiky ? 'Ram Chaturvedi (Company Director)' : 'Niky Sharma (Main HR)',
      decisionDate: new Date().toISOString(),
      decisionRemarks: remarks || null,
      rejectionReason: status === 'Rejected' ? rejectionReason?.trim() : null,
      conflictWithAttendance: conflictDetected,
    });
  },

  async cancelLeave(id: string, callerUserId: string): Promise<LeaveApplication> {
    const allLeaves = await frappeClient.getList<LeaveApplication>('Leave Application');
    const application = allLeaves.find((l) => l.id === id);

    if (!application) {
      throw new Error(`Leave Application #${id} not found.`);
    }

    // Only applicant or authorized admin can cancel
    const employees = await frappeClient.getList<Employee>('Employee');
    const callerEmp = employees.find((e) => e.id === callerUserId || e.employeeId === callerUserId);
    const isOwner =
      application.employeeId === callerUserId ||
      (callerEmp && (application.employeeId === callerEmp.employeeId || application.employeeId === callerEmp.id));
    const isAdmin = isAuthorizedAttendanceLeaveAdmin(callerUserId);
    if (!isOwner && !isAdmin) {
      throw new Error('Permission Denied: You cannot cancel another user\'s leave application.');
    }

    // If previously approved, reverse ledger effects
    if (application.status === 'Approved') {
      const attendanceRecords = await frappeClient.getList<AttendanceRecord>('Attendance');
      const linkedRecords = attendanceRecords.filter((r) => r.leaveApplicationId === application.id);

      for (const rec of linkedRecords) {
        if (rec.checkIn) {
          // If a punch existed, revert back to Present and clear leave conflict
          await frappeClient.updateDoc<AttendanceRecord>('Attendance', rec.id, {
            status: 'Present',
            conflictDetails: null,
            leaveApplicationId: null,
          });
        } else {
          await frappeClient.updateDoc<AttendanceRecord>('Attendance', rec.id, {
            status: 'Not Recorded',
            leaveApplicationId: null,
            dataCoverage: 'Not Recorded',
          });
        }
      }
    }

    return frappeClient.updateDoc<LeaveApplication>('Leave Application', id, {
      status: 'Cancelled',
    });
  },

  // Payroll — Strictly scoped to own slips for employees and interns
  async getSalarySlips(): Promise<SalarySlip[]> {
    const slips = await frappeClient.getList<SalarySlip>('Salary Slip', { order_by: 'postingDate desc' });
    const { user, isHrAdmin } = getActiveSessionUser();

    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      const empName = (user.name || '').toLowerCase();
      return slips.filter(
        (s) => s.employeeId === empId || 
               s.employeeId === user.id || 
               (s.employeeName && s.employeeName.toLowerCase() === empName)
      );
    }
    return slips;
  },

  // Recruitment — Confidential to HR Administrators
  async getJobOpenings(): Promise<JobOpening[]> {
    return frappeClient.getList<JobOpening>('Job Opening');
  },

  async getJobApplicants(): Promise<JobApplicant[]> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      return []; // Confidential candidate applications restricted to HR
    }
    return frappeClient.getList<JobApplicant>('Job Applicant');
  },

  async updateApplicantStage(applicantId: string, newStage: JobApplicant['stage']): Promise<JobApplicant> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only HR Administrators can modify recruitment candidate stages.');
    }
    return frappeClient.updateDoc<JobApplicant>('Job Applicant', applicantId, {
      stage: newStage,
    });
  },

  // Performance — Scoped to own goals for employees
  async getGoals(employeeId?: string): Promise<PerformanceGoal[]> {
    const goals = await frappeClient.getList<PerformanceGoal>('Goal');
    const { user, isHrAdmin } = getActiveSessionUser();

    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      return goals.filter((g) => !g.employeeId || g.employeeId === empId || g.employeeId === user.id);
    }
    if (employeeId) {
      return goals.filter((g) => g.employeeId === employeeId);
    }
    return goals;
  },

  async updateGoalProgress(goalId: string, progress: number): Promise<PerformanceGoal> {
    return frappeClient.updateDoc<PerformanceGoal>('Goal', goalId, {
      progress,
      status: progress >= 100 ? 'Completed' : 'In Progress',
    });
  },

  // Training & Skills
  async getSkillMatrix(): Promise<SkillMatrixItem[]> {
    return frappeClient.getList<SkillMatrixItem>('Skill Matrix');
  },

  // Assets — Strictly scoped to own allocated hardware custody for non-admins
  async getAssets(): Promise<AssetRecord[]> {
    const allAssets = await frappeClient.getList<AssetRecord>('Asset');
    const { user, isHrAdmin } = getActiveSessionUser();

    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      const empName = (user.name || '').toLowerCase();
      return allAssets.filter(
        (a) => a.assignedTo === empId || 
               a.assignedTo === user.id || 
               (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase() === empName)
      );
    }
    return allAssets;
  },

  async createAsset(asset: Partial<AssetRecord>): Promise<AssetRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR and IT Administrators can provision hardware assets.');
    }
    return frappeClient.createDoc<AssetRecord>('Asset', asset);
  },

  async updateAsset(id: string, data: Partial<AssetRecord>): Promise<AssetRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR and IT Administrators can modify hardware asset records.');
    }
    return frappeClient.updateDoc<AssetRecord>('Asset', id, data);
  },

  // Notifications
  async getNotifications(): Promise<HRNotification[]> {
    return frappeClient.getList<HRNotification>('Notification');
  },

  // --- Internship Lifecycle, Evaluation & Employment Conversion Engine ---
  async getInternshipLifecycles(): Promise<InternshipLifecycleRecord[]> {
    const lifecycles = await frappeClient.getList<InternshipLifecycleRecord>('Internship Lifecycle');
    const { user, isHrAdmin } = getActiveSessionUser();
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      return lifecycles.filter((l) => l.internId === empId || l.internId === user.id);
    }
    return lifecycles;
  },

  async recordInternshipExtension(
    internId: string, 
    newEndDate: string, 
    reason: string, 
    approvedBy: string
  ): Promise<InternshipLifecycleRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR Administrators can record internship extensions.');
    }
    const lifecycles = await this.getInternshipLifecycles();
    const existing = lifecycles.find(l => l.internId === internId);
    if (!existing) throw new Error('Internship lifecycle record not found');

    const previousEndDate = existing.scheduledEndDate;
    const historyItem = {
      previousEndDate,
      newEndDate,
      reason,
      approvedBy,
      timestamp: new Date().toISOString(),
    };

    const auditItem = {
      action: 'Internship Extended',
      actor: approvedBy,
      timestamp: new Date().toISOString(),
      details: `Scheduled end date extended from ${previousEndDate} to ${newEndDate}. Reason: ${reason}`,
    };

    return frappeClient.updateDoc<InternshipLifecycleRecord>('Internship Lifecycle', existing.internId, {
      scheduledEndDate: newEndDate,
      administrativeOutcome: 'Extended',
      extensionHistory: [...(existing.extensionHistory || []), historyItem],
      auditTrail: [...(existing.auditTrail || []), auditItem],
    });
  },

  async recordInternshipEarlyExit(
    internId: string, 
    exitDate: string, 
    reason: string, 
    approvedBy: string
  ): Promise<InternshipLifecycleRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR Administrators can record early exits.');
    }
    const lifecycles = await this.getInternshipLifecycles();
    const existing = lifecycles.find(l => l.internId === internId);
    if (!existing) throw new Error('Internship lifecycle record not found');

    const auditItem = {
      action: 'Early Exit Recorded',
      actor: approvedBy,
      timestamp: new Date().toISOString(),
      details: `Early exit recorded on ${exitDate}. Reason: ${reason}`,
    };

    return frappeClient.updateDoc<InternshipLifecycleRecord>('Internship Lifecycle', existing.internId, {
      actualEndDate: exitDate,
      administrativeOutcome: 'Early exit',
      earlyExitDetails: { exitDate, reason, approvedBy, timestamp: new Date().toISOString() },
      auditTrail: [...(existing.auditTrail || []), auditItem],
    });
  },

  async recordInternshipCompletion(
    internId: string, 
    remarks: string, 
    approvedBy: string
  ): Promise<InternshipLifecycleRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only authorized HR Administrators can record internship completion.');
    }
    const lifecycles = await this.getInternshipLifecycles();
    const existing = lifecycles.find(l => l.internId === internId);
    if (!existing) throw new Error('Internship lifecycle record not found');

    const auditItem = {
      action: 'Internship Completed',
      actor: approvedBy,
      timestamp: new Date().toISOString(),
      details: `Internship marked completed. Remarks: ${remarks}`,
    };

    return frappeClient.updateDoc<InternshipLifecycleRecord>('Internship Lifecycle', existing.internId, {
      administrativeOutcome: 'Completed',
      actualEndDate: existing.scheduledEndDate,
      auditTrail: [...(existing.auditTrail || []), auditItem],
    });
  },

  // Performance Evaluation Workflow
  async getInternEvaluations(): Promise<InternEvaluationRecord[]> {
    const evals = await frappeClient.getList<InternEvaluationRecord>('Intern Evaluation');
    const { user, isHrAdmin } = getActiveSessionUser();
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      return evals.filter((e) => (e.internId === empId || e.internId === user.id) && !e.isDraftPrivate);
    }
    return evals;
  },

  async getInternEvaluationById(id: string): Promise<InternEvaluationRecord | null> {
    const evalRecord = await frappeClient.getDoc<InternEvaluationRecord>('Intern Evaluation', id);
    if (!evalRecord) return null;
    const { user, isHrAdmin } = getActiveSessionUser();
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      if (evalRecord.internId !== empId && evalRecord.internId !== user.id) {
        throw new Error('Permission Denied: You cannot view evaluations of another intern.');
      }
      if (evalRecord.isDraftPrivate) {
        return null; // Evaluation draft is confidential to evaluator until submitted
      }
    }
    return evalRecord;
  },

  async updateInternEvaluation(
    id: string, 
    data: Partial<InternEvaluationRecord>
  ): Promise<InternEvaluationRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only evaluators and HR Administrators can modify evaluation rubrics.');
    }
    return frappeClient.updateDoc<InternEvaluationRecord>('Intern Evaluation', id, data);
  },

  async submitEvaluation(id: string): Promise<InternEvaluationRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only evaluators and HR Administrators can submit evaluations.');
    }
    return frappeClient.updateDoc<InternEvaluationRecord>('Intern Evaluation', id, {
      status: 'Submitted',
      submissionDate: new Date().toISOString().split('T')[0],
      isDraftPrivate: false,
    });
  },

  async returnEvaluationForRevision(
    id: string, 
    returnedBy: string, 
    reason: string, 
    notes: string = ''
  ): Promise<InternEvaluationRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only HR Administrators can return evaluations for revision.');
    }
    const existing = await this.getInternEvaluationById(id);
    if (!existing) throw new Error('Evaluation record not found');

    const revisionEntry = {
      returnedBy,
      returnedDate: new Date().toISOString().split('T')[0],
      reason,
      notes,
    };

    return frappeClient.updateDoc<InternEvaluationRecord>('Intern Evaluation', id, {
      status: 'In Progress',
      revisionHistory: [...(existing.revisionHistory || []), revisionEntry],
    });
  },

  // Management Decisions — Confidential to Directors and HR Admins
  async getManagementDecisions(): Promise<ManagementDecisionRecord[]> {
    const { isHrAdmin, isDirector } = getActiveSessionUser();
    if (!isHrAdmin && !isDirector) {
      return []; // Confidential executive deliberations
    }
    return frappeClient.getList<ManagementDecisionRecord>('Management Decision');
  },

  async recordManagementDecision(
    internId: string, 
    decision: ManagementDecisionOption, 
    remarks: string, 
    decidedBy: string
  ): Promise<ManagementDecisionRecord> {
    const { isHrAdmin, isDirector } = getActiveSessionUser();
    if (!isHrAdmin && !isDirector) {
      throw new Error('Permission Denied: Only Company Directors and HR Administrators can record management decisions.');
    }
    const decisions = await this.getManagementDecisions();
    const existing = decisions.find(d => d.internId === internId);
    const historyItem = {
      decision,
      actor: decidedBy,
      timestamp: new Date().toISOString(),
      remarks,
    };

    if (existing) {
      return frappeClient.updateDoc<ManagementDecisionRecord>('Management Decision', existing.id, {
        decision,
        decidedBy,
        decisionDate: new Date().toISOString().split('T')[0],
        remarks,
        history: [...(existing.history || []), historyItem],
      });
    }

    return frappeClient.createDoc<ManagementDecisionRecord>('Management Decision', {
      internId,
      decision,
      decidedBy,
      decisionDate: new Date().toISOString().split('T')[0],
      remarks,
      history: [historyItem],
    });
  },

  // Employment Offers & Controlled Permanent Conversion
  async getEmploymentOffers(): Promise<EmploymentOfferRecord[]> {
    const offers = await frappeClient.getList<EmploymentOfferRecord>('Employment Offer');
    const { user, isHrAdmin } = getActiveSessionUser();
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      return offers.filter((o) => o.internId === empId || o.internId === user.id);
    }
    return offers;
  },

  async getEmploymentOfferById(id: string): Promise<EmploymentOfferRecord | null> {
    const offer = await frappeClient.getDoc<EmploymentOfferRecord>('Employment Offer', id);
    if (!offer) return null;
    const { user, isHrAdmin } = getActiveSessionUser();
    if (user && !isHrAdmin) {
      const empId = user.employeeId || user.id;
      if (offer.internId !== empId && offer.internId !== user.id) {
        throw new Error('Permission Denied: You cannot view employment offers for other personnel.');
      }
    }
    return offer;
  },

  async updateEmploymentOffer(
    id: string, 
    data: Partial<EmploymentOfferRecord>
  ): Promise<EmploymentOfferRecord> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only HR Administrators can modify employment offer contracts.');
    }
    return frappeClient.updateDoc<EmploymentOfferRecord>('Employment Offer', id, data);
  },

  async recordOfferResponse(
    offerId: string, 
    response: 'Accepted' | 'Declined' | 'Rejected', 
    actualJoiningDate?: string,
    actor: string = 'Authorized Candidate'
  ): Promise<EmploymentOfferRecord> {
    const offer = await this.getEmploymentOfferById(offerId);
    if (!offer) throw new Error('Offer not found');

    const historyItem = {
      status: `Offer ${response}`,
      actor,
      timestamp: new Date().toISOString(),
      remarks: response === 'Accepted' ? `Offer accepted with proposed joining ${actualJoiningDate || offer.terms.proposedJoiningDate}` : 'Candidate declined employment offer.',
    };

    const newConversionStatus = response === 'Accepted'
      ? 'Offer Accepted — Joining Pending'
      : 'Internship Completed — Not Converted';

    return frappeClient.updateDoc<EmploymentOfferRecord>('Employment Offer', offerId, {
      offerStatus: response === 'Accepted' ? 'Accepted' : 'Rejected',
      acceptanceStatus: response === 'Accepted' ? 'Accepted' : 'Declined',
      responseDate: new Date().toISOString().split('T')[0],
      conversionStatus: newConversionStatus,
      terms: {
        ...offer.terms,
        actualJoiningDate: actualJoiningDate || offer.terms.actualJoiningDate,
      },
      history: [...(offer.history || []), historyItem],
    });
  },

  async activatePermanentEmployment(
    offerId: string, 
    actor: string = 'Authorized HR'
  ): Promise<{ offer: EmploymentOfferRecord; employee: Employee }> {
    const { isHrAdmin } = getActiveSessionUser();
    if (!isHrAdmin) {
      throw new Error('Permission Denied: Only HR Administrators can formally activate permanent employment and payroll.');
    }
    const offer = await this.getEmploymentOfferById(offerId);
    if (!offer) throw new Error('Offer not found');

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedOffer = await frappeClient.updateDoc<EmploymentOfferRecord>('Employment Offer', offerId, {
      conversionStatus: 'Permanent Employment Active',
      effectiveConversionDate: todayStr,
      activatedAt: new Date().toISOString(),
      history: [
        ...(offer.history || []),
        {
          status: 'Permanent Employment Activated',
          actor,
          timestamp: new Date().toISOString(),
          details: `Permanent employment active on ${todayStr}. Compensation terms enabled.`,
          remarks: 'Converted from unpaid internship preserving original person identity and history.',
        }
      ],
    });

    // Update the single existing person record (preserve original identity!)
    const employee = await frappeClient.getDoc<Employee>('Employee', offer.internId);
    if (!employee) throw new Error('Employee record not found for conversion');

    const updatedEmployee = await frappeClient.updateDoc<Employee>('Employee', offer.internId, {
      department: offer.terms.department !== 'Not provided' ? offer.terms.department : employee.department,
      designation: offer.terms.designation !== 'Not provided' ? offer.terms.designation : 'Software Engineer',
      employmentArrangement: offer.terms.employmentArrangement,
      employmentType: 'Full-time',
      baseSalary: offer.terms.approvedSalary,
      compensationStatus: 'Paid',
      conversionDetails: {
        conversionStatus: 'Permanent Employment Active',
        offerId: offer.id,
        actualJoiningDate: offer.terms.actualJoiningDate || todayStr,
        effectiveDate: todayStr,
      },
      profileCompleteness: 'Complete',
    });

    return { offer: updatedOffer, employee: updatedEmployee };
  },
};
