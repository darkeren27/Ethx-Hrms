import { hrmsService } from '../services/hrmsService';
import { frappeClient } from '../services/frappeClient';

declare const process: any;

console.log('================================================================');
console.log('ETHX HRMS INTEGRATION TEST: EVALUATION-TO-EMPLOYMENT WORKFLOW');
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

async function runWorkflowTests() {
  // Test 1: Fetch initial interns
  const emps = await hrmsService.getEmployees();
  assert(emps.length === 21, 'Initial personnel count is exactly 21');

  const utkarsh = emps.find(e => e.fullName === 'Utkarsh');
  assert(Boolean(utkarsh), 'Utkarsh found in employee master');
  assert(utkarsh?.compensationStatus === 'Unpaid' && utkarsh?.stipend === 0, 'Utkarsh is unpaid with 0 stipend initially');

  // Test 2: Fetch evaluation for Utkarsh
  const evals = await hrmsService.getInternEvaluations();
  const utkarshEval = evals.find(e => e.internId === utkarsh?.id);
  assert(Boolean(utkarshEval), 'Evaluation record exists for Utkarsh');
  assert(utkarshEval?.status === 'Not Started' && utkarshEval?.calculatedScore === null, 'Evaluation begins in Not Started with null score');

  // Test 3: Score criteria transparently without counting missing as zero
  const updatedCriteria = utkarshEval!.criteria.map((c, i) => ({
    ...c,
    score: i < 5 ? 5 : null, // 5 out of 7 scored with 5 (100%), 2 missing
  }));
  const updatedEval = await hrmsService.updateInternEvaluation(utkarshEval!.id, {
    criteria: updatedCriteria,
    assignedReviewer: 'Siva Kumar',
    assignedApprover: 'Ram Chaturvedi',
    status: 'In Progress',
  });
  assert(updatedEval.status === 'In Progress', 'Evaluation status updated to In Progress');
  assert(updatedEval.criteria[0].score === 5 && updatedEval.criteria[6].score === null, 'Missing criteria stay null and are not forced to 0');

  // Test 4: Submit Evaluation & Return for Revision
  const submittedEval = await hrmsService.submitEvaluation(utkarshEval!.id);
  assert(submittedEval.status === 'Submitted', 'Evaluation submitted for review');

  const returnedEval = await hrmsService.returnEvaluationForRevision(
    utkarshEval!.id,
    'Ram Chaturvedi',
    'Please add specific task PR references for criteria 3 and 4.',
    'Reviewer returned for revision'
  );
  assert(returnedEval.status === 'In Progress', 'Evaluation returned to In Progress for revision');
  assert(returnedEval.revisionHistory?.length === 1, 'Revision history logged returnedBy, reason and timestamp');
  assert(returnedEval.revisionHistory?.[0].returnedBy === 'Ram Chaturvedi', 'Returned by audit actor verified');

  // Test 5: Re-complete criteria & approve
  const fullCriteria = utkarshEval!.criteria.map(c => ({ ...c, score: 5 }));
  await hrmsService.updateInternEvaluation(utkarshEval!.id, {
    criteria: fullCriteria,
    status: 'Reviewed',
    approvalDate: '2026-09-24',
    overallRecommendation: 'Recommended for permanent employment',
  });

  // Test 6: Management Decision Desk
  const decision = await hrmsService.recordManagementDecision(
    utkarsh!.id,
    'Approved for offer preparation',
    'Demonstrated exceptional backend architecture aptitude and team reliability.',
    'Ram Chaturvedi'
  );
  assert(decision.decision === 'Approved for offer preparation', 'Management decision recorded: Approved for offer preparation');
  assert(decision.decidedBy === 'Ram Chaturvedi', 'Authorizing executive recorded correctly');

  // Test 7: Prepare Employment Offer Terms
  const offers = await hrmsService.getEmploymentOffers();
  const utkarshOffer = offers.find(o => o.internId === utkarsh!.id);
  assert(Boolean(utkarshOffer), 'Employment offer record found for Utkarsh');

  const preparedOffer = await hrmsService.updateEmploymentOffer(utkarshOffer!.id, {
    terms: {
      ...utkarshOffer!.terms,
      designation: 'Junior Software Engineer',
      department: 'Engineering',
      reportingManager: 'Siva Kumar',
      employmentArrangement: 'Full-time',
      proposedJoiningDate: '2026-10-01',
      actualJoiningDate: '2026-10-01',
      approvedSalary: 550000,
      workLocation: 'Pune Global HQ',
      probationTerms: '3 Months',
    },
    offerStatus: 'Issued',
    issuedDate: '2026-09-25',
  });
  assert(preparedOffer.offerStatus === 'Issued', 'Offer status advanced to Issued');
  assert(preparedOffer.terms.approvedSalary === 550000, 'Approved salary recorded (550,000 INR)');

  // Test 8: Candidate Acceptance
  const acceptedOffer = await hrmsService.recordOfferResponse(
    utkarshOffer!.id,
    'Accepted',
    '2026-10-01',
    'Candidate Utkarsh'
  );
  assert(acceptedOffer.acceptanceStatus === 'Accepted', 'Candidate acceptance recorded');
  assert(acceptedOffer.conversionStatus === 'Offer Accepted — Joining Pending', 'Conversion status is Offer Accepted — Joining Pending');

  // Test 9: Active Conversion preserves person identity and enables payroll
  const conversionResult = await hrmsService.activatePermanentEmployment(
    utkarshOffer!.id,
    'Authorized HR - Niky Sharma'
  );
  assert(conversionResult.offer.conversionStatus === 'Permanent Employment Active', 'Offer marked Permanent Employment Active');
  assert(conversionResult.employee.id === utkarsh!.id, 'Converted employee retains EXACT original person ID (no duplicate created!)');
  assert(conversionResult.employee.fullName === 'Utkarsh', 'Utkarsh name preserved without surname');
  assert(conversionResult.employee.designation === 'Junior Software Engineer', 'Designation updated to Junior Software Engineer');
  assert(conversionResult.employee.compensationStatus === 'Paid', 'Compensation status updated to Paid');
  assert(conversionResult.employee.baseSalary === 550000, 'Base salary activated at 550,000 INR');
  assert(conversionResult.employee.conversionDetails?.conversionStatus === 'Permanent Employment Active', 'Employee conversion details set to Permanent Employment Active');

  // Test 10: Headcount reconciliation after conversion
  const finalEmps = await hrmsService.getEmployees();
  assert(finalEmps.length === 21, 'Total directory headcount remains exactly 21 (Zero duplicate person records!)');

  console.log('\n================================================================');
  console.log(`WORKFLOW TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) process.exit(1);
  else process.exit(0);
}

runWorkflowTests().catch(err => {
  console.error('Workflow test error:', err);
  process.exit(1);
});
