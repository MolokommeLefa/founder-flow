# FounderFlow — Feature Requirements & Continuous Development Guide

> **Purpose of this document:** A living reference for agents, developers, and designers working on FounderFlow. It describes the full application, its current state, architectural conventions, and a prioritised roadmap of work still to be done. Update this document whenever a feature ships or requirements change.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Tooling](#2-tech-stack--tooling)
3. [Getting Started](#3-getting-started)
4. [Architecture & Conventions](#4-architecture--conventions)
5. [Database Schema](#5-database-schema)
6. [Application Pages & Routes](#6-application-pages--routes)
7. [Feature Inventory — Current State](#7-feature-inventory--current-state)
8. [Feature Requirements — Detailed Specifications](#8-feature-requirements--detailed-specifications)
   - [FR-01 Authentication & User Management](#fr-01-authentication--user-management)
   - [FR-02 Dashboard](#fr-02-dashboard)
   - [FR-03 Task Management (Kanban)](#fr-03-task-management-kanban)
   - [FR-04 Calendar](#fr-04-calendar)
   - [FR-05 Projects & Gantt Timeline](#fr-05-projects--gantt-timeline)
   - [FR-06 Analytics](#fr-06-analytics)
   - [FR-07 Focus Timer](#fr-07-focus-timer)
   - [FR-08 Notifications & Inbox](#fr-08-notifications--inbox)
   - [FR-09 Team Collaboration](#fr-09-team-collaboration)
   - [FR-10 Automations](#fr-10-automations)
   - [FR-11 Documents & Media Library](#fr-11-documents--media-library)
   - [FR-12 Settings & Preferences](#fr-12-settings--preferences)
   - [FR-13 Landing Page & Marketing Site](#fr-13-landing-page--marketing-site)
9. [Design System & UI Conventions](#9-design-system--ui-conventions)
10. [Prioritised Roadmap](#10-prioritised-roadmap)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment & Environment](#12-deployment--environment)
13. [Handover Checklist](#13-handover-checklist)

---

## 1. Project Overview

**FounderFlow** is a productivity and project-management SaaS application designed for founders and solo professionals. It brings together task management, time-block scheduling, project tracking, analytics, and a focus timer into a single, clean workspace.

### Vision

Give founders a single place to plan their work, track their time, and understand their productivity — without switching between a dozen tools.

### Core Value Propositions

| Value | How FounderFlow Delivers |
|---|---|
| **Focus** | Focus Timer + "Today's Focus" task list on the dashboard |
| **Clarity** | Kanban board + Gantt timeline give instant project visibility |
| **Insight** | Analytics heatmap + performance charts surface productivity patterns |
| **Flexibility** | Month/week calendar views with time-block scheduling |

---

## 2. Tech Stack & Tooling

| Layer | Choice | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.x |
| Build tool | Vite + SWC | 5.4.19 |
| UI primitives | shadcn/ui (Radix UI) | latest |
| Styling | Tailwind CSS | 3.4.17 |
| Router | React Router | 6.30.1 |
| Server state | TanStack Query (React Query) | 5.83.0 |
| Global state | React Context API | — |
| Database / Auth | Supabase (PostgreSQL) | — |
| Forms | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Date utilities | date-fns | 3.6.0 |
| Drag & drop | @hello-pangea/dnd | 17.0.0 |
| Charts | Recharts | 2.15.4 |
| Toasts | Sonner | 1.7.4 |
| Dark mode | next-themes | 0.3.0 |
| Icons | Lucide React | 0.462.0 |
| Unit tests | Vitest + Testing Library | 3.2.4 / 16.0.0 |
| E2E tests | Playwright | 1.57.0 |
| Linter | ESLint | 9.32.0 |

---

## 3. Getting Started

### Prerequisites

- Node.js ≥ 18 (install via [nvm](https://github.com/nvm-sh/nvm))
- A Supabase project with credentials

### Local Development

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd founder-flow

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Start the dev server (hot-reload on :8080)
npm run dev
```

### Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |

### Running Migrations

```sh
# Apply all pending Supabase migrations
npx supabase db push
```

---

## 4. Architecture & Conventions

### Directory Structure

```
src/
├── assets/               # Static images and media
├── components/
│   ├── ui/               # shadcn/ui primitives (do not modify unless upgrading)
│   ├── dashboard/        # Dashboard-specific components
│   ├── calendar/         # Calendar-specific components
│   └── projects/         # Project-specific components
├── contexts/             # React Context providers (global state)
├── hooks/                # Custom React hooks (data fetching, shared logic)
├── integrations/
│   └── supabase/         # Supabase client, types, auth helpers
├── lib/                  # Generic utilities (cn helper, etc.)
├── pages/                # One file per route — thin orchestrators only
└── test/                 # Vitest unit test files
supabase/
└── migrations/           # SQL migration files (one per schema change)
```

### Key Conventions

1. **Pages are thin.** All business logic lives in hooks or components, not in page files.
2. **Data fetching via custom hooks.** Each domain (tasks, projects) has a dedicated hook in `src/hooks/`. Components never call Supabase directly.
3. **Route protection pattern.** Every protected page checks `supabase.auth.getUser()` on mount and redirects to `/auth` if no session.
4. **shadcn/ui component usage.** Import from `@/components/ui/`. Do not re-implement primitives (Button, Dialog, etc.).
5. **Tailwind-merge is active.** Use `cn()` from `src/lib/utils.ts` when merging class names conditionally.
6. **Dialog overlay safety.** `DialogContent` in shadcn/ui uses `position: fixed`. Do **not** add a `relative` class to `DialogContent` — it overrides `fixed` via Tailwind Merge and breaks the overlay. This has caused bugs before (see `src/components/dashboard/TaskDialog.tsx`).
7. **Database mutations invalidate queries.** After any Supabase mutation (insert/update/delete), call `fetchTasks()` or `fetchProjects()` to refresh the React Query cache.
8. **RLS is the security layer.** Never skip the `user_id` filter in queries — Row Level Security enforces it, but explicit filtering avoids accidental data leaks.
9. **Colour values.** Task and project colours are stored as 6-digit hex codes (`#rrggbb`). The DB enforces `CHECK (color ~ '^#[0-9A-Fa-f]{6}$')`.
10. **TypeScript types.** The canonical types for all Supabase tables live in `src/integrations/supabase/types.ts`. Update this file whenever the schema changes.

---

## 5. Database Schema

### `tasks` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | Unique identifier |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner |
| `title` | TEXT | NOT NULL | Task title |
| `description` | TEXT | nullable | Optional description |
| `status` | TEXT | CHECK in ('not_started','in_progress','completed') | Kanban column |
| `priority` | TEXT | CHECK in ('low','medium','high') | Priority level |
| `due_date` | TIMESTAMPTZ | nullable | Due date/time |
| `color` | VARCHAR(7) | default '#2563eb', CHECK hex format | Display colour |
| `start_time` | TIMESTAMPTZ | nullable | Calendar block start |
| `end_time` | TIMESTAMPTZ | nullable | Calendar block end |
| `project_id` | UUID | FK → projects(id), nullable | Associated project |
| `created_at` | TIMESTAMPTZ | default now() | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | auto-updated | Auto-set on update |

### `projects` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner |
| `parent_id` | UUID | FK → projects(id), nullable | Parent project (for sub-projects) |
| `title` | TEXT | NOT NULL | Project title |
| `description` | TEXT | nullable | Optional description |
| `status` | TEXT | CHECK in ('on_track','at_risk','off_track') | Traffic-light status |
| `start_date` | DATE | NOT NULL | Gantt start |
| `end_date` | DATE | NOT NULL | Gantt end |
| `color` | TEXT | default '#2563eb' | Display colour |
| `progress` | INTEGER | 0–100 | Completion percentage |
| `created_at` | TIMESTAMPTZ | default now() | — |
| `updated_at` | TIMESTAMPTZ | auto-updated | — |

### Row Level Security

All tables have RLS enabled. Policies follow the pattern:

```sql
-- Each operation scoped to the authenticated user
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

### Adding Schema Changes

1. Create a new migration file in `supabase/migrations/` with a timestamp prefix (e.g. `20240317143022_add_notifications_table.sql`).
2. Update `src/integrations/supabase/types.ts` to reflect any new columns.
3. Run `npx supabase db push` to apply locally.

---

## 6. Application Pages & Routes

| Route | Page File | Auth Required | Description |
|---|---|---|---|
| `/` | `pages/Index.tsx` | No | Landing / marketing page |
| `/auth` | `pages/Auth.tsx` | No (redirects if logged in) | Sign in / Sign up |
| `/dashboard` | `pages/Dashboard.tsx` | Yes | Main hub |
| `/tasks` | `pages/Tasks.tsx` | Yes | Kanban board |
| `/calendar` | `pages/Calendar.tsx` | Yes | Month & week calendar |
| `/projects` | `pages/Projects.tsx` | Yes | Gantt timeline |
| `/analytics` | `pages/Analytics.tsx` | Yes | Productivity analytics |
| `*` | `pages/NotFound.tsx` | No | 404 page |

---

## 7. Feature Inventory — Current State

Use this table as the single source of truth for what has been built. Update the **Status** column and **Notes** whenever work is completed.

| ID | Feature | Status | Notes |
|---|---|---|---|
| F-01 | Email / password authentication | ✅ Done | Supabase Auth |
| F-02 | Google OAuth | ✅ Done | Via Lovable Cloud Auth |
| F-03 | Session persistence | ✅ Done | localStorage, auto-refresh |
| F-04 | Dashboard metrics cards | ✅ Done | Mock data; not connected to DB |
| F-05 | Dashboard "Today's Focus" task list | ✅ Done | Shows first 6 tasks |
| F-06 | Overall performance chart | ✅ Done | Mock data |
| F-07 | Kanban board (3-column drag-drop) | ✅ Done | @hello-pangea/dnd |
| F-08 | Task CRUD | ✅ Done | Full create / read / update / delete |
| F-09 | Task priority & due date | ✅ Done | Stored in DB |
| F-10 | Task color coding | ✅ Done | Color picker, stored in DB |
| F-11 | Task search on Kanban | ✅ Done | Live filter by title/description |
| F-12 | Task filter & sort controls | 🔶 Partial | UI shell exists; logic not wired |
| F-13 | Calendar — month view | ✅ Done | Task badges, click-to-create |
| F-14 | Calendar — week view (hourly) | ✅ Done | Time-based positioning, current-time indicator |
| F-15 | Calendar — day view | ❌ Not started | See FR-04 |
| F-16 | Calendar — mini sidebar | ✅ Done | Date navigation |
| F-17 | Calendar task dialog | ✅ Done | Color picker, datetime pickers |
| F-18 | Calendar task drag-to-reschedule | ❌ Not started | See FR-04 |
| F-19 | Calendar task resize | ❌ Not started | See FR-04 |
| F-20 | Recurring tasks | ❌ Not started | See FR-04 |
| F-21 | Calendar export (iCal/Google) | ❌ Not started | See FR-04 |
| F-22 | Projects — Gantt timeline | ✅ Done | Interactive bars |
| F-23 | Projects — sub-projects | ✅ Done | Nested via parent_id |
| F-24 | Projects — task linking in UI | 🔶 Partial | DB relation exists; UI not surfaced |
| F-25 | Analytics — contribution heatmap | 🔶 Partial | UI done; uses mock data |
| F-26 | Analytics — real data connection | ❌ Not started | See FR-06 |
| F-27 | Focus Timer | ✅ Done | Floating widget, localStorage persistence |
| F-28 | Focus Timer — DB persistence | ❌ Not started | Sessions not saved |
| F-29 | Inbox / Notifications | ❌ Not started | Menu item is placeholder |
| F-30 | Team Collaboration | ❌ Not started | Menu item is placeholder |
| F-31 | Automations | ❌ Not started | Menu item is placeholder |
| F-32 | Documents | ❌ Not started | Menu item is placeholder |
| F-33 | Media Library | ❌ Not started | Menu item is placeholder |
| F-34 | User profile / settings page | ❌ Not started | See FR-12 |
| F-35 | Dark mode | ✅ Done | next-themes, toggle in header |
| F-36 | Mobile responsive layout | ✅ Done | Sidebar collapses on mobile |
| F-37 | Keyboard shortcuts | ❌ Not started | See FR-03, FR-04 |
| F-38 | Task categories / tags | ❌ Not started | See FR-03 |

---

## 8. Feature Requirements — Detailed Specifications

Each section below describes the full intended behaviour of one feature area. Sections are structured with **Acceptance Criteria** (testable statements) and **Implementation Notes** (technical guidance for developers).

---

### FR-01 Authentication & User Management

**Goal:** Secure, frictionless sign-in for solo founders. Keep the auth surface minimal — no multi-step onboarding unless needed.

#### Current State
- Email/password sign-up and sign-in via Supabase Auth ✅
- Google OAuth via Lovable Cloud Auth ✅
- Auth state checked on every protected page ✅

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 1.1 | Users can sign up with email and password (minimum 6 characters) | Must Have |
| 1.2 | Users can sign in with Google OAuth | Must Have |
| 1.3 | Invalid credentials show a clear error message below the form | Must Have |
| 1.4 | Session persists across browser refreshes and tab closes | Must Have |
| 1.5 | Signing out clears the session and redirects to `/auth` | Must Have |
| 1.6 | Authenticated users visiting `/auth` are redirected to `/dashboard` | Must Have |
| 1.7 | Unauthenticated users visiting protected routes are redirected to `/auth` | Must Have |
| 1.8 | Users can reset their password via email link | Should Have |
| 1.9 | Users can update their display name and avatar on a profile/settings page | Should Have |
| 1.10 | Users can delete their account and all associated data | Could Have |

#### Acceptance Criteria

- [ ] Signing up with a valid email/password creates a new Supabase `auth.users` row and redirects to `/dashboard`.
- [ ] Signing in with an invalid password shows "Invalid credentials" without exposing whether the email exists.
- [ ] Refreshing the browser while on `/dashboard` keeps the user logged in.
- [ ] Clicking "Sign out" from the sidebar redirects to `/auth` and clears local session.
- [ ] Navigating to `/dashboard` without a session redirects to `/auth`.

#### Implementation Notes

- Auth logic in `src/integrations/supabase/auth.ts` and `src/pages/Auth.tsx`.
- For password reset: call `supabase.auth.resetPasswordForEmail(email)` and show a confirmation message.
- For profile/settings: add a `/settings` route; store `display_name` and `avatar_url` in a `profiles` table linked to `auth.users`.

---

### FR-02 Dashboard

**Goal:** Give users a real-time snapshot of their most important data the moment they log in.

#### Current State
- Metrics cards (Monthly Revenue, Tasks Done %, Hours Saved) display static mock data ⚠️
- "Today's Focus" lists the first 6 tasks from the DB ✅
- Overall Performance chart uses mock data ⚠️

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 2.1 | "Today's Focus" shows tasks with `due_date` equal to today, sorted by priority (high → low) | Must Have |
| 2.2 | Tasks Done % metric shows (completed tasks / total tasks) × 100 for the current week | Must Have |
| 2.3 | Clicking a task in "Today's Focus" opens the task edit dialog | Must Have |
| 2.4 | Marking a task complete from the dashboard updates its status in the DB immediately | Must Have |
| 2.5 | The dashboard greeting shows the user's name if set, otherwise their email prefix | Should Have |
| 2.6 | "Hours Saved" metric derives from focus timer sessions stored in the DB | Could Have |
| 2.7 | Overall Performance chart shows tasks completed per day for the past 7 days | Should Have |
| 2.8 | Metrics and task list refresh automatically when underlying data changes | Should Have |
| 2.9 | Dashboard has a visible shortcut to create a new task | Must Have |

#### Acceptance Criteria

- [ ] When a user has tasks due today, they appear in "Today's Focus" in priority order.
- [ ] Completing a task via the dashboard checkbox updates the Kanban board status to "completed".
- [ ] The Tasks Done % card shows a percentage derived from real DB data, not a static number.
- [ ] The performance chart's x-axis labels match the past 7 days relative to today.

#### Implementation Notes

- Fetch today's tasks: `useTasks()` filtered by `due_date::date = CURRENT_DATE`.
- Aggregate metrics in a `useDashboardMetrics()` hook to avoid bloating the page component.
- For the performance chart, group tasks by `updated_at::date` where `status = 'completed'` for the past 7 days.

---

### FR-03 Task Management (Kanban)

**Goal:** A fast, keyboard-friendly Kanban board where users can capture, organise, and complete tasks.

#### Current State
- Three-column drag-and-drop board (Not Started → In Progress → Completed) ✅
- Task CRUD via `useTasks()` hook ✅
- Live search filter by title/description ✅
- Filter/sort UI shell exists but logic is not implemented 🔶

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 3.1 | Drag a card between columns to update its `status` in the DB | Must Have |
| 3.2 | Click "+ Add Task" to open a creation dialog with title, description, priority, due date, and colour | Must Have |
| 3.3 | Click a task card to open the edit dialog pre-populated with existing values | Must Have |
| 3.4 | Delete a task after confirming a destructive-action dialog | Must Have |
| 3.5 | Search box filters cards in real time across all columns | Must Have |
| 3.6 | Filter tasks by priority (low / medium / high) | Should Have |
| 3.7 | Filter tasks by due-date range (e.g. overdue, due this week) | Should Have |
| 3.8 | Sort tasks within a column by due date ascending or descending | Should Have |
| 3.9 | Tasks can be tagged with one or more custom labels/categories | Could Have |
| 3.10 | Sub-tasks can be added to any task (collapsible list within the card) | Could Have |
| 3.11 | Keyboard shortcut `N` opens the "Add Task" dialog from anywhere in the app | Could Have |
| 3.12 | Keyboard shortcut `/` focuses the search box on the Kanban page | Could Have |
| 3.13 | Overdue tasks are visually highlighted (e.g. red border on due date) | Should Have |

#### Acceptance Criteria

- [ ] Dragging a card to "Completed" column sets `status = 'completed'` in Supabase.
- [ ] Creating a task with title "Buy coffee" and priority "high" shows the card in the "Not Started" column immediately without page reload.
- [ ] Searching "coffee" hides all cards that don't match; removing the search text restores all cards.
- [ ] Filtering by priority "high" shows only high-priority cards across all columns.
- [ ] Tasks past their `due_date` display the due date in red.

#### Implementation Notes

- Filter/sort logic: apply inside `useTasks()` using derived state computed from the raw `tasks[]` array.
- For tags/categories: add a `tags` TEXT[] column to the `tasks` table; render as badge chips.
- For sub-tasks: add a `parent_task_id` UUID column (FK → tasks); use `getSubTasks()` helper similar to `getSubProjects()`.
- Keyboard shortcuts: register global `keydown` listeners in a `useKeyboardShortcuts()` hook mounted in `App.tsx`.

---

### FR-04 Calendar

**Goal:** A scheduling interface where users can visualise tasks as time blocks and plan their day/week without leaving the app.

#### Current State
- Month view ✅
- Week view with hourly timeline and time-based task positioning ✅
- Mini calendar sidebar ✅
- Task creation/editing with colour picker and datetime inputs ✅
- Drag-to-reschedule tasks in week view ❌
- Resize task duration ❌
- Day view ❌
- Recurring tasks ❌
- Calendar export ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 4.1 | Month view shows tasks on their `due_date`; clicking a day opens a task creation dialog | Must Have |
| 4.2 | Week view shows tasks as blocks positioned by `start_time` with height proportional to duration | Must Have |
| 4.3 | A current-time red line in week view updates every minute | Must Have |
| 4.4 | Tasks without `start_time` appear in an "All-day" row at the top of week view | Must Have |
| 4.5 | Clicking an empty time slot in week view pre-fills `start_time` in the creation dialog | Must Have |
| 4.6 | Dragging a task block to a new time slot updates `start_time`, `end_time`, and `due_date` in the DB | Must Have |
| 4.7 | Dragging the bottom edge of a task block resizes its duration (updates `end_time`) | Should Have |
| 4.8 | Day view: single-day 15-minute-increment timeline | Should Have |
| 4.9 | Recurring task support: daily, weekly, monthly repeat patterns | Could Have |
| 4.10 | Export calendar to iCal or Google Calendar | Could Have |
| 4.11 | Multiple calendar layers (personal, work, per-project) toggled by colour-coded checkboxes | Could Have |
| 4.12 | Keyboard shortcut `T` navigates to today in any calendar view | Could Have |

#### Acceptance Criteria

- [ ] In week view, a task with `start_time = 09:00` and `end_time = 10:30` renders a block 1.5 hours tall starting at the 09:00 row.
- [ ] Dragging the same block to 14:00 updates `start_time` to 14:00 and `end_time` to 15:30 in Supabase.
- [ ] The current-time indicator moves to the correct position without manual page refresh.
- [ ] Switching from month to week view preserves the selected week.
- [ ] A task created from the month view appears correctly in week view if it has a `start_time`.

#### Implementation Notes

- Drag-to-reschedule in week view: use `@hello-pangea/dnd` or native pointer events to calculate the new time from the cursor's Y position relative to the hour grid.
- Resize: attach a `pointerdown` listener to a resize handle at the block's bottom edge; update `end_time` on `pointerup`.
- Day view: reuse `WeekView.tsx` logic but render a single day column.
- Recurring tasks: store recurrence rule as a RRULE string (RFC 5545) in a `recurrence` TEXT column; expand occurrences client-side with `rrule` npm package.
- iCal export: use the `ical-generator` npm package; generate a `.ics` file from the user's tasks.

---

### FR-05 Projects & Gantt Timeline

**Goal:** Give founders a bird's-eye view of multi-week projects with sub-project hierarchies on an interactive Gantt chart.

#### Current State
- Root projects and sub-projects rendered in Gantt timeline ✅
- Drag bar to reschedule ✅
- Drag right edge to resize duration ✅
- Project creation dialog ✅
- Task-to-project association in DB (`tasks.project_id`) ✅
- Surfacing associated tasks in the project UI ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 5.1 | Gantt chart shows all root projects with expandable sub-project rows | Must Have |
| 5.2 | Drag a project bar horizontally to reschedule; DB is updated on drop | Must Have |
| 5.3 | Drag right edge of bar to extend/shorten `end_date`; DB is updated on release | Must Have |
| 5.4 | Hovering a project bar shows a tooltip with title, status, dates, and progress | Must Have |
| 5.5 | Project creation form: title, description, status, start date, end date, colour | Must Have |
| 5.6 | Project edit: same fields as creation, accessible by clicking the project row title | Should Have |
| 5.7 | Delete project with sub-project cascade warning | Should Have |
| 5.8 | Project detail panel: lists all tasks linked via `tasks.project_id` | Should Have |
| 5.9 | Task can be associated with a project from the task edit dialog | Should Have |
| 5.10 | Progress bar auto-calculated from (completed linked tasks / total linked tasks) × 100 | Could Have |
| 5.11 | Milestone markers: zero-duration events on the Gantt timeline | Could Have |
| 5.12 | Export Gantt to PDF or PNG | Could Have |

#### Acceptance Criteria

- [ ] Dragging a project bar from Feb 1–14 to Feb 8–21 updates `start_date` and `end_date` in Supabase.
- [ ] Sub-projects appear indented under their parent and scroll/collapse with it.
- [ ] A project with 3 completed tasks out of 5 total shows 60% on the progress bar if auto-progress is enabled.
- [ ] Deleting a parent project shows a warning that sub-projects will also be deleted.

#### Implementation Notes

- Auto-progress: aggregate `tasks` where `project_id = <id>` grouped by status; compute percentage in `useProjects()`.
- Project detail panel: a slide-in `Sheet` component from shadcn/ui showing linked tasks.
- For task-project association in the task dialog: add a `<Select>` dropdown populated from `useProjects()`.

---

### FR-06 Analytics

**Goal:** Help founders understand their productivity patterns over time so they can make better scheduling decisions.

#### Current State
- Contribution heatmap UI renders for the full year ✅
- Heatmap uses generated mock data — not connected to real task or timer data ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 6.1 | Contribution heatmap colour intensity is derived from tasks completed per day (from `tasks` table) | Must Have |
| 6.2 | Hovering a day cell shows a tooltip: date, number of tasks completed, total hours focused | Must Have |
| 6.3 | Summary stats: total tasks completed, total focus hours, current streak, longest streak | Must Have |
| 6.4 | Time-range selector: past 30 days / 90 days / year (heatmap re-renders) | Should Have |
| 6.5 | Weekly bar chart: tasks completed and focus hours per day for the selected week | Should Have |
| 6.6 | Most productive hour-of-day heatmap (24 h × 7 days grid) | Could Have |
| 6.7 | Export analytics data as CSV | Could Have |

#### Acceptance Criteria

- [ ] After completing 5 tasks on a single day, that day's cell is darker than a day with 1 completion.
- [ ] Hovering a cell shows the correct count from the DB (not mock data).
- [ ] A streak counter increments continuously if the user completes at least one task every day.

#### Implementation Notes

- Query: `SELECT updated_at::date as day, count(*) FROM tasks WHERE user_id = auth.uid() AND status = 'completed' GROUP BY day`.
- Focus hours: sum of focus timer sessions once FR-07 persistence is implemented.
- Use Recharts `CartesianGrid` for the bar chart; the heatmap can stay as a custom CSS grid.

---

### FR-07 Focus Timer

**Goal:** A distraction-free countdown/stopwatch that users can run alongside any task to accumulate focused work time.

#### Current State
- Floating fixed-position widget ✅
- Play / Pause / Reset controls ✅
- HH:MM:SS display with localStorage persistence across reloads ✅
- Timer sessions not saved to DB ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 7.1 | Start, pause, and reset the elapsed timer | Must Have |
| 7.2 | Timer persists across page navigations and browser refreshes | Must Have |
| 7.3 | User can associate the running timer with a specific task | Should Have |
| 7.4 | When the timer is stopped, a session record is created in a `focus_sessions` table | Should Have |
| 7.5 | Pomodoro mode: 25-minute work + 5-minute break cycles with audio/visual alerts | Could Have |
| 7.6 | Total focus hours appear in Dashboard and Analytics | Could Have |
| 7.7 | Session history: list of past focus sessions with task, duration, and date | Could Have |

#### Acceptance Criteria

- [ ] Starting the timer, navigating to `/projects`, and returning to `/dashboard` shows the timer still running.
- [ ] Stopping a 30-minute session after linking it to "Task A" creates a `focus_sessions` row for that task.
- [ ] Total hours in Analytics match the sum of all `focus_sessions.duration_seconds` for the user.

#### Implementation Notes

- New `focus_sessions` table:
  ```sql
  id UUID PK, user_id UUID FK, task_id UUID FK nullable,
  started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
  ```
- Emit a session record in `FocusTimerContext` when `stop()` is called and `elapsedSeconds > 0`.
- For Pomodoro: add a `mode` state (`'focus' | 'break'`) and a target duration; use `useEffect` to trigger an alert when elapsed reaches the target.

---

### FR-08 Notifications & Inbox

**Goal:** Surface time-sensitive alerts so users never miss an important deadline or @mention.

#### Current State
- "Inbox" item in sidebar navigation with a badge count of 12 — placeholder only ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 8.1 | Inbox page (`/inbox`) lists all unread notifications in reverse chronological order | Must Have |
| 8.2 | Notification types: task due soon (24 h), task overdue, project status change | Must Have |
| 8.3 | Notifications can be marked as read individually or all at once | Must Have |
| 8.4 | Badge count in sidebar reflects unread notification count from DB | Must Have |
| 8.5 | Browser push notifications for due-soon and overdue tasks (with permission prompt) | Could Have |
| 8.6 | Email digest: daily summary of due tasks sent at a configured time | Could Have |

#### Acceptance Criteria

- [ ] A task whose `due_date` is tomorrow appears as an unread notification in the inbox.
- [ ] Clicking "Mark all as read" sets all notifications to read and clears the badge count.
- [ ] The sidebar badge updates without a page reload when a new notification is generated.

#### Implementation Notes

- New `notifications` table:
  ```sql
  id UUID PK, user_id UUID FK, type TEXT, title TEXT,
  body TEXT, read BOOLEAN DEFAULT false, entity_id UUID,
  entity_type TEXT, created_at TIMESTAMPTZ
  ```
- Generate notifications via a Supabase scheduled function or a client-side check on app load.
- Use Supabase Realtime (`supabase.channel`) to push new notifications to the client without polling.

---

### FR-09 Team Collaboration

**Goal:** Allow multiple users to share a workspace, assign tasks, and comment on work — turning FounderFlow from a solo tool into a lightweight team hub.

#### Current State
- "Team" menu item in sidebar — placeholder only ❌
- All data is strictly single-user via RLS ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 9.1 | Users can create an "Organisation" (workspace) and invite members by email | Should Have |
| 9.2 | Invited users receive an email and can join the workspace | Should Have |
| 9.3 | Tasks and projects can be assigned to any workspace member | Should Have |
| 9.4 | Assigned user sees their tasks on their own dashboard | Should Have |
| 9.5 | @mention a teammate in a task comment; they receive a notification | Could Have |
| 9.6 | Real-time presence: see who else is currently viewing the same Kanban board | Could Have |
| 9.7 | Role-based access control: Owner, Admin, Member permissions | Could Have |

#### Acceptance Criteria

- [ ] Inviting `teammate@example.com` sends an email invite; after accepting, they appear on the Team page.
- [ ] Assigning a task to a teammate moves it to their "Today's Focus" if due today.
- [ ] A non-Owner member cannot delete the organisation.

#### Implementation Notes

- New tables: `organisations`, `organisation_members`, `task_assignees`, `comments`.
- RLS policies will need to include organisation membership checks (not just `user_id`).
- Use Supabase Realtime for live presence indicators.

---

### FR-10 Automations

**Goal:** Let users create no-code if-this-then-that rules to reduce repetitive manual work.

#### Current State
- "Automations" menu item in sidebar — placeholder only ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 10.1 | Rule builder UI: choose a trigger, optional conditions, and one or more actions | Could Have |
| 10.2 | Triggers: task status changes, task created, due date reached, project status changes | Could Have |
| 10.3 | Actions: change task status, assign to user, send notification, create sub-task | Could Have |
| 10.4 | Automations can be enabled/disabled without deleting them | Could Have |
| 10.5 | Automation run history: log of recent executions with success/failure status | Could Have |

#### Acceptance Criteria

- [ ] Rule "When a task moves to Completed → create a sub-task 'Send follow-up email'" fires on status change.
- [ ] Disabling an automation prevents it from running without deleting its configuration.

#### Implementation Notes

- Store automation rules in a `automations` table with a JSONB `rule` column.
- Execute rules server-side via Supabase Edge Functions triggered by DB webhooks.

---

### FR-11 Documents & Media Library

**Goal:** Provide a lightweight document editor and file store so users don't have to leave the app to attach context to their work.

#### Current State
- "Documents" and "Media Library" menu items in sidebar — placeholder only ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 11.1 | Users can create, edit, and delete rich-text documents | Could Have |
| 11.2 | Documents can be attached to tasks or projects | Could Have |
| 11.3 | Media Library: upload and browse images and files linked to the workspace | Could Have |
| 11.4 | Files stored in Supabase Storage with per-user access control | Could Have |
| 11.5 | Document editor supports headings, bullet lists, bold, italic, and hyperlinks | Could Have |

#### Acceptance Criteria

- [ ] Creating a document and attaching it to a project makes it visible in the project detail panel.
- [ ] Uploading an image to Media Library stores it in Supabase Storage; only the uploading user can access it.

#### Implementation Notes

- Use `@tiptap/react` for the rich-text editor (lightweight, headless, Tailwind-friendly).
- Supabase Storage bucket `documents` with RLS policy scoped to `user_id`.

---

### FR-12 Settings & Preferences

**Goal:** Let users personalise their workspace and manage account details without contacting support.

#### Current State
- No `/settings` route exists ❌
- Dark mode toggle is in the header ✅

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 12.1 | Settings page at `/settings` accessible from sidebar or avatar menu | Must Have |
| 12.2 | Profile: update display name, avatar (upload or URL), timezone | Must Have |
| 12.3 | Security: change password, connected OAuth providers | Must Have |
| 12.4 | Appearance: theme (light/dark/system), accent colour | Should Have |
| 12.5 | Notifications: enable/disable notification types, configure email digest time | Should Have |
| 12.6 | Danger zone: delete account with data-wipe confirmation | Should Have |
| 12.7 | Billing / subscription management (for future monetisation) | Could Have |

#### Acceptance Criteria

- [ ] Updating the display name on the Settings page immediately reflects the new name in the dashboard greeting.
- [ ] Changing the theme in Settings persists across logout/login (stored in `profiles` table or localStorage).
- [ ] Clicking "Delete Account" shows a confirmation prompt requiring the user to type their email; on confirm, all data is wiped and the user is signed out.

#### Implementation Notes

- Create a `profiles` table: `user_id UUID FK, display_name TEXT, avatar_url TEXT, timezone TEXT, theme TEXT`.
- Use Supabase Storage for avatar upload; store the public URL in `profiles.avatar_url`.
- For password change: `supabase.auth.updateUser({ password: newPassword })`.

---

### FR-13 Landing Page & Marketing Site

**Goal:** Convert visitors into registered users with a clear value proposition and compelling visuals.

#### Current State
- Full landing page with header, hero, feature showcase, dashboard preview, CTA, and footer ✅
- No analytics or A/B testing ❌
- No pricing section ❌

#### Requirements

| # | Requirement | Priority |
|---|---|---|
| 13.1 | Hero section: headline, sub-headline, primary CTA ("Get started free"), and app screenshot | Must Have |
| 13.2 | Features section: 4–6 feature cards with icon, title, and 1-sentence description | Must Have |
| 13.3 | Social proof: logos or testimonials section | Should Have |
| 13.4 | Pricing section: free tier vs paid tier comparison table | Should Have |
| 13.5 | FAQ section: 5–8 common questions | Could Have |
| 13.6 | Blog/changelog link in footer | Could Have |
| 13.7 | Cookie consent banner (GDPR compliance) | Should Have |
| 13.8 | Page-level meta tags (title, description, Open Graph) for SEO | Should Have |

#### Acceptance Criteria

- [ ] Clicking "Get started free" on the hero CTA navigates to `/auth` with the sign-up form pre-selected.
- [ ] The page scores ≥ 90 on Lighthouse Performance for desktop.
- [ ] All images have `alt` attributes; colour contrast passes WCAG 2.1 AA.

#### Implementation Notes

- Add a `<Helmet>` or Vite-level meta tag strategy for SEO.
- Pricing data can be hardcoded as a constant until Stripe integration is added.

---

## 9. Design System & UI Conventions

### Colour Tokens (CSS Variables)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--primary` | hsl(15 90% 55%) — Orange | Same | Brand, CTAs |
| `--background` | hsl(0 0% 100%) | hsl(222 47% 11%) | Page backgrounds |
| `--foreground` | hsl(222 47% 11%) | hsl(0 0% 98%) | Body text |
| `--muted` | hsl(0 0% 96%) | hsl(217 33% 17%) | Muted surfaces |
| `--destructive` | hsl(0 84% 60%) | Same | Delete actions |
| `--border` | hsl(214 32% 91%) | hsl(217 33% 17%) | Borders |

### Typography

- **Font family:** Inter (Google Fonts), fallbacks: `-apple-system, Segoe UI, Roboto`
- **Scale:** Use Tailwind's default type scale. Headings use `font-semibold` or `font-bold`.
- **Body text:** `text-sm` (14px) is the default inside cards and dialogs; `text-base` for main content.

### Spacing & Radius

- **Border radius:** `--radius: 1rem` (16px). Cards use `rounded-xl`; inputs use `rounded-lg`.
- **Shadows:** Use `--shadow-card` for card elevation; `--shadow-elevated` for dialogs and popovers.
- **Grid gaps:** `gap-4` (16px) between cards; `gap-6` (24px) between page sections.

### Component Patterns

| Pattern | Rule |
|---|---|
| Destructive actions | Always require a confirmation `AlertDialog` before executing |
| Empty states | Show a friendly icon + message + action button (e.g. "No tasks yet — Add one") |
| Loading states | Use `Skeleton` placeholder components; avoid layout shift |
| Error states | Show a `toast` with `variant: "destructive"` and a description of what failed |
| Form validation | Use `react-hook-form` + `zod`; show inline errors below each field |
| Responsive layout | Mobile-first; sidebar hidden on `md:` breakpoint and below |

### Icon Usage

- Use **Lucide React** icons exclusively. Import individually: `import { Plus, Trash2 } from 'lucide-react'`.
- Icon size in buttons: `size={16}` (h-4 w-4). Standalone icons: `size={20}`.

### Dark Mode

- Implemented via `next-themes` with `class` strategy.
- Always test UI changes in both light and dark modes.
- Use semantic tokens (`text-foreground`, `bg-background`) instead of hard-coded colours wherever possible.

---

## 10. Prioritised Roadmap

Items are grouped by milestone. Each milestone represents a coherent, shippable release.

### Milestone 1 — Data Integrity & Polish (Priority: High)

Address gaps in features already partially built:

| Item | Requirement | Effort |
|---|---|---|
| Wire Task filter/sort | FR-03 3.6–3.8 | S |
| Connect Dashboard metrics to real data | FR-02 2.1–2.4, 2.7 | M |
| Connect Analytics heatmap to real tasks | FR-06 6.1–6.3 | M |
| Surface linked tasks in project detail | FR-05 5.8–5.9 | M |
| Overdue task highlighting on Kanban | FR-03 3.13 | S |
| Settings page (profile + password change) | FR-12 12.1–12.3 | M |

### Milestone 2 — Calendar Power Features (Priority: High)

| Item | Requirement | Effort |
|---|---|---|
| Drag-to-reschedule in week view | FR-04 4.6 | L |
| Resize task duration in week view | FR-04 4.7 | M |
| Day view | FR-04 4.8 | M |
| Focus Timer DB persistence | FR-07 7.4 | M |

### Milestone 3 — Inbox & Notifications (Priority: Medium)

| Item | Requirement | Effort |
|---|---|---|
| Notifications table + generation logic | FR-08 8.1–8.2 | M |
| Inbox page | FR-08 8.1, 8.3 | M |
| Sidebar badge from real count | FR-08 8.4 | S |
| Supabase Realtime push | FR-08 8.4 | M |

### Milestone 4 — Project Enhancements (Priority: Medium)

| Item | Requirement | Effort |
|---|---|---|
| Project edit from Gantt row | FR-05 5.6 | S |
| Project delete with cascade warning | FR-05 5.7 | S |
| Auto-progress from tasks | FR-05 5.10 | M |
| Milestone markers | FR-05 5.11 | M |

### Milestone 5 — Analytics Depth (Priority: Medium)

| Item | Requirement | Effort |
|---|---|---|
| Weekly bar chart | FR-06 6.5 | M |
| Time range selector | FR-06 6.4 | S |
| Most productive hour-of-day heatmap | FR-06 6.6 | L |
| CSV export | FR-06 6.7 | S |

### Milestone 6 — Team Collaboration (Priority: Low — future)

Refer to FR-09 requirements. Requires significant schema refactoring (multi-tenancy, updated RLS).

### Milestone 7 — Automations & Documents (Priority: Low — future)

Refer to FR-10 and FR-11 requirements.

**Effort key:** S = Small (< 1 day), M = Medium (1–3 days), L = Large (3–7 days)

---

## 11. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

Location: `src/test/`

Write unit tests for:
- Custom hooks (`useTasks`, `useProjects`, any new hooks)
- Pure utility functions in `src/lib/`
- Complex component logic (e.g. heatmap data transformation, Gantt positioning)

Run with:
```sh
npm run test
```

### E2E Tests (Playwright)

Config: `playwright.config.ts`  
Fixtures: `playwright-fixture.ts`

Write E2E tests for critical user journeys:
1. Sign up → create task → complete task
2. Create project → add sub-project → reschedule via Gantt drag
3. Schedule task via calendar week view → verify block appears at correct position

Run with:
```sh
npx playwright test
```

### Manual QA Checklist (run before any release)

- [ ] Auth: sign up, sign in, sign out, Google OAuth
- [ ] Kanban: create, edit, drag, delete a task in each column
- [ ] Calendar: create task in month view, verify in week view
- [ ] Projects: create project, add sub-project, drag to reschedule
- [ ] Focus Timer: start, navigate away, return — timer still running
- [ ] Dark mode: toggle, verify all pages render correctly
- [ ] Mobile (≤ 768px): sidebar collapses, Kanban scrolls horizontally

---

## 12. Deployment & Environment

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

> ⚠️ Never commit `.env` to the repository. Use `.env.example` for documentation only.

### Build

```sh
npm run build        # Outputs to /dist
npm run preview      # Serve /dist locally
```

The output is a fully static single-page application that can be hosted on Netlify, Vercel, AWS S3/CloudFront, or GitHub Pages.

### Supabase Setup

1. Create a new Supabase project.
2. Copy the project URL and anon key to `.env`.
3. Run all migrations: `npx supabase db push`.
4. Enable Google OAuth in Supabase → Auth → Providers.

---

## 13. Handover Checklist

Use this when transferring the project to a new developer, agent, or designer.

### For Developers

- [ ] `.env` file configured with Supabase credentials
- [ ] `npm install && npm run dev` runs without errors
- [ ] Read sections 4 (Architecture), 5 (Schema), and 8 (Feature Requirements)
- [ ] Understand the custom hook pattern (`useTasks`, `useProjects`)
- [ ] Know the shadcn/ui + Tailwind conventions (section 9)
- [ ] Review the **Feature Inventory** table (section 7) to understand what is and isn't built

### For Designers

- [ ] Review the Design System section (section 9) for colours, typography, spacing
- [ ] All new components must support both light and dark modes
- [ ] Use the existing shadcn/ui component library; don't introduce new component libraries
- [ ] Figma/design files: link here once created
- [ ] Accessibility: target WCAG 2.1 AA minimum for colour contrast and keyboard navigation

### For AI Agents

- [ ] Read this README fully before proposing or making changes
- [ ] Check the Feature Inventory (section 7) to understand current state before implementing
- [ ] Follow the conventions in section 4 strictly — especially the **Dialog overlay safety** note
- [ ] Any schema changes must include a migration file in `supabase/migrations/` and an update to `src/integrations/supabase/types.ts`
- [ ] After completing a feature, update the Feature Inventory table and tick the relevant Milestone items in section 10
- [ ] Run `npm run lint` and `npm run test` before submitting changes
