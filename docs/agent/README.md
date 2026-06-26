# iHRM Agent Architecture — Documentation Index

> **Status: design / proposal only — not an implemented runtime.**

This directory holds the **proposed** Multi-Agent architecture for the iHRM HR SaaS
platform. It is **architecture and design documentation**, not shipped code. No Agent
runtime, Agent database tables, Memory tables, Enterprise Knowledge Base tables,
MCP/Skills tables, or Token-cost tables exist in this repository. Any table schema,
tool, hook, state machine, or Python/TypeScript snippet inside these documents is an
**illustration of the design**, not proof that it has been built.

## What the Agent v1 architecture is

A Case-driven, state-machine-driven Multi-Agent design for HR scenarios
(recruitment, attendance anomalies, payroll settlement, contracts, onboarding, etc.),
layered **on top of** the existing Spring Boot `backend-modern` system. The design
emphasizes tenant isolation, RBAC, data-sensitivity guarding, human-in-the-loop
approval, and full audit.

## Current status

- **Phase:** design / proposal.
- **Authoritative business system:** `backend-modern` (Spring Boot) remains the source
  of truth for all HR data, RBAC, tenant isolation, approvals, payroll, attendance,
  employees, files, and audit.
- **Agent runtime:** not implemented. A Python prototype, and later a Node.js /
  TypeScript production runtime, are **proposed future phases**.

## Current implementation priority

**Stabilize the traditional HR SaaS backend / frontend / database first.**
See [v1/traditional-frontend-backend-stabilization-plan.md](./v1/traditional-frontend-backend-stabilization-plan.md).
Agent design work is intentionally deferred until the traditional APIs, synthetic
demo/test data, permissions, and tenant isolation are stable.

## Deferred items (not in this repository)

The following are **proposed/deferred** and have **not** been implemented and have
**no** database migrations in this repo:

- Multi-Agent runtime (orchestrator, sub-agents, tool execution loop)
- Agent Case tables, Memory tables, Enterprise KB tables
- MCP / Skills / Token-cost runtime
- Minute-level attendance-anomaly schema (current `attendance_record` is day-level only)
- Payroll Agent finite-state machine
- Recruitment and contract modules (unless implemented later)

## Safety note

HR data is highly sensitive. Salary, contracts, identity information, attendance,
resumes, and monitoring/CCTV evidence require **permission checks, offline handling,
and audit design** before any automated processing. High-sensitivity fields (identity
number, bank card, salary amount, social-security base, contract clauses) must never
enter Agent long-term memory and must never be sent to external LLMs.

## Where to go next

- **v1 documents and reading order:** [v1/README.md](./v1/README.md)
- **v1 directory:** [v1/](./v1/)
