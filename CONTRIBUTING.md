# Contributing to Recipe Flow

Thanks for your interest in improving Recipe Flow! This guide explains how to set up the project, propose changes, and keep the codebase consistent.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Branching & Workflow](#branching--workflow)
3. [Coding Guidelines](#coding-guidelines)
4. [UI & UX](#ui--ux)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Pull Request Checklist](#pull-request-checklist)
8. [Community Expectations](#community-expectations)

## Project Setup

1. Fork the repository on GitHub and clone your fork.
   ```bash
   git clone https://github.com/<your-user>/recipe_flow.git
   cd recipe_flow
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Start the dev server and open the app at the provided URL (usually http://localhost:5173).
   ```bash
   npm run dev
   ```

## Branching & Workflow

- Create a descriptive branch for each piece of work, e.g. `feat/nutrition-dropdown` or `fix/validation-step`. Avoid committing to `main` directly.
- Keep commits focused. Each commit should represent a logical, reversible change.
- Rebase against the upstream `main` branch before opening a pull request to ensure a clean history.
- Follow conventional commit messages when possible (e.g., `feat: add timer node`), especially if multiple contributors are collaborating.

## Coding Guidelines

- Use existing code patterns (functional React components with hooks, Tailwind CSS classes) to keep the UI consistent.
- Prefer descriptive naming for variables, especially in graph and nutrition utilities.
- Avoid introducing additional global state; rely on React Flow or component-level hooks unless a context provider is justified.
- Keep components readable—extract helper functions instead of nesting deeply inside JSX.
- When adding dependencies, ensure they are necessary and lightweight. Update `package.json` and `package-lock.json` accordingly.

## UI & UX

- Maintain accessibility: use semantic HTML where applicable and ensure buttons/inputs have visible labels.
- Tailwind CSS is used for styling; stick to utility classes unless a shared component should be introduced.
- Test new UI changes in both light/dark backgrounds (if introduced) and different viewport widths.

## Testing

- For logic changes, extend the smoke tests in `utils/testUtils.js` or add new suites if needed.
- Run `npm run build` to catch compilation issues (particularly for JSX). The UI “Run Tests” button exercises the smoke tests.
- If you add critical features, provide automated tests (consider adopting Vitest or another framework) and update this section accordingly.

## Documentation

- Update existing docs when behavior changes. Core documentation lives under `docs/` (`Overview.md`, `NutritionLookup.md`).
- For new modules, include a short guide similar to the nutrition lookup doc describing setup, APIs, and UI interactions.
- Mention new docs in the README or link them from related sections.

## Pull Request Checklist

Before submitting a PR:

- [ ] Rebased onto the latest `main`
- [ ] `npm run build` succeeds with no warnings/errors
- [ ] Smoke tests (via UI or automated) pass
- [ ] UI reviewed manually for regression
- [ ] Documentation updated (if behavior or API changes)
- [ ] PR description explains the change, tests performed, and screenshots/GIFs for UI updates

## Community Expectations

- Be respectful and collaborative. Offer constructive feedback and welcome suggestions.
- Keep discussions focused on the code/topic at hand.
- Remember that contributors may be testing different features—coordinate to avoid duplicate work.

We appreciate your contributions! If you have questions, open a discussion or issue before starting on a major change to align on scope.
