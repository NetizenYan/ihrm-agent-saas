# Traditional Frontend/Backend Stabilization Plan

> This plan intentionally stops Agent architecture expansion. It focuses on stabilizing the traditional HR SaaS backend, frontend, and database first.

**Goal:** Make `backend-modern` and `frontend-vue3` reliable enough to run the traditional HR SaaS flows with real backend data, synthetic demo/test data, and verified tenant/permission isolation.

**Scope:**
- In scope: `backend-modern`, `frontend-vue3`, and synthetic demo/test data strategy.
- Out of scope: `backend-legacy`, `frontend-legacy-vue2`, production-like data, destructive commands, and Agent runtime implementation.
- Deferred unless already present: `agent_*`, `memory_*`, `knowledge_*`, `mcp_*`, `skill_*`, token-cost tables, Agent case tables, minute-level attendance anomaly schemas, Payroll Agent FSM, recruitment, and contract modules.
- If database changes are required later, propose them before implementing.

---

## 1. Current Traditional System Inventory

### Existing backend code

`backend-modern` is a Java 21 / Spring Boot 3.5 modular Maven backend. The parent module lists:

| Module | Current responsibility |
|---|---|
| `ihrm-shared` | Shared API result type and security context objects such as `AuthenticatedPrincipal`, `DataScope`, and `TenantContext`. |
| `ihrm-identity` | Login identity, password hashing, user accounts, roles, permissions, profile assembly, and authorization snapshot loading. |
| `ihrm-tenant` | Tenant/company data-scope policy through `TenantAccessPolicy`. |
| `ihrm-organization` | Company, department, city read services and department write service. |
| `ihrm-employee` | Employee entity/repository and read compatibility views. |
| `ihrm-attendance` | Attendance record entity/repository and read service. |
| `ihrm-payroll` | Salary records, salary settings, payroll read service. |
| `ihrm-social-security` | Social-security records/settings/payment items and read service. |
| `ihrm-approval` | Approval cases, task history, process definitions, and read service. |
| `ihrm-reporting` | Attendance and salary reporting read service. |
| `ihrm-worker` | Present module, no stabilization-critical API found in the inspected path. |
| `ihrm-migration` | Flyway migrations and PostgreSQL migration tests. |
| `ihrm-app` | Spring Boot app, compatibility controllers, security filter, Redis session token service, file storage, audit logging, and local demo seeding. |

### Existing tables

Core tables from `V1__tenant_foundation.sql`:

| Domain | Tables |
|---|---|
| Tenant/company/org | `tenant`, `company`, `department` |
| Identity/RBAC | `user_account`, `role`, `permission`, `user_role`, `role_permission` |
| HR | `employee`, `attendance_record` |
| Payroll/social security | `salary_record`, `social_security_record` |
| Approval | `approval_case` |
| Files/audit | `file_object`, `audit_log` |

Compatibility and supporting tables added later:

| Migration | Tables or columns |
|---|---|
| `V2__city_dictionary.sql` | `city_dictionary` |
| `V3__employee_read_compatibility.sql` | Extra employee columns: `mobile`, `form_of_employment`, `working_city`, `correction_time`, `post`, `job_rank` |
| `V4__payroll_read_compatibility.sql` | Extra salary columns, `salary_company_setting`, `salary_setting_item` |
| `V5__social_security_read_compatibility.sql` | Extra social-security columns, `social_security_company_setting`, `social_security_payment_item` |
| `V6__approval_read_compatibility.sql` | Extra approval columns, `approval_task_history`, `approval_process_definition` |

### Existing controllers/services

`ihrm-app` exposes compatibility controllers:

| Controller | Main routes |
|---|---|
| `SystemCompatibilityController` | `/sys/login`, `/sys/profile`, `/sys/user`, `/sys/role`, `/sys/permission`, `/sys/city`, `/sys/phase4/status` |
| `CompanyCompatibilityController` | `/company`, `/company/{id}`, `/company/department`, `/company/department/search`, `/company/department/{id}` |
| `BusinessDomainCompatibilityController` | `/employees`, `/attendances`, `/salarys`, `/social_securitys`, `/user/approvals`, `/user/process/*`, `/approvals/*`, `/reports/*` |
| `SystemFileCompatibilityController` | `/system/upfile`, `/system/upfile/{id}` |
| `FrameCompatibilityController` | `/frame/logout`, `/sys/logout` |
| `InfrastructureCompatibilityController` | `/test`, `/autherror` |

