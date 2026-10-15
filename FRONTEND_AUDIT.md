# Frontend audit and backend integration notes

## Current architecture

- React, TypeScript, Vite, and React Router are used for the two portals.
- Authentication is centralized in `src/services/auth.service.ts`, `src/services/api-client.ts`, and the auth provider. The frontend restores cached sessions, refreshes the signed-in profile, clears sessions after unauthorized responses, and gates routes and portal switching by permissions. Backend authorization remains required for private data.
- The backend currently exposes authentication, leave request, and AI routes. The frontend uses these APIs for those flows. Employee, attendance, payroll, organization, holiday, announcement, and document features do not have corresponding backend routes in this repository; those frontend flows use local feature stores/services where present and should be replaced behind those service boundaries when APIs are added.
- The AI Assistant calls the configured backend AI service. It renders the provider response, reports retryable/configuration failures, derives portal context from the authenticated server role, and does not substitute canned replies when the model is unavailable. HR data context is limited to information the backend can retrieve for that authenticated user; attendance is not invented when unavailable.

## Audit fixes in this pass

- Added sorting and functional pagination to the shared module table view.
- Replaced the generic table's misleading “More actions” control with an explicit delete action.
- Connected the sidebar help card to the admin Help Center or employee Help page.
- Added strict date, duplicate, required text, length, and storage error handling to holiday and announcement forms, with delete confirmation and useful search/filter/empty states.
- Added employee profile field validation, cancel/reset behavior, and save error handling; added save error handling to employee notification settings.
- Updated leave approval and attendance insight actions to use refreshed leave data, surface failures, and require a reason for rejection.
- Corrected authentication tests to assert role/permission based portal access and employee privacy.
- Expanded the backend test command to include all route test files. Removed the AI service's canned fallback and covered authenticated role context and provider errors.

## Verification

- Frontend TypeScript check: passed.
- Frontend lint: passed with existing warnings (date calls during render, state updates in effects, and one unused import); no lint errors.
- Frontend unit tests: 14 files, 40 tests passed.
- Production build: passed; Vite reports a 957 kB main JavaScript chunk that should be code-split in a later performance pass.
- Backend route tests: 16 passed, including auth, leave consistency, and AI behavior. The tests require loopback networking, so they were run with the approved elevated test command.
- `git diff --check`: passed.
- Headless Chrome rendered the login route at 1920, 1440, 1280, 1024, 768, 640, 480, 375, and 320 px with no page-level horizontal overflow. A valid signed-in browser session could not be established from the local dev server, so authenticated admin and employee pages, their tables/modals, and the full responsive matrix remain unverified in a real browser. Auth route and permission behavior is covered by unit tests.

## Remaining work and backend dependencies

- Add backend APIs and server-side authorization for employee records, attendance and corrections, payroll and payslips, departments/designations/shifts, holidays, announcements, documents, notifications, settings, and support requests. The corresponding frontend mock/local stores are not shared across browsers or devices and are not suitable as production records.
- Add server-backed attendance check-in/out and correction workflows, leave balance policy/transactions, payroll processing/payment evidence, and persisted document uploads. The frontend must not represent mock updates as real payments or uploads.
- Add browser based authenticated responsive checks for both portal dashboards and representative forms, tables, dialogs, dropdowns, and chatbot once an authorized test identity/API environment is available.
- Review remaining lint warnings and split the main production chunk.
