# Agent Architecture v1 — Document Map

> **These v1 documents are design/proposal artifacts. They are NOT proof that runtime
> code or database tables already exist.** Agent design is deferred until the
> traditional HR SaaS backend/frontend is stable
> (see [traditional-frontend-backend-stabilization-plan.md](./traditional-frontend-backend-stabilization-plan.md)).

For the higher-level overview and safety boundary, start at
[../README.md](../README.md).

## Suggested reading order

| # | Document | Status | One-line description |
|---|----------|--------|----------------------|
| 1 | [multi-agent-architecture.md](./multi-agent-architecture.md) | design | Core Multi-Agent architecture: 10 agents, tools, data guard, audit, human approval, scenarios. Start with its §0 Implementation Boundary. |
| 2 | [architecture-gap-addendum.md](./architecture-gap-addendum.md) | design | Case-driven + state-machine model, runtime boundary (Python prototype → Node/TS), PayrollCase & AttendanceAnomalyCase FSMs, hook lifecycle, deterministic-rule boundary. |
| 3 | [memory-and-context-compression-design.md](./memory-and-context-compression-design.md) | design | Seven-layer memory model, Safe Context Pack, context-compression pipeline, MemoryGuard, multi-agent memory isolation. |
| 4 | [enterprise-knowledge-base-chunking-design.md](./enterprise-knowledge-base-chunking-design.md) | design | KB ingestion, chunking taxonomy, table/screenshot/flowchart handling, metadata schema, RAG citation rules. |
| 5 | `token-cost-offline-tooling-design.md` | proposed (not present) | Token budget, cost quota, offline mode, tool-cost governance. **Not yet in this repository**; referenced as future work. |
| 6 | [agent-production-readiness-gap-analysis.md](./agent-production-readiness-gap-analysis.md) | review | Production-readiness gap matrix, prioritized roadmap (P0–P3), and acceptance map across all design areas. |
| 7 | [traditional-frontend-backend-stabilization-plan.md](./traditional-frontend-backend-stabilization-plan.md) | stabilization | The **current** priority: stabilize `backend-modern` + `frontend-vue3` + synthetic demo/test data before any Agent work. |
| 8 | `architecture-rigor-review.md` | proposed (not present) | Cross-document rigor review. **Not yet in this repository**; referenced as future work. |

## Status legend

- **design** — proposed target architecture; not implemented.
- **review** — analysis/gap mapping over the design documents.
- **stabilization** — the active, near-term plan for the traditional system.
- **proposed (not present)** — referenced as future work; the file does not exist in this repo yet.

## Boundaries (read before implementing anything)

- v1 docs do **not** imply that Agent runtime code, Agent/Memory/KB tables, or MCP/Skills/Token-cost runtime exist.
- `backend-modern` (Spring Boot) remains the authoritative HR business system.
- Agent design is **deferred** until the traditional HR SaaS backend/frontend/database is stable.
- High-sensitivity HR data (identity, bank card, salary, social-security base, contract clauses) must be guarded by Data Guard, offline processing, and audit, and must never enter long-term Agent memory or external LLMs.
