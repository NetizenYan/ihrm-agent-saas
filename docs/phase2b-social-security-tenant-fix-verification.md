# Phase 2-B2 Social Security Tenant Fix Verification

## 1. Baseline

- Repository: `/home/linux/projects/ihrm-agent-saas`
- Branch: `phase2b-social-security-tenant-fix`
- Commit: `2dee43f6eabbffae128bcfc41d60b4d9b19fde9a`
- Tag: `phase2b-social-security-tenant-fix`
- Verification time: `2026-06-25 11:54:08 +0900` to `2026-06-25 11:54:09 +0900`
- Scope: Phase 2-B2 dynamic smoke verification and log-evidence completion for the social-security list tenant filter fix.
- Non-goals: business-code changes, database-script changes, Gateway/auth repair, permission annotations, Agent work, Vue3 work, PostgreSQL migration.

## 2. Service Restart

- Service restart performed: Yes.
- Reason: existing backend processes wrote stdout/stderr to deleted files under `/home/linux/projects/ihrm-agent-saas/logs/*.log (deleted)`, so current log evidence could not be collected from normal files.
- Restart scope: backend Phase 1 Java services only, using `./scripts/stop-backend-phase1.sh` and `./scripts/start-backend-phase1.sh`.
- Frontend restart: No. Vue2 frontend on port `8080` was already running and was not stopped.

After restart, the following log files existed:

- `logs/gateway.log`
- `logs/social.log`
- `logs/system.log`

## 3. Service Status

`./scripts/check-phase1-status.sh` completed successfully after the controlled backend restart.

| Component | Port | Status |
| --- | ---: | --- |
| Eureka | 6868 | PASS |
| Company | 9001 | PASS |
| System | 9002 | PASS |
| Employee | 9003 | PASS |
| Social Security | 9004 | PASS |
| Attendance | 9005 | PASS |
| Salary | 9006 | PASS |
| Audit | 9007 | PASS |
| Gateway | 9090 | PASS |
| Vue2 Frontend | 8080 | PASS |

Eureka registration check passed for:

- `IHRM-ATTENDANCE`
- `IHRM-COMPANY`
- `IHRM-GATE`
- `IHRM-EMPLOYEE`
- `IHRM-SYSTEM`
- `IHRM-SALARYS`
- `IHRM-AUDIT`
- `IHRM-SOCIAL-SECURITYS`

## 4. Login Verification

- Login endpoint: `POST http://127.0.0.1:8080/api/sys/login`
- Credential source: local previously verified test account because environment variables were not required for this local smoke run.
- Password handling: password was not printed and is not recorded in this report.
- Token handling: token was parsed successfully and was not printed.
- Result: `TOKEN_OK`

## 5. Gateway / Company / Frontend Proxy Verification

| Check | Endpoint | HTTP | success=true | Busy marker | SQL/parameter marker | Auth-denied marker |
| --- | --- | ---: | --- | --- | --- | --- |
| Gateway test | `GET http://127.0.0.1:9090/test` | 200 | Not applicable | No | No | No |
| Gateway company | `GET http://127.0.0.1:9090/company` | 200 | Yes | No | No | No |
| Frontend proxy company | `GET http://127.0.0.1:8080/api/company` | 200 | Yes | No | No | No |
| Profile | `POST http://127.0.0.1:8080/api/sys/profile` | 200 | Yes | No | No | No |

No response contained `系统繁忙`, `SQLSyntaxErrorException`, `NOAUTH`, `Access denied`, or parameter-binding error markers.

## 6. Social-security List Verification

| Check | Endpoint | Payload | HTTP | success=true | Page/data marker | Busy marker | SQL/parameter marker |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| Basic list | `POST http://127.0.0.1:8080/api/social_securitys/list` | `{"page":1,"pageSize":10}` | 200 | Yes | Yes | No | No |
| Filtered list | `POST http://127.0.0.1:8080/api/social_securitys/list` | `{"page":1,"pageSize":10,"departmentChecks":[],"socialSecurityCityId":"","providentFundCityId":""}` | 200 | Yes | Yes | No | No |

Both B2 smoke requests returned frontend-recognizable data structures. Neither request returned HTTP 500, `系统繁忙`, `SQLSyntaxErrorException`, `company_id` parameter errors, or parameter-binding error markers.

## 7. Log Paths

Log files used for this verification:

- `logs/gateway.log`
- `logs/social.log`
- `logs/system.log`

The previous missing-log condition was explained by running processes holding deleted file handles such as `logs/gateway.log (deleted)`, `logs/social.log (deleted)`, and `logs/system.log (deleted)`.

## 8. Log Check Result

Log check window: current HTTP smoke run from `2026-06-25 11:54:08 +0900` to `2026-06-25 11:54:09 +0900`.

Findings:

- No current-run HTTP response had system-busy, SQL syntax, auth-denied, or parameter-binding symptoms.
- Current-run logs contained expected Hibernate SQL for the B2 list query:
  - `WHERE bu.company_id = ? LIMIT 0,10`
  - `select count(*) ... WHERE bu.company_id = ?`
- The `company_id` log entries were expected tenant-filter SQL evidence, not parameter errors.
- Additional grep hits for `Exception` were startup mapping/framework class names such as `ExceptionHandlerExceptionResolver` or method signatures declaring `throws java.lang.Exception`; they were not runtime errors from the B2 smoke window.
- No current-run severe log error was identified for `ERROR`, `系统繁忙`, `SQLSyntaxErrorException`, `NOAUTH`, `Access denied`, named-parameter binding failures, or missing-parameter failures.

Log check: PASS.

## 9. New Errors

No new B2 smoke-time error was found.

## 10. Conclusion

`Phase 2-B2 dynamic smoke verification: PASS`