Most traditional read APIs exist. Many write APIs are intentionally closed, missing, or compatibility stubs. Department writes exist but must be stabilized with stronger backend authorization.

### Existing frontend code

`frontend-vue3` is a Vue 3 / Vite / TypeScript / Pinia / Element Plus app.

Existing route groups:

| Route group | Pages |
|---|---|
| Auth/dashboard | `/login`, `/dashboard` |
| Organization/company | `/departments`, `/saas-clients`, `/settings` |
| System | `/sys-users`, `/sys-roles`, `/sys-permissions` |
| HR | `/employees`, `/employees/details/:id`, `/employees/import` |
| Attendance | `/attendances`, `/attendances/archiving`, `/attendances/report` |
| Salary | `/salarys`, `/salarys/list`, `/salarys/details/:yearMonth/:id`, `/salarys/setting` |
| Social security | `/social-securitys`, `/social-securitys/list`, `/social-securitys/detail/:id` |
| Approval | `/approvals`, `/approvals/approval/:id` |
| Agent | `/agent/chat`, currently out of scope for stabilization |

API clients already exist for auth, company/departments, users/roles/permissions, employees, attendance, salary, social security, approvals, and file/city basics.

### Proposed missing pieces

| Area | Missing or unstable piece |
|---|---|
| Demo data | Existing `LocalDemoDataInitializer` seeds only tenant, company, department, one demo admin user, one role, and a few menu permissions. It does not cover HR/finance/manager/employee personas or employee/attendance/salary/social-security/approval data. |
| Backend authorization | Non-public routes are globally `authenticated()`. There is method security enabled, but inspected controllers do not use `@PreAuthorize` or authority checks for sensitive HR/payroll/social-security/approval reads. |
| RLS policies | Migrations enable row-level security but no `CREATE POLICY` or `app.tenant_id` setting was found. This must be verified and either implemented later or documented as application-layer isolation only. |
| Frontend API shape | Several pages use `res?.data?.data`; the axios wrapper already returns `r.data`, so response extraction patterns are inconsistent but currently defensive. |
| Frontend placeholders | Attendance and social-security index pages still use `PagePlaceholder`; dashboard advertises Agent mock mode; some clients still declare old/unimplemented write endpoints. |
| Character encoding | Several frontend route/page strings render as mojibake in files, likely due an encoding conversion issue. Stabilization should verify UI text encoding. |

### Future Agent-only pieces

Do not implement in this stabilization phase:

- Multi-Agent runtime.
- Agent Case tables.
- Memory and context tables.
- Enterprise knowledge-base tables.
- MCP, Skills, and token-cost tables.
- AttendanceAnomalyCase minute-level schema.
- PayrollCase Agent FSM.
- Recruitment and contract modules unless already implemented in traditional modules.

---

## 2. Database Migration Status

### Current Flyway version sequence

| Version | File | Purpose |
|---|---|---|
| V1 | `V1__tenant_foundation.sql` | Core tenant, company, identity, HR, payroll, social security, approval, file, and audit tables; enables RLS on core tables. |
| V2 | `V2__city_dictionary.sql` | City dictionary table and name index. |
| V3 | `V3__employee_read_compatibility.sql` | Employee read compatibility columns and name index. |
| V4 | `V4__payroll_read_compatibility.sql` | Payroll read compatibility columns/settings tables and RLS enablement for new payroll tables. |
| V5 | `V5__social_security_read_compatibility.sql` | Social-security read compatibility columns/settings/payment tables and RLS enablement. |
| V6 | `V6__approval_read_compatibility.sql` | Approval read compatibility columns/history/definition tables and RLS enablement. |

No duplicate version names were observed in `backend-modern/ihrm-migration/src/main/resources/db/migration`.

### Empty database migration

`PostgresFlywayMigrationTest.flywayCreatesTenantFoundationOnPostgres17()` runs Flyway against PostgreSQL through Testcontainers and asserts table names, RLS-enabled table list, indexes, and compatibility columns. This is strong evidence that migrations are intended to run from an empty DB.

