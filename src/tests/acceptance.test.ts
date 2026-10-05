import {
  INITIAL_EMPLOYEES,
  INITIAL_INTERNSHIP_LIFECYCLES,
  INITIAL_INTERN_EVALUATIONS,
  INITIAL_MANAGEMENT_DECISIONS,
  INITIAL_EMPLOYMENT_OFFERS
} from '../lib/mockData';

declare const process: any;

console.log('================================================================');
console.log('ETHX HRMS ACCEPTANCE TEST SUITE: CONFIRMED ROSTER & WORKFLOW');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

// 1. Roster represents 21 unique people once
assert(INITIAL_EMPLOYEES.length === 21, 'Roster represents exactly 21 personnel records', `Got ${INITIAL_EMPLOYEES.length}`);
const uniqueIds = new Set(INITIAL_EMPLOYEES.map(e => e.id));
const uniqueEmployeeIds = new Set(INITIAL_EMPLOYEES.map(e => e.employeeId));
const uniqueNames = new Set(INITIAL_EMPLOYEES.map(e => e.fullName));
assert(uniqueIds.size === 21 && uniqueEmployeeIds.size === 21 && uniqueNames.size === 21, 'Every person has a unique ID, employeeId, and fullName (0 duplicates)');

// Category counts
const interns = INITIAL_EMPLOYEES.filter(e => e.engagementCategory === 'Intern');
const generalEmployees = INITIAL_EMPLOYEES.filter(e => 
  e.engagementCategory === 'Employee' && 
  e.organisationalRole === 'Employee'
);
const hrTeam = INITIAL_EMPLOYEES.filter(e => e.organisationalRole?.includes('HR'));
const itLeadership = INITIAL_EMPLOYEES.filter(e => e.organisationalRole === 'IT Director / Manager');
const directors = INITIAL_EMPLOYEES.filter(e => e.engagementCategory === 'Company Director');
const contractRelated = INITIAL_EMPLOYEES.filter(e => 
  e.employmentArrangement === 'Contract' || 
  e.organisationalRole?.includes('contract') || 
  e.organisationalRole?.includes('Contract')
);

assert(interns.length === 8, 'Confirmed 8 Unpaid Interns count', `Got ${interns.length}`);
assert(generalEmployees.length === 5, 'Confirmed 5 General Employees count', `Got ${generalEmployees.length}`);
assert(hrTeam.length === 2, 'Confirmed 2 HR Team members count', `Got ${hrTeam.length}`);
assert(itLeadership.length === 1, 'Confirmed 1 IT Leadership member count', `Got ${itLeadership.length}`);
assert(directors.length === 3, 'Confirmed 3 Company Directors count', `Got ${directors.length}`);
assert(contractRelated.length === 2, 'Confirmed 2 Contract-Related personnel count', `Got ${contractRelated.length}`);

// 2. All 8 interns have 1 July - 30 September 2026 inclusive dates
const internLifecycles = INITIAL_INTERNSHIP_LIFECYCLES;
assert(internLifecycles.length === 8, '8 Internship Lifecycle records exist');
const allDatesCorrect = internLifecycles.every(
  l => l.startDate === '2026-07-01' && l.scheduledEndDate === '2026-09-30'
);
assert(allDatesCorrect, 'All eight interns have 1 July–30 September 2026 inclusive dates');

// 3. Interns remain unpaid and excluded from salary payroll
const allInternsUnpaid = interns.every(
  i => i.compensationStatus === 'Unpaid' && i.stipend === 0
);
assert(allInternsUnpaid, 'All interns have compensationStatus: Unpaid and stipend: 0');
const allInternsExcludedFromPayroll = internLifecycles.every(
  l => l.isExcludedFromPayroll === true
);
assert(allInternsExcludedFromPayroll, 'All interns are marked as isExcludedFromPayroll: true during internship');

