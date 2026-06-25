# Phase 1-B WSL2 Local Startup Verification Final

## 1. Verification Date

- Verification date: 2026-06-25 KST
- Repository path: `/home/linux/projects/ihrm-agent-saas`
- Branch: `phase1-wsl2-startup`
- Git commit at verification time: `6cfd7ff`
- Report file: `docs/phase1-wsl2-startup-verification-final.md`

## 2. Environment Versions

Evidence: command output from WSL under `/home/linux/projects/ihrm-agent-saas`.

| Tool | Version / Path |
| --- | --- |
| Java | `/home/linux/.sdkman/candidates/java/current/bin/java`, OpenJDK `1.8.0_492` Temurin |
| Maven | `/home/linux/.sdkman/candidates/maven/current/bin/mvn`, Apache Maven `3.6.3` |
| Node.js | `/home/linux/.nvm/versions/node/v8.17.0/bin/node`, `v8.17.0` |
| npm | `/home/linux/.nvm/versions/node/v8.17.0/bin/npm`, `6.13.4` |
| Docker | `/usr/bin/docker`, Docker `29.1.3` |

Note: non-interactive WSL shells must load SDKMAN and nvm before running Java/Maven/Node commands. The helper scripts in `scripts/start-backend-phase1.sh` and `scripts/check-phase1-status.sh` account for this where needed.

## 3. Service Port Verification

Evidence command:

```bash
ss -ltnp | grep -E '6868|9001|9002|9003|9004|9005|9006|9007|9090|8080'
```

| Service | Module / Path | Port | Verification Result |
| --- | --- | ---: | --- |
| Eureka | `backend-legacy/ihrm_eureka` | 6868 | LISTEN |
| Company | `backend-legacy/ihrm_company` | 9001 | LISTEN |
| System | `backend-legacy/ihrm_system` | 9002 | LISTEN |
| Employee | `backend-legacy/ihrm_employee` | 9003 | LISTEN |
| Social Security | `backend-legacy/ihrm_social_securitys` | 9004 | LISTEN |
| Attendance | `backend-legacy/ihrm_attendance` | 9005 | LISTEN |
| Salary | `backend-legacy/ihrm_salarys` | 9006 | LISTEN |
| Audit | `backend-legacy/ihrm_audit` | 9007 | LISTEN |
| Gateway | `backend-legacy/ihrm_gate` | 9090 | LISTEN |
| Vue2 frontend | `frontend-legacy-vue2` | 8080 | LISTEN |

## 4. Eureka Registration Status

Evidence command:

```bash
curl -s http://127.0.0.1:6868/eureka/apps | grep -E '<name>|<status>|<port>'
```

The exact requested grep pattern returned service names and `UP` statuses. Because Eureka emits port tags with attributes, an additional equivalent check using `<port` was used to record port numbers.

| Eureka App | Status | Port |
| --- | --- | ---: |
| IHRM-ATTENDANCE | UP | 9005 |
| IHRM-COMPANY | UP | 9001 |
| IHRM-GATE | UP | 9090 |
| IHRM-EMPLOYEE | UP | 9003 |
| IHRM-SYSTEM | UP | 9002 |
| IHRM-SALARYS | UP | 9006 |
| IHRM-AUDIT | UP | 9007 |
| IHRM-SOCIAL-SECURITYS | UP | 9004 |

Gateway dev profile evidence: `logs/gateway.log` contains `The following profiles are active: dev`, Tomcat port `9090`, and `/test` mapping. This log directory is intentionally ignored by `.gitignore`.

System dev profile evidence: `logs/system.log` contains `The following profiles are active: dev`. This log directory is intentionally ignored by `.gitignore`.

## 5. HTTP Route Verification

| Check | Command | Result |
| --- | --- | --- |
| Gateway base | `curl -i http://127.0.0.1:9090/test` | HTTP 200, body points to Eureka URL and Gateway port |
| Gateway Company route | `curl -i http://127.0.0.1:9090/company` | HTTP 200, `success=true` |
| Frontend proxy route | `curl -i http://127.0.0.1:8080/api/company` | HTTP 200, `success=true` |

Evidence paths:

- Gateway controller mapping: `logs/gateway.log`
- Gateway service module: `backend-legacy/ihrm_gate`
- Company service module: `backend-legacy/ihrm_company`
- Frontend proxy config: `frontend-legacy-vue2/config/index.js`

## 6. Frontend Proxy Configuration

