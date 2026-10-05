import { hrmsService } from '../services/hrmsService';
import { frappeClient } from '../services/frappeClient';
import { INITIAL_INTERN_EVALUATIONS } from '../lib/mockData';

console.log('========================================================================');
console.log('ETHX HRMS TEST: INTERNSHIP EVALUATION SUBMISSION & MODAL WORKFLOW');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`  ✔ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✖ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  // 1. Fetch evaluations
  const evals = await hrmsService.getInternEvaluations();
  assert(evals.length === 8, '8 intern evaluations retrieved');

  // Find Deepti Tiwari (emp-014 / ETHX-014 from user screenshot)
  const deeptiEval = evals.find(e => e.internName === 'Deepti Tiwari' || e.internId === 'emp-014');
  assert(Boolean(deeptiEval), 'Deepti Tiwari evaluation record found');
  assert(deeptiEval?.status === 'Not Started', 'Initial status is Not Started');

  // 2. Simulate Save as Draft ('In Progress')
  const draftScores = (deeptiEval!.criteria || []).map((c, idx) => ({
    ...c,
    score: idx < 4 ? 4 : null, // Partial scoring
  }));
  const draftRes = await hrmsService.updateInternEvaluation(deeptiEval!.id, {
    assignedReviewer: 'Siva Kumar',
    assignedApprover: 'Ram Chaturvedi',
    criteria: draftScores,
    strengths: 'Good foundational backend knowledge',
    improvementAreas: 'Deepen system design experience',
    overallRecommendation: 'Undecided' as any,
    decisionRemarks: 'Mid-term check-in completed',
    status: 'In Progress',
    workflowStatus: 'In Progress',
    isDraftPrivate: true,
  });

  assert(draftRes.status === 'In Progress', 'Status saved as In Progress (Draft)');
  assert(draftRes.workflowStatus === 'In Progress', 'workflowStatus synchronized to In Progress');
  assert(draftRes.assignedReviewer === 'Siva Kumar', 'Reviewer assigned explicitly');
  assert(draftRes.assignedApprover === 'Ram Chaturvedi', 'Approver assigned explicitly');

  // 3. Simulate Submit for Review ('Submitted')
  const fullScores = (deeptiEval!.criteria || []).map((c) => ({
    ...c,
    score: 5,
  }));
  const submitRes = await hrmsService.updateInternEvaluation(deeptiEval!.id, {
    criteria: fullScores,
    calculatedScore: 100,
    status: 'Submitted',
    workflowStatus: 'Submitted',
    submissionDate: '2026-09-20',
    isDraftPrivate: false,
  });

  assert(submitRes.status === 'Submitted', 'Status saved as Submitted');
  assert(submitRes.workflowStatus === 'Submitted', 'workflowStatus synchronized to Submitted');
  assert(submitRes.calculatedScore === 100, 'Calculated score recorded as 100%');
  assert(Boolean(submitRes.submissionDate), 'Submission date recorded');

  // 4. Simulate Mark as Reviewed ('Reviewed')
  const reviewRes = await hrmsService.updateInternEvaluation(deeptiEval!.id, {
    status: 'Reviewed',
    workflowStatus: 'Reviewed',
    approvalDate: '2026-09-22',
    overallRecommendation: 'Recommended for permanent employment' as any,
    decisionRemarks: 'Outstanding internship performance validated by review panel.',
  });

  assert(reviewRes.status === 'Reviewed', 'Status updated to Reviewed');
  assert(reviewRes.workflowStatus === 'Reviewed', 'workflowStatus synchronized to Reviewed');
  assert(reviewRes.approvalDate === '2026-09-22', 'Approval date recorded');
  assert(reviewRes.overallRecommendation === 'Recommended for permanent employment', 'Overall recommendation saved');

  // 5. Verify persistence in frappeClient
  const reloaded = await hrmsService.getInternEvaluationById(deeptiEval!.id);
  assert(reloaded?.status === 'Reviewed', 'Reloaded doc maintains Reviewed status');
  assert(reloaded?.workflowStatus === 'Reviewed', 'Reloaded doc maintains workflowStatus Reviewed');
  assert(reloaded?.calculatedScore === 100, 'Reloaded score is 100%');

  console.log('\n========================================================================');
  console.log(`TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