// 4. Missing scores do not become zero & evaluations start without fabricated results
const allEvaluationsUnfabricated = INITIAL_INTERN_EVALUATIONS.every(
  ev => ev.status === 'Not Started' &&
        ev.calculatedScore === null &&
        ev.criteria.every(c => c.score === null)
);
assert(allEvaluationsUnfabricated, 'Evaluations begin in Not Started state with all scores null (not 0)');

// 5. Preserving single names without invented surnames
const utkarsh = INITIAL_EMPLOYEES.find(e => e.fullName === 'Utkarsh');
assert(utkarsh?.fullName === 'Utkarsh' && utkarsh?.lastName === '', 'Utkarsh is preserved without an invented surname', `Got "${utkarsh?.fullName}"`);

const rohan = INITIAL_EMPLOYEES.find(e => e.fullName === 'Rohan');
assert(rohan?.fullName === 'Rohan' && rohan?.lastName === '', 'Rohan is preserved without an invented surname', `Got "${rohan?.fullName}"`);

// 6. Virender Kumar's responsibility check
const virender = INITIAL_EMPLOYEES.find(e => e.fullName === 'Virender Kumar');
assert(
  Boolean(virender?.responsibility?.includes('US-based contract business')) &&
  virender?.employmentArrangement === 'Not provided',
  'Virender Kumar responsibility recorded without invented US legal entity or contractor classification'
);

// 7. Archit Sharma is contract-based; Rajnesh arrangement stays unspecified
const archit = INITIAL_EMPLOYEES.find(e => e.fullName === 'Archit Sharma');
assert(
  archit?.employmentArrangement === 'Contract' &&
  archit?.organisationalRole === 'Employee (Contract-based)',
  'Archit Sharma confirmed as contract-based employee'
);
const rajnesh = INITIAL_EMPLOYEES.find(e => e.fullName === 'Rajnesh');
assert(
  rajnesh?.employmentArrangement === 'Not provided' &&
  rajnesh?.organisationalRole === 'Employee (Handles contract-related work)',
  'Rajnesh arrangement stays unspecified (not classified as contractor simply because he handles contracts)'
);

// 8. General employees have unspecified terms ('Not provided') and null salaries
const saurav = INITIAL_EMPLOYEES.find(e => e.fullName === 'Saurav Sarkar');
assert(
  saurav?.designation === 'Employee' &&
  saurav?.department === 'Not provided' &&
  saurav?.joiningDate === 'Not provided' &&
  saurav?.baseSalary === null,
  'General employee terms are "Not provided" and salary is unknown (null, not zero)'
);

// 9. IT Leadership Siva Kumar role preservation
const siva = INITIAL_EMPLOYEES.find(e => e.fullName === 'Siva Kumar');
assert(
  siva?.organisationalRole === 'IT Director / Manager' &&
  siva?.engagementCategory === 'IT Leadership',
  'Siva Kumar role label preserved as "IT Director / Manager" and not assumed company director'
);

// 10. HR Team roles confirmed
const niky = INITIAL_EMPLOYEES.find(e => e.fullName === 'Niky Sharma');
const madhavi = INITIAL_EMPLOYEES.find(e => e.fullName === 'Madhavi Singh');
assert(
  niky?.organisationalRole === 'Main HR' && madhavi?.organisationalRole === 'IT HR',
  'HR roles confirmed: Niky Sharma (Main HR) and Madhavi Singh (IT HR)'
);

// 11. Initial Management Decisions in Pending decision state
const allDecisionsPending = INITIAL_MANAGEMENT_DECISIONS.every(
  d => d.decision === 'Pending decision'
);
assert(allDecisionsPending, 'All 8 management decisions start in "Pending decision" state');

// 12. Initial Employment Offers in Draft state with terms uncommitted
const allOffersDraft = INITIAL_EMPLOYMENT_OFFERS.every(
  o => o.offerStatus === 'Draft' && o.acceptanceStatus === 'Pending'
);
assert(allOffersDraft, 'All 8 employment offers start in "Draft" state with "Pending" acceptance');

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
