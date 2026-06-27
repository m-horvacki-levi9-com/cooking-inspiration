---
name: ubiquitous-language-naming
description: "Use the Ubiquitous Language wiki page to validate and align naming for domain concepts across backend, frontend, tests, and API contracts, preventing language drift."
user-invocable: true
---

# Ubiquitous Language Naming Guardrail

Use this skill whenever you introduce or rename domain-facing names in code, tests, APIs, and documentation.

## Source Of Truth

- Ubiquitous Language wiki page:
  - https://github.com/m-horvacki-levi9-com/cooking-inspiration/wiki/Ubiquitous-language

## Goal

Keep domain language consistent with the wiki so terminology does not drift over time.

## When To Use

- Creating or renaming domain models, DTOs, services, methods, variables, constants, routes, or query parameters
- Adding or changing user-facing copy that contains domain terms
- Writing tests that include domain language in test names or assertions
- Reviewing pull requests for naming consistency

## Naming Process

1. Identify all new or changed domain terms.
2. Check each term against the Ubiquitous Language wiki page.
3. Prefer the exact canonical term from the wiki.
4. If multiple candidates exist, choose one canonical term and apply it consistently.
5. Rename related symbols across layers so one concept has one name.

## Rules

- Use one canonical name per domain concept.
- Avoid synonyms for the same concept across files or layers.
- Keep API, service, UI, and test terminology aligned.
- Do not introduce new domain terms without validating against the wiki.
- If a needed concept is missing from the wiki:
  - use the closest existing canonical term, or
  - call out the gap and propose a wiki update before finalizing names.

## Scope Checklist

Before completing a naming-related change, verify alignment in:

- Backend: `server/domain`, `server/services`, `server/controllers`, `server/infrastructure`
- Frontend: `client/src/services`, `client/src/viewModels`, `client/src/components`, `client/src/pages`
- Tests: `server/tests`, `client/src/tests`, `client/e2e`, `PoC/tests`
- API payload keys and endpoint names

## Drift Signals

Treat these as potential drift and fix before finishing:

- Same concept appears under different names in different layers
- Ambiguous abbreviations for domain entities
- Generic names where a canonical domain term exists
- Test names using different domain wording than production code

## Expected Output In Reviews

When this skill is applied during review, explicitly report:

1. Terms checked against the wiki
2. Drift findings (if any)
3. Renames made or recommended
4. Any wiki gaps that should be updated
