# Technical Explanation

## Project Overview

TaskFlow AI is a mini SaaS productivity dashboard where users can manage projects and tasks, track productivity, review analytics, collaborate with a mock team workspace, and receive rule-based AI-style suggestions.

## Overall Approach

The application is built as a full-stack Next.js app. Authentication protects the dashboard, MongoDB stores users/projects/tasks, and the UI is organized around SaaS dashboard modules instead of isolated CRUD screens. Charts and dashboard metrics use the full workspace dataset, while project and task tables use server-side pagination for performance.

## Architecture

- `app/` contains Next.js pages and API routes.
- `app/api/auth/*` handles registration, login, forgot password, reset password, and NextAuth.
- `app/api/projects/*` handles project list/create/update/delete.
- `app/api/tasks/*` handles task list/create/update/delete.
- `components/` contains reusable UI, dashboard modules, project forms/lists, and task forms/lists.
- `models/` contains Mongoose schemas.
- `lib/` contains auth, MongoDB connection, serializers, email, password reset, and dashboard helpers.
- `types/` contains shared TypeScript types.

## API Structure

- `POST /api/auth/register` creates users with strong password validation.
- `POST /api/auth/login` validates credentials.
- `POST /api/auth/forgot-password` creates and sends reset links.
- `POST /api/auth/reset-password` updates passwords with strong password validation.
- `GET /api/projects?all=true` returns all projects for charts/dashboard.
- `GET /api/projects?page=1&limit=10` returns paginated project rows.
- `POST /api/projects` creates a project.
- `PATCH /api/projects/[id]` updates a project.
- `DELETE /api/projects/[id]` deletes a project and its tasks.
- `GET /api/tasks?all=true` returns all tasks for charts/dashboard.
- `GET /api/tasks?page=1&limit=10` returns paginated task rows.
- `POST /api/tasks` creates a task.
- `PATCH /api/tasks/[id]` updates a task.
- `DELETE /api/tasks/[id]` deletes a task.

## State Management

Local React state is used for forms, dashboard tab mode, filters, and table pagination. Dashboard-level state separates full analytics data from paginated table rows so charts do not rerender or collapse when users move between table pages.

## Tech Decisions

- Next.js was chosen to combine frontend pages and backend API routes in one deployable app.
- NextAuth was chosen for credentials and Google authentication support.
- MongoDB with Mongoose was chosen for flexible project/task documents.
- Tailwind CSS and reusable UI components were chosen for fast, consistent SaaS-style UI.
- Recharts was chosen for dashboard analytics because it integrates cleanly with React.

## Challenges Faced

- Keeping chart data independent from paginated table data required splitting full dataset fetches from table-row fetches.
- Responsive project/task tables needed a different layout for small screens, so mobile and tablet now use card-style rows while desktop keeps dense tables.
- Signup/reset password validation had to be enforced on both client and server so users cannot bypass rules with direct API requests.

## Future Improvements

- Persist team members and comments in the database.
- Add email verification for new accounts.
- Add role-based team permissions.
- Add automated tests for auth, CRUD, and dashboard metrics.

## AI Usage Disclosure

AI tools were used to help inspect requirements, identify missing modules, generate implementation guidance, and speed up code edits. Final implementation decisions, validation, and local verification were performed in the project workspace.
