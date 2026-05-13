# TaskFlow AI

TaskFlow AI is a mini SaaS productivity platform built with Next.js, TypeScript, Tailwind CSS, shadcn-style components, NextAuth, and MongoDB.

## Features

- Email/password and Google authentication
- Protected dashboard route
- Project CRUD with status, priority, due date, and paginated project rows
- Task CRUD with project assignment, assignee email, tags, priority, status, due date, filters, and paginated task rows
- Dashboard metrics including total projects, total tasks, completed tasks, pending tasks, overdue tasks, and productivity percentage
- Rule-based AI productivity suggestions
- Analytics charts with Recharts
- Mock team collaboration with add member, comments, avatars, and activity timeline
- Responsive dashboard UI with mobile/tablet card layouts for project and task data

## Tech Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- NextAuth
- MongoDB with Mongoose
- Recharts
- Lucide icons

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` in the project root:

```bash
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_SERVER_HOST=your_smtp_host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_user
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=TaskFlow AI <no-reply@example.com>
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Notes

- Forgot password works with SMTP when email variables are configured.
- Without SMTP credentials, reset links are logged by the server for local development.
- Google login requires valid Google OAuth credentials.