Evidence file: `frontend-legacy-vue2/config/index.js`.

The Vue2 devServer proxy is configured for local Phase 1 startup:

- `/api` target: `http://127.0.0.1:9090`
- `pathRewrite`: removes `^/api`
- Scope: local development only, not a production configuration.

## 7. Login Verification

Evidence command shape:

```bash
curl -i -X POST http://127.0.0.1:8080/api/sys/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"<masked>","password":"<masked>"}'
```

Result:

- HTTP status: 200 OK
- Response marker: `success=true`
- Session cookie: returned `JSESSIONID`; value redacted and not recorded
- Browser login: manually verified successful

No plaintext password, token, or session value is stored in this report.

## 8. Phase 1 Fix List

| Fix | Evidence Path |
| --- | --- |
| Added `useSSL=false` to local MySQL JDBC URLs | `backend-legacy/ihrm_company/src/main/resources/application.yml`, `backend-legacy/ihrm_system/src/main/resources/application.yml`, `backend-legacy/ihrm_employee/src/main/resources/application.yml`, `backend-legacy/ihrm_attendance/src/main/resources/application.yml`, `backend-legacy/ihrm_salarys/src/main/resources/application.yml`, `backend-legacy/ihrm_social_securitys/src/main/resources/application.yml`, `backend-legacy/ihrm_audit/src/main/resources/application.yml` |
| Added Gateway dev Redis config for local Redis on port 6380 | `backend-legacy/ihrm_gate/src/main/resources/application-dev.yml` |
| Added System dev Redis config for local Redis on port 6380 | `backend-legacy/ihrm_system/src/main/resources/application-dev.yml` |
| Updated Vue2 dev proxy to local Gateway | `frontend-legacy-vue2/config/index.js` |
| Switched npm registry to a working registry and refreshed lock file | `frontend-legacy-vue2/.npmrc`, `frontend-legacy-vue2/package-lock.json` |
| Added reusable Phase 1 backend start/check/stop scripts | `scripts/start-backend-phase1.sh`, `scripts/check-phase1-status.sh`, `scripts/stop-backend-phase1.sh` |
| Ignored local logs, backup files, env files, node modules, targets, and Docker data | `.gitignore` |
| Filled required Activiti `ACT_GE_PROPERTY` rows in local database | Runtime database action only; no SQL file was modified in this step |

## 9. Log Error Review

Requested command:

```bash
grep -R "ERROR|Exception|Failed|Access denied|NOAUTH|CommunicationsException" -n logs/*.log | tail -n 200
```

Requested command result: no output. The pattern is treated literally by basic `grep`.

Supplemental effective review:

```bash
grep -RE "ERROR|Exception|Failed|Access denied|NOAUTH|CommunicationsException" -n logs/*.log | tail -n 200
```

Findings:

- `logs/company.log`, `logs/attendance.log`, `logs/audit.log`, `logs/salary.log`, and `logs/social.log` contain earlier Redis `NOAUTH Authentication required` errors. Classification: historical failure, fixed by local Redis 6380 / dev config.
- `logs/company.log` contains earlier `NoSuchElementException` entries. Classification: not current blocker; `/company` and `/api/company` now return HTTP 200.
- `logs/system.log` contains earlier JSON parse and unsupported GET method warnings from invalid requests. Classification: not current blocker; login POST now returns HTTP 200 and `success=true`.
- `logs/system.log` contains Maven model warnings about duplicate dependency declarations. Classification: existing project warning, not handled in Phase 1-B because dependency upgrades/refactors are out of scope.

Log files under `logs/` are ignored and are not submitted.

## 10. Remaining Issues Not Handled In This Phase

- Authentication, authorization, and tenant isolation audit is not performed in Phase 1-B. Recommended next stage: Phase 2.
- PostgreSQL migration is not performed in Phase 1-B. Optional planning stage: Phase 1.5.
- Vue3 migration is not performed in Phase 1-B.
- Agent integration is not performed in Phase 1-B.
- Maven duplicate dependency warnings in `backend-legacy/ihrm_system/pom.xml` are not fixed in this phase.
- Sensitive business modules such as salary, social security, attendance, audit, and permissions are only startup-verified here; no business correctness or security review is implied.

## 11. Conclusion

Phase 1-B WSL2 local startup verification: PASS.

All backend services, Eureka registration, Gateway routing, Vue2 devServer proxy, and login path were verified successfully in WSL2 local mode.
