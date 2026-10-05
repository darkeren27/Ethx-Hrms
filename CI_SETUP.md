# ETHX HRMS - Continuous Integration (CI) & RBAC Security Guide

This document details the GitHub Actions Continuous Integration pipeline, local quality verification commands, Role-Based Access Control (RBAC) matrix, and deployment safety guidelines for **ETHX HRMS** (ETHX Softcon Inc.).

---

## 1. CI Pipeline Architecture (`.github/workflows/ci.yml`)

The pipeline runs automatically on all pull requests and pushes to `main` and `master`, and can also be triggered manually via `workflow_dispatch`.

```
                  ┌────────────────────────┐
                  │ 1. Lint & TypeCheck    │  (tsc --noEmit)
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ 2. RBAC & Logic Tests  │  (npm test)
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ 3. Web Production Build│  (vite build)
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ 4. Docker Build Check  │  (docker buildx dry-run)
                  └────────────────────────┘
```

### Pipeline Security Safeguards
- **Least-Privilege Token Permissions**: Configured with `permissions: contents: read` exclusively. The CI bot cannot modify git history, push releases, or alter project settings.
- **Superseded Run Cancellation**: Automatically cancels redundant in-flight runs when new commits are pushed (`cancel-in-progress: true`).
- **Strict Timeouts**: Every job is capped (10–15 minutes) to prevent runaway processes.
- **Dry-Run Container Builds**: Docker images are compiled to validate build context and multi-stage Nginx packaging, but are never pushed to a public or private registry during CI (`push: false`).

---

## 2. Local Verification Commands

Developers and engineers must run these checks before opening pull requests:

```bash
# 1. Strict TypeScript type check
npx tsc --noEmit

# 2. Automated RBAC, access control & business logic test suite (99 tests)
npm test

# 3. Production web asset bundling (Vite)
npm run build

# 4. Dry-run Docker build check (without stopping or replacing active containers)
docker build -t ethx-hrms:local-test .
```

---

## 3. Role-Based Access Control (RBAC) Matrix

### Verified Personnel Directory (21 Confirmed Members)

| Employee ID | Full Name | Official Designation | System Role | Primary Scope & Access Limits |
| :--- | :--- | :--- | :--- | :--- |
| `ETHX-001` | Ram Chaturvedi | Company Director | Director | Executive governance; authorized approver for Niky Sharma leave. |
| `ETHX-002` | Rohan | Company Director | Director | Executive governance records; board oversight. |
| `ETHX-003` | Virender Kumar | Company Director | Director | US contract business oversight; executive records. |
| `ETHX-004` | Siva Kumar | IT Director / Manager | IT Leadership | Engineering supervision; no company-wide leave approval grant. |
| `ETHX-005` | Niky Sharma | Main HR | HR Admin | Organization attendance/leave approvals. Self-approval blocked. |
| `ETHX-006` | Madhavi Singh | IT HR | HR Executive | Recruitment & talent onboarding; no org-wide leave approval grant. |
| `ETHX-007` | Shubham Patane | Employee | Employee | Self-service shift ledger, 18/12/10 leave quota, personal IT asset. |
| `ETHX-008` | Saurav Sarkar | Employee | Employee | Self-service shift ledger, 18/12/10 leave quota, personal IT asset. |
| `ETHX-009` | Vishal Walunj | Employee | Employee | Self-service shift ledger, 18/12/10 leave quota, personal IT asset. |
| `ETHX-010` | Shruti Pawar | Employee | Employee | Self-service shift ledger, 18/12/10 leave quota, personal IT asset. |
| `ETHX-011` | Ganesh Kulkarni | Employee | Employee | Self-service shift ledger, 18/12/10 leave quota, personal IT asset. |
| `ETHX-012` | Archit Sharma | Contract Employee | Contract | Remote contract operations; personal contract shift ledger. |
| `ETHX-013` | Rajnesh | Contract Employee | Contract | Contract operations; personal contract shift ledger. |
| `ETHX-014` | Deepti Tiwari | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-015` | Goraksh Kaduskar | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-016` | Rushikesh Kulkarni | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-017` | Utkarsh | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-018` | Shakti Thakur | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-019` | Sayali Mahant | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-020` | Preeti Bagal | Unpaid Intern | Intern | Personal Q3 attendance (Mon-Wed WFO, Thu-Fri WFH), unpaid leave. |
| `ETHX-021` | Krishna Tiwari | Unpaid Intern | Intern | Personal Q3 attendance, Asus Vivobook telemetry, personal syllabus. |

### Core Security Rules Enforced in Application Layer
1. **Self-Service Restriction**: Authenticated non-admin callers (such as Krishna Tiwari, `emp-021` / `ETHX-021`) can only query and retrieve their own personal records. ID tampering or query parameter manipulation returns strictly empty or 403 Forbidden.
2. **Leave Self-Approval Prohibition**: Main HR operator Niky Sharma (`ETHX-005`) cannot approve her own leave applications. The system automatically routes her requests to `Pending Director Approval` under Ram Chaturvedi (`ETHX-001`).
3. **Mandatory Audit Reasons**: Attendance corrections and leave rejections require non-empty justification strings and record actor identity attribution.
4. **Honest Data Preservation**: Missing historical data is displayed explicitly as `"Not Recorded"` with 0 hours, avoiding fabricated timesheets or synthetic penalties.
5. **Weekend Policy**: Saturday and Sunday are designated `Weekly Off` for all interns with 0 required working hours.

---

## 4. ERPNext Integration vs Mock Isolation

- **Live ERPNext Desk**: `http://45.195.159.86:8280` is integrated via `frappeClient`.
- **CI / Testing Isolation**: CI and test suites run completely offline using in-memory mock adapters and synthetic employee fixtures. Under no circumstances do CI pipelines submit mutations, mark attendance, or create leave entries against the live ERPNext instance.

---

## 5. Recovery & Rollback Procedure

If any pipeline or access-control change needs to be reverted:

```bash
# To view current commits
git log --oneline -n 5

# To revert the latest CI commit cleanly
git revert HEAD

# To return to main branch without uncommitted changes
git checkout main
```