### RLS status

Current migrations use `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for:

- Core V1 tables.
- `salary_company_setting`, `salary_setting_item`.
- `social_security_company_setting`, `social_security_payment_item`.
- `approval_task_history`, `approval_process_definition`.

No `CREATE POLICY`, `ALTER TABLE ... FORCE ROW LEVEL SECURITY`, `current_setting('app.tenant_id')`, or application-side `SET app.tenant_id` was found during inspection.

Stabilization decision:

- Treat current isolation as primarily application-layer `TenantAccessPolicy` and repository/service filtering.
- Add a dedicated T0/T4 verification task for whether PostgreSQL RLS is actually effective under the application DB user.
- Do not add policies before a DB-change proposal is reviewed.

### TenantContext and app tenant behavior

`TenantContext` is a `ThreadLocal<AuthenticatedPrincipal>`, but inspected request handling obtains the principal from Spring `Authentication`. No request filter was found that sets `TenantContext` for every request, and no database session variable such as `app.tenant_id` was found in code.

Stabilization decision:

- Verify every service either uses `Authentication` principal directly or consistently uses `TenantContext`.
- If database RLS is required, propose an explicit request/transaction boundary design before implementation.

---

## 3. Demo/Test Data Strategy

### Existing seed mechanism

`LocalDemoDataInitializer` is guarded by:

```yaml
ihrm.local-demo.seed-enabled: false
```

It requires `IHRM_LOCAL_DEMO_PASSWORD` when enabled and seeds deterministic UUIDs with `on conflict` upserts. This is the preferred mechanism for dev/demo seed data because it is profile/property gated and separated from production migrations.

Do not put broad demo data into production Flyway versioned migrations.

### Proposed synthetic persona data

Use synthetic values only.

| Persona | User | Role | Permission emphasis |
|---|---|---|---|
| Admin user | `demo-admin@example.invalid` / mobile `13800000001` | `ROLE_ADMIN` | System menu, role/user/permission read, department read/write. |
| HR manager user | `demo-hr@example.invalid` / mobile `13800000002` | `ROLE_HR_MANAGER` | Employee, attendance, approval read; employee management once write APIs are ready. |
| Finance user | `demo-finance@example.invalid` / mobile `13800000003` | `ROLE_FINANCE` | Salary and social-security read only where explicitly granted. |
| Department manager user | `demo-manager@example.invalid` / mobile `13800000004` | `ROLE_DEPT_MANAGER` | Department employee/attendance read within allowed scope. |
| Employee user | `demo-employee@example.invalid` / mobile `13800000005` | `ROLE_EMPLOYEE` | Own profile/attendance/approval data only; no coworker salary access. |

### Proposed synthetic domain data

| Table | Seed shape |
|---|---|
| `tenant` | Two tenants: `demo-tenant-a`, `demo-tenant-b` for isolation tests. |
| `company` | Tenant A: HQ plus subsidiary; Tenant B: separate company. |
| `department` | HQ HR, Finance, Engineering; subsidiary Operations. |
| `user_account` | One account per persona plus one tenant-B user. |
| `role` | Admin, HR manager, Finance, Department manager, Employee. Include scopes `GROUP`, `SUBSIDIARY`, `COMPANY`, `DEPARTMENT`, `SELF` as supported by backend policy. |
| `permission` | Menu permissions matching frontend route `menuCodes`; point permissions such as `DEPARTMENT_WRITE`, `EMPLOYEE_READ`, `ATTENDANCE_READ`, `SALARY_READ`, `SOCIAL_SECURITY_READ`, `APPROVAL_READ`, `SYSTEM_PERMISSION_READ`. |
| `user_role` | Assign each persona exactly one primary role for simple test assertions. |
| `role_permission` | Grant only the minimal permissions needed per persona. |
| `employee` | Employee rows linked to each user plus cross-company/cross-tenant rows. |
| `attendance_record` | Current and previous month records for each employee. |
| `salary_record` | Current month salary rows; include one high-sensitivity row for denial checks. |
| `social_security_record` | Current contribution month rows with city/base values. |
| `approval_case` | Leave/regularization cases for each persona; include current-node and completed cases. |
| `file_object` | Optional avatar/test document owned by demo users, only if upload/download smoke tests need fixture rows. |
| `audit_log` | Prefer runtime-generated audit rows in tests; static audit seed is optional and should be clearly marked synthetic. |

### Seed delivery recommendation

1. Extend `LocalDemoDataInitializer` only under `ihrm.local-demo.seed-enabled=true`.
2. Keep deterministic UUID constants and idempotent `insert ... on conflict` statements.
3. Require `IHRM_LOCAL_DEMO_PASSWORD` and never hard-code reusable real passwords.
4. Add a separate test fixture builder for integration tests so test assertions do not depend on local demo seed.
5. If a Flyway repeatable or seed migration is considered later, gate it by a non-production profile and propose the DB change first.

---

## 4. Data Coverage Matrix

| Domain | Data needed | Page/API covered | Edge cases covered | Permission cases covered |
|---|---|---|---|---|
| Auth/profile | Five persona users, active/inactive user, invalid password | `/sys/login`, `/sys/profile`, login page, auth store | Bad password, revoked token, missing token | All personas log in; inactive user denied. |
| Organization | HQ, subsidiary, departments, cross-tenant department | `/company`, `/company/department`, `/departments/index` | Empty department list, nested departments, invalid parent | Admin writes; HR/manager read; employee no department write. |
| Users/roles/permissions | User list, role list, menu and point permissions | `/sys/user`, `/sys/role`, `/sys/permission`, system pages | Role with no permissions, user with no active role | Admin can read management data; non-admin denied or hidden. |
| Employees | Employee rows for all personas plus other company/tenant | `/employees`, `/employees/{id}`, employee pages | Resigned employee, missing department, linked/unlinked user | HR reads allowed employee data; manager limited; employee self only. |
| Attendance | Current and archived attendance rows | `/attendances`, `/attendances/reports`, attendance pages | No attendance month, cross-company record, abnormal status | HR/manager allowed scope; employee own data only. |
| Salary | Current salary and salary report rows | `/salarys/list`, `/salarys/{userId}`, salary pages | Missing salary month, detail not found, cross-company row | Finance with `SALARY_READ`; employee cannot read coworker salary. |
| Social security | Current contribution rows/settings/payment items | `/social_securitys/list`, `/social_securitys/{userId}`, social pages | Missing city config, empty payment item list | Finance/HR only as intended; employee self only if product requires. |
| Approval | Approval cases, process definitions, task history | `/user/approvals`, `/user/process/instance/*`, approval pages | Empty process history, completed case, cross-company case | Applicant sees own; manager/current approver sees assigned; unrelated employee denied. |
| Files | Optional avatar/document object | `/system/upfile`, `/system/upfile/{id}` | Bad file type, other owner/company file | Owner/company checks verified. |
| Audit | Generated audit logs | Login/logout/department/file/salary reads | Failed login, failed write, denied read | Admin/auditor access only if audit API is added. |

---

## 5. Backend API Stabilization

| API area | Expected request | Expected response | Required permission | RLS/data-scope behavior | Frontend page |
|---|---|---|---|---|---|
| Auth/login | `POST /sys/login` with `mobile`, `password` | `Result.success(token)` | Public endpoint | Uses `ihrm.security.default-tenant-id`; no tenant selector yet | `views/login/index.vue` |
| Profile | `POST /sys/profile` or `GET /sys/profile` with Bearer token | User/profile data, permission codes, menus/points | Authenticated | Must match token tenant/company | Auth store, router permission generation |
| Department tree | `GET /company/department` | Department list/tree-friendly rows | `DEPARTMENT_READ` | Company/subsidiary/group scope only | `/departments/index` |
| Department write | `POST/PUT/DELETE /company/department` | Department view or delete result | `DEPARTMENT_WRITE` or admin | Same tenant/company; parent must be in readable company | `/departments/index` |
| Employee list/detail | `GET /employees`, `/employees/{id}`, `/employees/{id}/personalInfo`, `/employees/{id}/jobs` | Employee list/detail records | `EMPLOYEE_READ` or self/manager rules | Tenant + company/department/self scope | `/employees` |
| Attendance list/report | `GET /attendances`, `/attendances/{month}`, `/attendances/reports`, archive routes | Attendance rows/report rows | `ATTENDANCE_READ` | Tenant + company/department/self scope | `/attendances`, `/attendances/report` |
| Salary list/detail | `POST /salarys/list`, `GET /salarys/{userId}`, report routes | Salary rows/detail/report | `SALARY_READ` | Finance-only or explicit own-salary rule; deny coworker salary | `/salarys`, `/salarys/list`, salary detail |
| Social security list/detail | `POST /social_securitys/list`, `GET /social_securitys/{userId}` | Contribution rows/detail | `SOCIAL_SECURITY_READ` | Finance/HR explicit scope; deny unrelated employee | `/social-securitys` |
| Approval list/detail | `POST/GET /user/approvals`, process instance routes, flow routes | Approval rows/detail/history | `APPROVAL_READ` plus applicant/current-node rules | Applicant/current approver/company scope | `/approvals` |
| Audit log | Not yet exposed as a stable read API | Proposed paged audit rows | `AUDIT_READ` | Tenant/company scope, admin/auditor only | No current page |

Backend fix plan:

1. Define permission code constants in shared or app security module.
2. Add method-level checks or explicit service guards for every sensitive route.
3. Fix no-role default scope: empty active role scopes should deny data access, not default to company-wide access.
4. Add denial integration tests before changing behavior.
5. Keep compatibility route names stable while tightening authorization.
6. Only propose DB RLS policy changes after verifying current DB-user behavior.

---

## 6. Frontend Integration Stabilization

### Route list and current status

| Route | Current status |
|---|---|
| `/login` | Real API through `/sys/login`; token stored in cookie. |
| `/dashboard` | Mostly informational; contains Agent mock messaging that should be removed or hidden for traditional stabilization. |
| `/departments/index` | Calls real department APIs including write/delete. Needs backend RBAC first. |
| `/saas-clients/index`, `/saas-clients/details/:id` | Calls `/company` and `/company/{id}`. |
| `/settings/index` | Calls role simple API. |
| `/sys-users/index` | Calls user list/detail read APIs; write UI appears intentionally closed. |
| `/sys-roles/index` | Calls role list/detail and permission list; write UI appears intentionally closed. |
| `/sys-permissions/index` | Calls permission list. |
| `/employees/index`, `/employees/details/:id` | Calls employee read/detail APIs. |
| `/employees/import` | Page exists, but import/export endpoints are mostly compatibility/unimplemented. |
| `/attendances/index` | Uses `PagePlaceholder` plus a basic API call; not production-ready. |
| `/attendances/archiving`, `/attendances/report` | Calls report/archive APIs. |
| `/salarys/*` | Calls payroll read/settings APIs. |
| `/social-securitys/index` | Uses `PagePlaceholder` plus API call. |
| `/social-securitys/list`, `/social-securitys/detail/:id` | Calls social-security APIs. |
| `/approvals/*` | Calls approval list/detail/history APIs. |
| `/agent/chat` | Out of scope; should be hidden for this stabilization track. |

### API clients that still call unimplemented or old-compatibility endpoints

Examples to verify and either remove from UI or back with real APIs:

- `frontend-vue3/src/api/base/frame.ts`: register/password routes are declared but no inspected backend support was found.
- `frontend-vue3/src/api/base/dept.ts`: attendance/leave/deduction/overtime config routes use `/cfg/*`; no inspected backend support was found.
- `frontend-vue3/src/api/base/employees.ts`: employee write/import/archive routes are declared but most backend routes are currently compatibility closed.
- `frontend-vue3/src/api/hrm/salarysApi.ts`: salary writes, archive/newReport, user apply routes are declared; many should remain hidden until backend write workflows exist.
- `frontend-vue3/src/api/hrm/socialSecuritys.ts`: write/import/archive routes are declared; read routes are the stabilization target.
- `frontend-vue3/src/api/hrm/approvalsApi.ts`: many process write/start/deploy routes are declared; read routes are the stabilization target.

### Auth token handling

Current flow:

1. `loginApi()` calls `/sys/login`.
2. `useAuthStore.login()` extracts `res?.data?.data ?? res?.data`.
3. Token is stored through `utils/auth`.
4. Axios request interceptor sends `Authorization: Bearer <token>`.
5. Response interceptor expects result code `10000` and handles token-invalid codes.

Stabilization tasks:

- Normalize API response extraction helpers so pages consistently unwrap `ApiEnvelope`.
- Confirm backend `Result.success` code is exactly compatible with frontend `SUCCESS_CODE = '10000'`.
- Add frontend smoke tests for token missing, token expired, and profile load failure.

### Pinia stores

Existing stores:

- `auth`: token, user, roles, menus, permissions.
- `permission`: dynamic route generation based on menus.
- `app`: app shell state.

Stabilization tasks:

- Ensure backend profile returns route `menuCodes` used by frontend: `departments`, `user`, `permissions`, plus HR domain codes.
- Hide or remove `/agent/chat` from generated navigation for this track.
- Verify deny-by-default behavior for users with no menus.

### Mock data and placeholders

- `features/agent-chat/mock.ts` is Agent-only and deferred.
- `views/attendance/index.vue` and `views/social/index.vue` still present placeholder content.
- Dashboard references Agent mock mode.

Fix plan:

1. Hide Agent route/dashboard messaging from traditional stabilization builds.
2. Replace placeholder-first attendance/social pages with real table-first views or make placeholders explicit non-acceptance items.
3. Audit every `createAPI` call against backend routes and mark each as `ready`, `read-only compatibility`, `closed`, or `missing`.
4. Fix mojibake route/meta/UI strings before UX acceptance.

---

## 7. RLS / Tenant Isolation Test Plan

### Required tests

| Test | Setup | Expected result |
|---|---|---|
| Tenant A cannot read tenant B | Seed tenant A and tenant B with same domain data shape. Login as tenant A user. | Tenant B rows never appear; direct tenant-B IDs return 404 or 403. |
| Company `GROUP` scope | Login as group-scope admin. | Can read all companies within same tenant, never other tenant. |
| Company `SUBSIDIARY` scope | Login as HQ manager with explicit subsidiary list. | Can read HQ + configured subsidiary; cannot read unrelated same-tenant company. |
| Company `COMPANY` scope | Login as company-scoped user. | Can read own company only. |
| HR employee access | Login as HR manager. | Can read allowed employee rows; denied outside allowed scope. |
| Finance salary access | Login as finance user with `SALARY_READ`. | Can read salary rows within allowed scope. |
| Employee salary denial | Login as employee user. | Cannot read another employee salary. Own salary behavior should match product decision and be tested explicitly. |
| RLS app tenant variable | Open DB session under app user and set/not set `app.tenant_id` if policies are added later. | Without correct tenant setting, rows are denied. With tenant A, tenant B rows are denied. |

### Current caveat

The code currently enables RLS but no policy was found. Tests must explicitly distinguish:

- Application-layer filtering via `TenantAccessPolicy`.
- Database-enforced RLS via PostgreSQL policies.

Do not claim DB-enforced RLS until policy behavior is proven in a PostgreSQL integration test.

---

## 8. Integration Test Plan

### Backend integration tests

Add or extend tests in `backend-modern/ihrm-app/src/test/java/com/ihrm/modern/app/api`.

| Test group | Coverage |
|---|---|
| Migration from empty DB | Keep `PostgresFlywayMigrationTest`; add checks for policy presence only after policy proposal is accepted. |
| Auth flow | Login success/failure, profile, logout token revocation, missing/expired token. |
| Key read APIs | Department tree, employee list/detail, attendance list/report, salary list/detail, social-security list/detail, approval list/detail. |
| Permission denied APIs | No-role user, employee trying coworker salary, HR without salary permission, finance without employee-management write, non-admin system metadata access. |
| Tenant isolation | Cross-tenant and cross-company direct ID reads; list endpoints exclude rows outside scope. |
| Audit | Login failure/success, logout, department writes, file upload/download, sensitive salary reads. |

### Frontend smoke tests

Use the project-preferred frontend smoke tool when selected later. Minimum flows:

| Flow | Assertions |
|---|---|
| Login | User can submit mobile/password, token is stored, dashboard opens. |
| Dashboard | Traditional dashboard loads without Agent mock being required. |
| Departments | Tree/list loads real backend data; write buttons hidden unless permission allows. |
| Employees | List and detail load real backend data. |
| Attendances | Index/report/archive pages load or show backend-backed empty state. |
| Salarys | Salary list/detail/settings load only for finance/admin persona. |
| Social-securitys | List/detail/settings load only for permitted persona. |
| Approvals | Approval list/detail/history loads for applicant/approver. |
| Sys users/roles/permissions | Admin can read; non-admin is hidden or denied. |

---

## 9. Known Agent-Related Deferrals

Explicitly deferred:

- Multi-Agent runtime.
- Agent Case tables.
- Memory tables.
- Enterprise KB tables.
- MCP/Skills/Token-cost tables.
- AttendanceAnomalyCase minute-level schema.
- PayrollCase Agent FSM.
- Recruitment/Contract modules unless already implemented.
- `frontend-vue3/src/features/agent-chat/*` backend integration.
- New `agent_*`, `memory_*`, `knowledge_*`, `mcp_*`, `skill_*`, or token-cost migrations.

---

## 10. Implementation Phases

### Phase T0: Inventory and migration verification

- Confirm `backend-modern` Maven modules build with Java 21.
- Run Flyway migration test against empty PostgreSQL.
- Produce route/API inventory from controllers and frontend clients.
- Verify whether RLS has policies or only `ENABLE ROW LEVEL SECURITY`.
- Verify whether application requests set `TenantContext` and/or DB tenant variables.

Deliverable: migration/API inventory report with gaps.

### Phase T1: Demo/test seed data

- Propose seed expansion before implementing.
- Add synthetic demo personas to `LocalDemoDataInitializer` behind `ihrm.local-demo.seed-enabled=true`.
- Add integration-test fixture builder independent from local demo seed.
- Include two tenants, multiple companies, and all required personas.

Deliverable: deterministic synthetic test/demo dataset.

### Phase T2: Backend API fixes

- Fix no-role company-wide default.
- Add backend permission guards for department writes, salary reads, social-security reads, approval reads, identity metadata reads, employee/attendance reads.
- Keep compatibility paths stable.
- Add denial tests before fixes.

Deliverable: backend APIs pass auth, data-scope, and permission tests.

### Phase T3: Frontend API alignment

- Normalize API envelope extraction.
- Hide Agent route and dashboard Agent messaging for this track.
- Remove or hide UI actions for unimplemented write endpoints.
- Replace placeholder pages where acceptance requires real backend data.
- Fix mojibake UI strings.

Deliverable: Vue3 core pages load real backend data consistently.

### Phase T4: RLS/permission tests

- Add role/persona matrix tests.
- Add cross-tenant/cross-company direct-ID and list tests.
- If DB RLS policies are proposed and accepted, add PostgreSQL tests proving `app.tenant_id` behavior.

Deliverable: tenant isolation and permission matrix are proven by tests.

### Phase T5: Smoke test and stabilization report

- Run backend integration test suite.
- Run frontend typecheck/build.
- Run frontend smoke tests against seeded backend.
- Write stabilization report listing passing flows, deferred flows, and remaining risks.

Deliverable: traditional SaaS stabilization report.

---

## 11. Acceptance Criteria

- `backend-modern` starts from an empty DB after migrations.
- Demo/test data can be loaded with synthetic users and domain rows.
- `frontend-vue3` can log in against `backend-modern`.
- Core pages load real backend data: dashboard, departments, employees, attendances, salarys, social-securitys, approvals, sys-users, sys-roles, sys-permissions.
- HR, finance, manager, employee, and admin roles behave differently.
- Salary access is protected by backend authorization.
- Cross-tenant access is denied.
- Cross-company access follows `GROUP`, `SUBSIDIARY`, `COMPANY`, `DEPARTMENT`, and `SELF` decisions.
- No Agent runtime implementation is required.
- No legacy Vue2 frontend or JDK8 backend is touched.
- No production-like data is used.
- DB changes, if any, are proposed before implementation.

---

## Key Risks

1. RLS may be enabled but ineffective because no policies or `app.tenant_id` session handling were found.
2. Backend route protection currently relies heavily on authentication plus service-level company filtering; sensitive permission checks need tightening.
3. Empty-role authorization currently defaults to `DataScope.COMPANY`, which can over-grant access.
4. Frontend API clients expose many old or unimplemented write endpoints.
5. Some frontend text appears mojibake and should be corrected before UX acceptance.
6. Existing local demo seed is too small for realistic HR/finance/manager/employee role testing.

---

## Proposed Next Implementation Step

Start Phase T0 with a short verification PR:

1. Add no code behavior changes.
2. Add an API/client inventory artifact or test-only assertions that document which backend routes exist.
3. Run existing backend migration and integration tests.
4. Produce a DB isolation note proving whether RLS is only enabled or fully policy-backed.

After T0, propose the demo/test seed expansion for approval before touching database seed logic.

---

## Final Report

### Files read

- `backend-modern/pom.xml`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V1__tenant_foundation.sql`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V2__city_dictionary.sql`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V3__employee_read_compatibility.sql`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V4__payroll_read_compatibility.sql`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V5__social_security_read_compatibility.sql`
- `backend-modern/ihrm-migration/src/main/resources/db/migration/V6__approval_read_compatibility.sql`
- `backend-modern/ihrm-app/src/main/resources/application.yml`
- `backend-modern/ihrm-app/src/main/java/com/ihrm/modern/app/config/SecurityConfiguration.java`
- `backend-modern/ihrm-app/src/main/java/com/ihrm/modern/app/security/BearerSessionAuthenticationFilter.java`
- `backend-modern/ihrm-app/src/main/java/com/ihrm/modern/app/security/RedisSessionTokenService.java`
- `backend-modern/ihrm-app/src/main/java/com/ihrm/modern/app/demo/LocalDemoDataInitializer.java`
- `backend-modern/ihrm-app/src/main/java/com/ihrm/modern/app/api/*CompatibilityController.java`
- `backend-modern/ihrm-shared/src/main/java/com/ihrm/modern/shared/security/TenantContext.java`
- `backend-modern/ihrm-shared/src/main/java/com/ihrm/modern/shared/security/AuthenticatedPrincipal.java`
- `backend-modern/ihrm-shared/src/main/java/com/ihrm/modern/shared/security/DataScope.java`
- `backend-modern/ihrm-tenant/src/main/java/com/ihrm/modern/tenant/access/TenantAccessPolicy.java`
- `backend-modern/ihrm-identity/src/main/java/com/ihrm/modern/identity/service/IdentityAuthorizationReadService.java`
- `backend-modern/ihrm-identity/src/main/java/com/ihrm/modern/identity/service/IdentityAuthenticationService.java`
- Entity/repository/service file listings under `backend-modern/ihrm-organization`, `ihrm-identity`, `ihrm-employee`, `ihrm-attendance`, `ihrm-payroll`, `ihrm-social-security`, and `ihrm-approval`
- `backend-modern/ihrm-migration/src/test/java/com/ihrm/modern/migration/PostgresFlywayMigrationTest.java`
- `backend-modern/ihrm-app/src/test/java/com/ihrm/modern/app/api/IdentityOrganizationApiIntegrationTest.java`
- `backend-modern/ihrm-tenant/src/test/java/com/ihrm/modern/tenant/access/TenantAccessPolicyTest.java`
- `backend-modern/ihrm-shared/src/test/java/com/ihrm/modern/shared/security/TenantContextTest.java`
- `frontend-vue3/package.json`
- `frontend-vue3/src/router/routes.ts`
- `frontend-vue3/src/api/request.ts`
- `frontend-vue3/src/api/auth.ts`
- `frontend-vue3/src/api/base/*.ts`
- `frontend-vue3/src/api/hrm/*.ts`
- `frontend-vue3/src/stores/auth.ts`
- `frontend-vue3/src/stores/permission.ts`
- `frontend-vue3/src/utils/auth.ts`
- `frontend-vue3/src/utils/permission.ts`
- Route/page listings under `frontend-vue3/src/views`
- Agent mock files under `frontend-vue3/src/features/agent-chat` only to classify them as deferred

### File created

- `docs/agent/v1/traditional-frontend-backend-stabilization-plan.md`

### Key risks

- RLS policy behavior is not yet proven.
- Sensitive backend APIs need explicit permission checks.
- Demo data is insufficient for acceptance.
- Frontend still has placeholders, unimplemented client calls, Agent mock UI, and text encoding issues.

### Proposed next implementation step

Run Phase T0 inventory and migration verification, then propose the synthetic seed-data expansion before implementing any DB-related change.
