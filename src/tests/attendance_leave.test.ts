import { hrmsService } from '../services/hrmsService';
import { 
  isAuthorizedAttendanceLeaveAdmin, 
  isAuthorizedAlternativeLeaveApprover,
  getScheduledWorkMode, 
  calculateWorkingDays,
  generateIndividualAttendanceTimeline,
  INTERNSHIP_START_DATE,
  INTERNSHIP_END_DATE,
  INTERN_COHORT_MONTHS,
  calculateInternMonthlyMetrics,
  calculateEmployeeTenure,
  getEmployeeLeaveBalance,
  EMPLOYEE_NAV_PERIODS
} from '../services/attendanceScheduleService';
import { INITIAL_EMPLOYEES } from '../lib/mockData';

// ANSI color helpers
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

async function runTestSuite() {
  console.log(cyan('========================================================================'));
  console.log(cyan('  ETHX HRMS: Attendance & Leave Management Architectural Test Suite     '));
  console.log(cyan('========================================================================\n'));

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ${green('✔ PASS')}: ${testName}`);
      passed++;
    } else {
      console.log(`  ${red('✖ FAIL')}: ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 1: Access Control - Niky Sharma's HR Account Authorization
  // -------------------------------------------------------------------------
  console.log(cyan('\n[1. Access Control: Niky Sharma HR Authorization]'));
  
  // 1.1 Niky Sharma ID binding
  assert(
    isAuthorizedAttendanceLeaveAdmin('emp-005') && isAuthorizedAttendanceLeaveAdmin('ETHX-005'),
    'Niky Sharma (emp-005 / ETHX-005) is verified as authorized attendance & leave admin'
  );

  // 1.2 Other HR / Managers denied admin access (no title-based auto grant)
  assert(
    !isAuthorizedAttendanceLeaveAdmin('emp-006'), // Madhavi Singh (IT HR)
    'Madhavi Singh (emp-006, IT HR) is NOT automatically granted org-wide admin rights'
  );
  assert(
    !isAuthorizedAttendanceLeaveAdmin('emp-004'), // Siva Kumar (IT Director)
    'Siva Kumar (emp-004, IT Leadership) is NOT granted attendance/leave admin rights'
  );
  assert(
    !isAuthorizedAttendanceLeaveAdmin('emp-014'), // Krishna Tiwari (Intern)
    'Krishna Tiwari (emp-014, Intern) is NOT granted admin rights'
  );

  // 1.3 Alternative approver binding (Ram Chaturvedi for Niky's leave)
  assert(
    isAuthorizedAlternativeLeaveApprover('emp-001') && isAuthorizedAlternativeLeaveApprover('ETHX-001'),
    'Ram Chaturvedi (emp-001 / ETHX-001) is verified as authorized director approver'
  );

  // 1.4 Scoped Attendance Records
  const allAtt = await hrmsService.getAttendanceRecords('emp-005');
  assert(allAtt.length > 0, `Niky Sharma retrieves full organization attendance records (count: ${allAtt.length})`);
  const targetRecordId = allAtt[0].id;

  const internAtt = await hrmsService.getAttendanceRecords('emp-021');
  assert(
    internAtt.every((r) => r.employeeId === 'emp-021' || r.employeeId === 'ETHX-021'),
    'Intern (emp-021) calling getAttendanceRecords receives ONLY own records'
  );

  // 1.5 Non-admin blocked from viewing another person's day-wise history
  let deniedHistory = false;
  try {
    await hrmsService.getAttendanceHistory('emp-021', 'ETHX-005');
  } catch (err: any) {
    deniedHistory = err.message.includes('Permission Denied');
  }
  assert(deniedHistory, 'Non-admin attempting to view another employee history is strictly blocked');

  // 1.6 Non-admin blocked from making attendance corrections
  let deniedCorrection = false;
  try {
    await hrmsService.correctAttendance(targetRecordId, { status: 'Present', reason: 'Test correction' }, 'emp-021');
  } catch (err: any) {
    deniedCorrection = err.message.includes('Permission Denied');
  }
  assert(deniedCorrection, 'Non-admin attempting to correct attendance is strictly blocked with 403 Permission Denied');

  // -------------------------------------------------------------------------
  // TEST SECTION 2: Intern Dates & Weekly Work Schedule
  // -------------------------------------------------------------------------
  console.log(cyan('\n[2. Intern Dates & Weekly Work Schedule (1 Jul – 30 Sep 2026)]'));

  assert(INTERNSHIP_START_DATE === '2026-07-01', 'Internship start date is 1 July 2026');
  assert(INTERNSHIP_END_DATE === '2026-09-30', 'Internship end date is 30 September 2026');

  // 2026-07-01 was Wednesday -> Mon/Tue/Wed must be WFO
  const wedSchedule = getScheduledWorkMode('2026-07-01', true);
  assert(wedSchedule.mode === 'WFO', 'Intern Wednesday schedule is Work From Office (WFO)');

  // 2026-07-02 was Thursday -> Thu/Fri must be WFH
  const thuSchedule = getScheduledWorkMode('2026-07-02', true);
  assert(thuSchedule.mode === 'WFH', 'Intern Thursday schedule is Work From Home (WFH)');

  // 2026-07-03 was Friday -> WFH
  const friSchedule = getScheduledWorkMode('2026-07-03', true);
  assert(friSchedule.mode === 'WFH', 'Intern Friday schedule is Work From Home (WFH)');

  // 2026-07-04 was Saturday -> Weekly Off
  const satSchedule = getScheduledWorkMode('2026-07-04', true);
  assert(satSchedule.mode === 'Weekly Off', 'Intern Saturday schedule is Weekly Off');

  // 2026-07-05 was Sunday -> Weekly Off
  const sunSchedule = getScheduledWorkMode('2026-07-05', true);
  assert(sunSchedule.mode === 'Weekly Off', 'Intern Sunday schedule is Weekly Off');

  // Scheduled work mode is separate from actual attendance status
  assert(wedSchedule.mode !== 'Present', 'Scheduled work mode (WFO) is separate from actual attendance status');

  // -------------------------------------------------------------------------
  // TEST SECTION 3: Handle Missing Historical Attendance Honestly
  // -------------------------------------------------------------------------
  console.log(cyan('\n[3. Honest Missing Historical Attendance]'));

  const krishnaEmp = INITIAL_EMPLOYEES.find((e) => e.fullName === 'Krishna Tiwari')!;
  assert(!!krishnaEmp, 'Found verified record for intern Krishna Tiwari');

  const timeline = generateIndividualAttendanceTimeline(
    krishnaEmp,
    '2026-07-01',
    '2026-07-07',
    [], // No fake historical punches passed
    []
  );

  const missingDay = timeline.find((d) => d.date === '2026-07-02')!;
  assert(missingDay.status === 'Not Recorded', 'Historical day without recorded punch is marked "Not Recorded" (not fabricated as Present/Absent)');
  assert(missingDay.workHours === 0, 'Missing day has 0 work hours (no fabricated hours)');
  assert(missingDay.dataCoverage === 'Not Recorded', 'Data coverage indicator clearly states "Not Recorded"');

  // -------------------------------------------------------------------------
  // TEST SECTION 4: Authorized Attendance Correction with Audit Trail
  // -------------------------------------------------------------------------
  console.log(cyan('\n[4. Niky Sharma Authorized Attendance Correction & Audit Log]'));

  // 4.1 Missing reason throws validation error
  let missingReasonBlocked = false;
  try {
    await hrmsService.correctAttendance(targetRecordId, { status: 'Present', reason: '' }, 'emp-005');
  } catch (err: any) {
    missingReasonBlocked = err.message.includes('mandatory justification reason');
  }
  assert(missingReasonBlocked, 'Attendance correction without mandatory reason is rejected with validation error');

  // 4.2 Valid correction by Niky logs audit trail
  const correctedRec = await hrmsService.correctAttendance(
    targetRecordId,
    {
      status: 'Present',
      checkIn: '09:05 AM',
      checkOut: '06:15 PM',
      workHours: 8.5,
      actualWorkMode: 'WFO',
      reason: 'Biometric turnstile glitch verified with Pune HQ security CCTV log',
    },
    'emp-005'
  );

  assert(correctedRec.status === 'Present', 'Attendance record status updated to Present');
  assert(correctedRec.workHours === 8.5, 'Work hours updated to 8.5h');
  const audit = correctedRec.correctionHistory?.[correctedRec.correctionHistory.length - 1];
  assert(
    audit?.actor === 'Niky Sharma' && audit?.actorId === 'emp-005',
    'Correction history audit records Niky Sharma as actor and emp-005 as actorId'
  );
  assert(
    audit?.reason.includes('Biometric turnstile glitch'),
    'Correction history preserves the exact justification reason'
  );

  // -------------------------------------------------------------------------
  // TEST SECTION 5: Leave Application Workflow & Self-Approval Guard
  // -------------------------------------------------------------------------
  console.log(cyan('\n[5. Leave Application Workflow & Self-Approval Prevention]'));

  // 5.1 Invalid dates validation (fromDate > toDate)
  let invalidDateBlocked = false;
  try {
    await hrmsService.applyLeave(
      {
        employeeId: 'ETHX-014',
        employeeName: 'Krishna Tiwari',
        department: 'Engineering & Cloud',
        applicantCategory: 'Intern',
        leaveType: 'Unpaid Internship Leave',
        fromDate: '2026-08-10',
        toDate: '2026-08-05',
        reason: 'Backwards dates test',
      },
      'emp-014'
    );
  } catch (err: any) {
    invalidDateBlocked = err.message.includes('From Date cannot be after To Date');
  }
  assert(invalidDateBlocked, 'Invalid date range (fromDate > toDate) is rejected');

  // 5.2 Paid leave request for unpaid intern is rejected
  let internPaidLeaveBlocked = false;
  try {
    await hrmsService.applyLeave(
      {
        employeeId: 'ETHX-014',
        employeeName: 'Krishna Tiwari',
        department: 'Engineering & Cloud',
        applicantCategory: 'Intern',
        leaveType: 'Annual Leave', // Paid leave not allowed for unpaid intern!
        fromDate: '2026-08-10',
        toDate: '2026-08-12',
        reason: 'Paid leave request',
      },
      'emp-014'
    );
  } catch (err: any) {
    internPaidLeaveBlocked = err.message.includes('Unpaid interns are not eligible for paid leave entitlements');
  }
  assert(internPaidLeaveBlocked, 'Unpaid intern requesting paid Annual Leave is rejected with policy error');

  // 5.3 Valid Unpaid Internship Leave succeeds
  const validInternLeave = await hrmsService.applyLeave(
    {
      employeeId: 'ETHX-014',
      employeeName: 'Krishna Tiwari',
      department: 'Engineering & Cloud',
      applicantCategory: 'Intern',
      leaveType: 'Unpaid Internship Leave',
      fromDate: '2026-08-10', // Monday
      toDate: '2026-08-12',   // Wednesday (3 working days)
      reason: 'College engineering exam submission',
    },
    'emp-014'
  );
  assert(validInternLeave.status === 'Pending', 'Valid intern leave application created with status Pending');
  assert(validInternLeave.totalDays === 3, 'Calculated duration correctly accounts for 3 working days');

  // 5.4 Overlapping application is rejected
  let overlapBlocked = false;
  try {
    await hrmsService.applyLeave(
      {
        employeeId: 'ETHX-014',
        employeeName: 'Krishna Tiwari',
        department: 'Engineering & Cloud',
        applicantCategory: 'Intern',
        leaveType: 'Academic Leave',
        fromDate: '2026-08-11', // Overlaps with 2026-08-10 to 2026-08-12
        toDate: '2026-08-14',
        reason: 'Overlapping test',
      },
      'emp-014'
    );
  } catch (err: any) {
    overlapBlocked = err.message.includes('active leave application already exists');
  }
  assert(overlapBlocked, 'Overlapping leave application for same applicant is rejected');

  // 5.5 Rejection requires mandatory reason
  let rejectionReasonBlocked = false;
  try {
    await hrmsService.updateLeaveStatus(validInternLeave.id, 'Rejected', 'emp-005', undefined, '');
  } catch (err: any) {
    rejectionReasonBlocked = err.message.includes('mandatory rejection reason is required');
  }
  assert(rejectionReasonBlocked, 'Leave rejection without mandatory reason is rejected');

  // 5.6 Self-Approval Prevention for Niky Sharma
  const nikyLeave = await hrmsService.applyLeave(
    {
      employeeId: 'ETHX-005',
      employeeName: 'Niky Sharma',
      department: 'Human Resources',
      applicantCategory: 'Employee',
      leaveType: 'Annual Leave',
      fromDate: '2026-08-20',
      toDate: '2026-08-21',
      reason: 'Personal family event',
    },
    'emp-005'
  );
  assert(
    nikyLeave.status === 'Pending Director Approval' && nikyLeave.isSelfApprovalBlocked === true,
    'Niky Sharma leave application automatically routes to "Pending Director Approval" (self-approval blocked)'
  );

  // Niky attempting to approve her own leave throws self-approval prohibited error
  let selfApprovalBlocked = false;
  try {
    await hrmsService.updateLeaveStatus(nikyLeave.id, 'Approved', 'emp-005');
  } catch (err: any) {
    selfApprovalBlocked = err.message.includes('Self-approval prohibited');
  }
  assert(selfApprovalBlocked, 'Niky Sharma attempting to self-approve her own leave is blocked');

  // Company Director (Ram Chaturvedi emp-001) approves Niky's leave
  const approvedNikyLeave = await hrmsService.updateLeaveStatus(
    nikyLeave.id,
    'Approved',
    'emp-001',
    'Approved by Director'
  );
  assert(
    approvedNikyLeave.status === 'Approved' && approvedNikyLeave.decidedBy?.includes('Ram Chaturvedi'),
    'Company Director (Ram Chaturvedi) successfully approves Niky Sharma leave'
  );

  // -------------------------------------------------------------------------
  // TEST SECTION 6: Attendance and Leave Ledger Consistency
  // -------------------------------------------------------------------------
  console.log(cyan('\n[6. Attendance & Leave Ledger Consistency]'));

  // Approve the intern leave
  const approvedInternLeave = await hrmsService.updateLeaveStatus(
    validInternLeave.id,
    'Approved',
    'emp-005',
    'Approved for college exam'
  );
  assert(approvedInternLeave.status === 'Approved', 'Intern leave approved by Niky Sharma');

  // Verify attendance ledger is updated to Approved Leave for the dates
  const attAfterLeave = await hrmsService.getAttendanceRecords('emp-005');
  const ledgerEntry = attAfterLeave.find(
    (a) => a.employeeId === 'ETHX-014' && a.date === '2026-08-10'
  );
  assert(ledgerEntry?.status === 'Approved Leave', 'Attendance record for 2026-08-10 automatically updated to "Approved Leave"');

  // Seed a check-in punch on today's date
  const punchDate = new Date().toISOString().split('T')[0];
  await hrmsService.punchAttendance('ETHX-007', 'Shubham Patane', 'Engineering & Cloud', 'IN', 'WFO');
  
  // Now apply and approve a leave for that date
  const conflictingLeave = await hrmsService.applyLeave(
    {
      employeeId: 'ETHX-007',
      employeeName: 'Shubham Patane',
      department: 'Engineering & Cloud',
      applicantCategory: 'Employee',
      leaveType: 'Sick Leave',
      fromDate: punchDate,
      toDate: punchDate,
      reason: 'Sudden fever',
    },
    'emp-007'
  );

  const approvedConflictLeave = await hrmsService.updateLeaveStatus(
    conflictingLeave.id,
    'Approved',
    'emp-005'
  );
  assert(
    approvedConflictLeave.conflictWithAttendance === true,
    'Approved leave detects conflict with existing attendance punch on the same date'
  );

  // Leave Cancellation reverses ledger effects
  const cancelledLeave = await hrmsService.cancelLeave(validInternLeave.id, 'emp-014');
  assert(cancelledLeave.status === 'Cancelled', 'Leave application cancelled by applicant');

  const attAfterCancel = await hrmsService.getAttendanceRecords('emp-005');
  const revertedEntry = attAfterCancel.find(
    (a) => a.employeeId === 'ETHX-014' && a.date === '2026-08-10'
  );
  assert(
    revertedEntry?.status === 'Not Recorded',
    'Attendance ledger entry reverted to "Not Recorded" upon leave cancellation'
  );

  // -------------------------------------------------------------------------
  // TEST SECTION 7: Internship Completion (30 September 2026 Cutoff)
  // -------------------------------------------------------------------------
  console.log(cyan('\n[7. Internship Completion Boundary (30 September 2026)]'));

  // Intern applying for leave in October 2026 is rejected
  let internPostEngagementBlocked = false;
  try {
    await hrmsService.applyLeave(
      {
        employeeId: 'ETHX-014',
        employeeName: 'Krishna Tiwari',
        department: 'Engineering & Cloud',
        applicantCategory: 'Intern',
        leaveType: 'Unpaid Internship Leave',
        fromDate: '2026-10-05',
        toDate: '2026-10-07',
        reason: 'Post-internship leave',
      },
      'emp-014'
    );
  } catch (err: any) {
    internPostEngagementBlocked = err.message.includes('Internship period concludes on 30 September 2026');
  }
  assert(internPostEngagementBlocked, 'Intern leave beyond 30 September 2026 is strictly rejected');

  // Timeline stops generating intern workdays after 30 September 2026
  const postEndTimeline = generateIndividualAttendanceTimeline(
    krishnaEmp,
    '2026-10-01',
    '2026-10-05',
    [],
    []
  );
  assert(
    postEndTimeline.length === 0,
    'Timeline stops generating new internship workdays from 1 October 2026 onward'
  );

  // -------------------------------------------------------------------------
  // TEST SECTION 8: Working Days Calculation in Asia/Kolkata
  // -------------------------------------------------------------------------
  console.log(cyan('\n[8. Date & Working Days Calculation]'));

  // 2026-08-01 (Saturday) to 2026-08-02 (Sunday) = 0 working days
  const weekendDays = calculateWorkingDays('2026-08-01', '2026-08-02', 'Full Day');
  assert(weekendDays === 0, 'Saturday-Sunday range correctly returns 0 working days');

  // 2026-08-03 (Mon) to 2026-08-07 (Fri) = 5 working days
  const workWeekDays = calculateWorkingDays('2026-08-03', '2026-08-07', 'Full Day');
  assert(workWeekDays === 5, 'Monday-Friday range correctly returns 5 working days');

  // Half day = 0.5 days
  const halfDay = calculateWorkingDays('2026-08-03', '2026-08-03', 'Half Day (First Half)');
  assert(halfDay === 0.5, 'Half-day option correctly returns 0.5 working days');

  // -------------------------------------------------------------------------
  // TEST SECTION 9: Saturday & Sunday Holiday Policy & Intern Month-Wise Breakdown
  // -------------------------------------------------------------------------
  console.log(cyan('\n[9. Saturday & Sunday Holiday Policy & Intern Month-Wise Ledger]'));

  // 9.1 Verify Saturday and Sunday are marked as Weekend Holiday / Weekly Off
  const satCheck = getScheduledWorkMode('2026-07-04', true);
  assert(
    satCheck.mode === 'Weekly Off' && satCheck.isWeekend === true && (satCheck.holidayName?.includes('Saturday') ?? false),
    'Saturday 2026-07-04 is verified as Weekend Holiday (mode: Weekly Off, isWeekend: true)'
  );

  const sunCheck = getScheduledWorkMode('2026-07-05', true);
  assert(
    sunCheck.mode === 'Weekly Off' && sunCheck.isWeekend === true && (sunCheck.holidayName?.includes('Sunday') ?? false),
    'Sunday 2026-07-05 is verified as Weekend Holiday (mode: Weekly Off, isWeekend: true)'
  );

  // 9.2 Verify all 8 interns are in master records
  const expectedInternNames = [
    'Deepti Tiwari',
    'Goraksh Kaduskar',
    'Rushikesh Kulkarni',
    'Utkarsh',
    'Shakti Thakur',
    'Sayali Mahant',
    'Preeti Bagal',
    'Krishna Tiwari'
  ];
  const foundInterns = INITIAL_EMPLOYEES.filter(
    (e) => e.engagementCategory === 'Intern' || e.employeeId.startsWith('ETHX-INT-')
  );
  assert(foundInterns.length === 8, `Exactly 8 verified interns found in system (count: ${foundInterns.length})`);
  const allNamesPresent = expectedInternNames.every((name) =>
    foundInterns.some((i) => i.fullName === name)
  );
  assert(allNamesPresent, 'All 8 user-confirmed interns verified by name in system');

  // 9.3 Verify Monthly Cohort Configs
  assert(INTERN_COHORT_MONTHS.length === 4, 'Intern cohort has 4 views: July 2026, August 2026, September 2026, Full Q3');
  const julyConf = INTERN_COHORT_MONTHS.find((m) => m.key === '2026-07')!;
  const augConf = INTERN_COHORT_MONTHS.find((m) => m.key === '2026-08')!;
  const sepConf = INTERN_COHORT_MONTHS.find((m) => m.key === '2026-09')!;
  const fullConf = INTERN_COHORT_MONTHS.find((m) => m.key === 'Q3')!;

  assert(julyConf.totalDays === 31, 'July 2026 has 31 calendar days');
  assert(augConf.totalDays === 31, 'August 2026 has 31 calendar days');
  assert(sepConf.totalDays === 30, 'September 2026 has 30 calendar days');
  assert(fullConf.totalDays === 92, 'Full Q3 Internship Lifecycle has 92 calendar days');

  // 9.4 Verify Monthly Metrics Engine calculates weekend holidays and working days accurately
  const julyTimeline = generateIndividualAttendanceTimeline(krishnaEmp, julyConf.startDate, julyConf.endDate, [], []);
  const julyMetrics = calculateInternMonthlyMetrics(julyTimeline, julyConf);
  assert(julyMetrics.totalDays === 31, 'July metrics: 31 calendar days');
  assert(julyMetrics.weekendHolidays === 8, 'July metrics: Exactly 8 weekend holidays (4 Sats + 4 Suns)');
  assert(julyMetrics.workingDays === 23, 'July metrics: Exactly 23 working days (Mon-Fri)');

  const augTimeline = generateIndividualAttendanceTimeline(krishnaEmp, augConf.startDate, augConf.endDate, [], []);
  const augMetrics = calculateInternMonthlyMetrics(augTimeline, augConf);
  assert(augMetrics.totalDays === 31, 'August metrics: 31 calendar days');
  assert(augMetrics.weekendHolidays === 10, 'August metrics: Exactly 10 weekend holidays (5 Sats + 5 Suns)');
  assert(augMetrics.workingDays === 20, 'August metrics: Exactly 20 working days (21 weekdays minus 1 Independence Day)');

  const sepTimeline = generateIndividualAttendanceTimeline(krishnaEmp, sepConf.startDate, sepConf.endDate, [], []);
  const sepMetrics = calculateInternMonthlyMetrics(sepTimeline, sepConf);
  assert(sepMetrics.totalDays === 30, 'September metrics: 30 calendar days');
  assert(sepMetrics.weekendHolidays === 8, 'September metrics: Exactly 8 weekend holidays (4 Sats + 4 Suns)');
  assert(sepMetrics.workingDays === 22, 'September metrics: Exactly 22 working days');

  const fullTimeline = generateIndividualAttendanceTimeline(krishnaEmp, fullConf.startDate, fullConf.endDate, [], []);
  const fullMetrics = calculateInternMonthlyMetrics(fullTimeline, fullConf);
  assert(fullMetrics.totalDays === 92, 'Full lifecycle metrics: 92 calendar days');
  assert(fullMetrics.weekendHolidays === 26, 'Full lifecycle metrics: Exactly 26 weekend holidays (13 Sats + 13 Suns)');
  assert(fullMetrics.workingDays === 65, 'Full lifecycle metrics: Exactly 65 working days');

  // ---------------------------------------------------------------------------
  // 10. HR Manual Attendance Marking for Interns and Employees
  // ---------------------------------------------------------------------------
  console.log(yellow('\n[10. HR Manual Attendance Marking for Interns & Employees]'));

  // Test: Unauthorized actor cannot mark manual attendance
  let unauthorizedError = false;
  try {
    await hrmsService.markManualAttendance(
      'ETHX-001',
      '2026-09-21',
      {
        status: 'Present',
        reason: 'Unauthorized attempt by intern',
      },
      'emp-014'
    );
  } catch (err: any) {
    unauthorizedError = true;
    assert(err.message.includes('Only designated HR administrator'), 'Unauthorized user blocked from marking manual attendance');
  }
  assert(unauthorizedError, 'Non-admin cannot mark manual attendance');

  // Test: Missing justification reason rejected
  let missingReasonError = false;
  try {
    await hrmsService.markManualAttendance(
      'ETHX-002',
      '2026-09-22',
      {
        status: 'Present',
        reason: '   ',
      },
      'ETHX-005'
    );
  } catch (err: any) {
    missingReasonError = true;
    assert(err.message.includes('mandatory justification reason'), 'Empty justification reason is rejected');
  }
  assert(missingReasonError, 'Manual attendance requires non-empty justification reason');

  // Test: Niky Sharma marks manual attendance for Full-Time Employee
  const empManualRecord = await hrmsService.markManualAttendance(
    'ETHX-002',
    '2026-09-21',
    {
      status: 'Present',
      actualWorkMode: 'WFO',
      checkIn: '09:15 AM',
      checkOut: '06:30 PM',
      workHours: 8.5,
      reason: 'Biometric reader offline at Pune Campus Gate 2',
    },
    'ETHX-005'
  );
  assert(empManualRecord.employeeId === 'ETHX-002', 'Manual attendance successfully recorded for full-time employee');
  assert(empManualRecord.status === 'Present', 'Status correctly set to Present');
  assert(empManualRecord.workHours === 8.5, 'Work hours recorded as 8.5h');
  assert(
    empManualRecord.correctionHistory?.some((h) => h.reason.includes('Biometric reader offline')),
    'Audit history contains mandatory justification and Niky Sharma attribution'
  );

  // Test: Niky Sharma marks manual attendance for Cohort 8 Intern
  const internManualRecord = await hrmsService.markManualAttendance(
    'ETHX-021',
    '2026-09-22',
    {
      status: 'Present',
      actualWorkMode: 'WFO',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      workHours: 8.0,
      reason: 'Approved manual attendance - Client project deliverable demo at Pune HQ',
    },
    'ETHX-005'
  );
  assert(internManualRecord.employeeId === 'ETHX-021', 'Manual attendance successfully recorded for intern Krishna Tiwari');
  assert(internManualRecord.status === 'Present', 'Intern status correctly recorded as Present');
  assert(
    internManualRecord.correctionHistory?.some((h) => h.actor === 'Niky Sharma' && h.reason.includes('Client project deliverable')),
    'Intern record audit history confirms Niky Sharma actor attribution'
  );

  // ---------------------------------------------------------------------------
  // 11. Full-Time Employee (2 to 3 Years Tenure) Career & Multi-Month Management
  // ---------------------------------------------------------------------------
  console.log(yellow('\n[11. Full-Time Employee (2-3 Years Tenure) & Intern July-Sept Scoping]'));

  // Test: Shubham Patane (ETHX-007) verified with 2-3 years tenure
  const shubhamEmp = INITIAL_EMPLOYEES.find((e) => e.employeeId === 'ETHX-007')!;
  const shubhamTenure = calculateEmployeeTenure(shubhamEmp);
  assert(shubhamTenure.isTwoToThreeYears, 'Shubham Patane (ETHX-007) confirmed with 2 to 3 years tenure');
  assert(shubhamTenure.tenureYears === 2, 'Shubham Patane completed full 2 years of corporate service');
  assert(shubhamTenure.tenureDisplay.includes('Year'), 'Tenure display correctly renders years and months');

  // Test: Saurav Sarkar (ETHX-008) verified with 2-3 years tenure
  const sauravEmp = INITIAL_EMPLOYEES.find((e) => e.employeeId === 'ETHX-008')!;
  const sauravTenure = calculateEmployeeTenure(sauravEmp);
  assert(sauravTenure.isTwoToThreeYears, 'Saurav Sarkar (ETHX-008) confirmed with 2 to 3 years tenure');

  // Test: Full-time employees have paid annual leave quota (unlike unpaid interns)
  const empLeaveQuota = getEmployeeLeaveBalance(shubhamEmp);
  assert(empLeaveQuota.annualLeaveTotal === 18, 'Permanent employee entitled to 18 paid Annual Leaves');
  assert(empLeaveQuota.annualLeaveRemaining === 15, 'Employee has 15 remaining Annual Leaves after usage');
  assert(empLeaveQuota.casualLeaveTotal === 12, 'Employee entitled to 12 paid Casual Leaves');
  assert(empLeaveQuota.sickLeaveTotal === 10, 'Employee entitled to 10 paid Sick Leaves');

  // Test: Multi-period navigation configuration available for 2-3 year staff
  assert(EMPLOYEE_NAV_PERIODS.length >= 6, 'Employee navigation provides at least 6 periods across multiple months');
  assert(EMPLOYEE_NAV_PERIODS.some((p) => p.key === '2026-09'), 'Current month (Sep 2026) accessible to employee');
  assert(EMPLOYEE_NAV_PERIODS.some((p) => p.key === '2026-08'), 'Previous month (Aug 2026) accessible to employee');
  assert(EMPLOYEE_NAV_PERIODS.some((p) => p.key === '2026-07'), 'Quarter opening month (Jul 2026) accessible to employee');
  assert(EMPLOYEE_NAV_PERIODS.some((p) => p.key === '2026-Q3'), 'Full Q3 aggregate period accessible to employee');
  assert(EMPLOYEE_NAV_PERIODS.some((p) => p.key === '2026-YTD'), 'Cumulative Year-To-Date (2026) accessible to employee');

  // Test: Employee timeline generation across monthly periods
  const sepEmpTimeline = generateIndividualAttendanceTimeline(shubhamEmp, '2026-09-01', '2026-09-30', [], []);
  assert(sepEmpTimeline.length === 30, 'September timeline generates exactly 30 days for employee');

  const augEmpTimeline = generateIndividualAttendanceTimeline(shubhamEmp, '2026-08-01', '2026-08-31', [], []);
  assert(augEmpTimeline.length === 31, 'August timeline generates exactly 31 days for employee');

  const julEmpTimeline = generateIndividualAttendanceTimeline(shubhamEmp, '2026-07-01', '2026-07-31', [], []);
  assert(julEmpTimeline.length === 31, 'July timeline generates exactly 31 days for employee');

  // Test: Intern July-September scoping & privacy
  const krishnaIntern = INITIAL_EMPLOYEES.find((e) => e.employeeId === 'ETHX-021')!;
  const internJulyTimeline = generateIndividualAttendanceTimeline(krishnaIntern, '2026-07-01', '2026-07-31', [], []);
  assert(internJulyTimeline.length === 31, 'Intern can see complete July attendance record (31 days)');

  const internAugustTimeline = generateIndividualAttendanceTimeline(krishnaIntern, '2026-08-01', '2026-08-31', [], []);
  assert(internAugustTimeline.length === 31, 'Intern can see complete August attendance record (31 days)');

  const internSeptTimeline = generateIndividualAttendanceTimeline(krishnaIntern, '2026-09-01', '2026-09-30', [], []);
  assert(internSeptTimeline.length === 30, 'Intern can see complete September attendance record (30 days)');

  // Test: Intern schedule enforces weekend holidays (0 work hours)
  const satRecord = internSeptTimeline.find((r) => r.date === '2026-09-26')!;
  assert(satRecord.scheduledWorkMode === 'Weekly Off', 'Intern Saturday is strictly Weekly Off');
  assert(satRecord.status === 'Weekly Off', 'Intern Saturday status is Weekly Off');

  console.log(cyan('\n========================================================================'));
  console.log(`  Test Suite Completed: ${green(`${passed} PASSED`)}, ${failed > 0 ? red(`${failed} FAILED`) : '0 FAILED'}`);
  console.log(cyan('========================================================================\n'));

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
