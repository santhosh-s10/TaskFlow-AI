import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

const ROOT_DIR = resolve(fileURLToPath(new URL("..", import.meta.url)))
const ENV_PATHS = [resolve(ROOT_DIR, ".env.local"), resolve(ROOT_DIR, ".env")]

for (const envPath of ENV_PATHS) {
  if (!existsSync(envPath)) {
    continue
  }

  const content = readFileSync(envPath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) {
      continue
    }

    const value = match[2].replace(/^["']|["']$/g, "")
    process.env[match[1]] = value
  }
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env.local, .env, or the current shell.")
}

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "demo@taskflow.ai"
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "Password123!"
const SEED_NOW = process.env.SEED_NOW ? new Date(process.env.SEED_NOW) : new Date()
const SEED_START = addDays(SEED_NOW, -365)

if (Number.isNaN(SEED_NOW.getTime())) {
  throw new Error("SEED_NOW must be a valid date when provided.")
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    image: { type: String, default: null },
    emailVerified: { type: Date, default: null },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "users" }
)

const projectSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    status: String,
    priority: String,
    dueDate: Date,
    userId: { type: String, index: true },
  },
  { collection: "projectscollections", timestamps: true }
)

const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    status: String,
    priority: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    assignedTo: String,
    tags: [String],
    dueDate: Date,
    userId: { type: String, index: true },
  },
  { collection: "taskcollection", timestamps: true }
)

const User = mongoose.models.User || mongoose.model("User", userSchema)
const Project = mongoose.models.Project || mongoose.model("Project", projectSchema)
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema)

const projectStatuses = ["planning", "in-progress", "completed", "on-hold"]
const taskStatuses = ["todo", "in-progress", "completed"]
const priorities = ["low", "medium", "high"]

const team = [
  ["Aarav Mehta", "aarav@taskflow.ai", "Product Manager"],
  ["Maya Iyer", "maya@taskflow.ai", "UX Designer"],
  ["Lena Brooks", "lena@taskflow.ai", "Frontend Engineer"],
  ["Noah Chen", "noah@taskflow.ai", "Backend Engineer"],
  ["Sofia Patel", "sofia@taskflow.ai", "QA Engineer"],
  ["Owen Rivera", "owen@taskflow.ai", "Data Analyst"],
]

const projectTemplates = [
  ["Customer Portal Refresh", "Improve authenticated customer workflows, accessibility, and account settings."],
  ["Mobile Companion App", "Ship core mobile task views, notifications, and offline-friendly sync."],
  ["AI Prioritization Engine", "Rank work by urgency, effort, dependencies, and team availability."],
  ["Billing Automation", "Automate invoices, payment reminders, usage exports, and revenue dashboards."],
  ["Enterprise SSO Rollout", "Support SAML/OIDC setup, audit trails, and admin-managed provisioning."],
  ["Analytics Workspace", "Create project health reporting, trend charts, and exportable insights."],
  ["Notification Center", "Centralize in-app, email, and digest notifications with user preferences."],
  ["Design System Hardening", "Stabilize reusable UI primitives, states, tokens, and documentation."],
  ["API Partner Program", "Expose secure public APIs, example apps, and partner onboarding flows."],
  ["Data Retention Controls", "Add retention policies, export tools, archive flows, and compliance checks."],
  ["Workflow Templates", "Build reusable project templates for operations, product, and support teams."],
  ["Performance Reliability Sprint", "Reduce page latency, improve query efficiency, and strengthen monitoring."],
]

const taskTemplates = [
  ["Map stakeholder requirements", "Interview users, turn findings into scope, and document success criteria.", ["research", "planning"]],
  ["Create interaction flows", "Design end-to-end flows and resolve edge cases before implementation.", ["design", "ux"]],
  ["Build data model changes", "Add persistence changes, indexes, and validation for the workflow.", ["backend", "database"]],
  ["Implement primary screen", "Create the main interface with responsive states and empty states.", ["frontend", "ui"]],
  ["Connect API endpoints", "Wire the client to server endpoints and handle loading and error states.", ["api", "integration"]],
  ["Add automated coverage", "Cover critical paths with focused unit and integration tests.", ["testing", "quality"]],
  ["Run accessibility pass", "Validate keyboard navigation, labels, focus order, and contrast.", ["accessibility", "quality"]],
  ["Prepare release notes", "Summarize changes, known limitations, and rollout instructions.", ["documentation", "release"]],
  ["Review security risks", "Check auth boundaries, sensitive data handling, and audit expectations.", ["security", "review"]],
  ["Analyze adoption metrics", "Define metrics, wire events, and build launch-readiness reporting.", ["analytics", "metrics"]],
]

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function clampToSeedNow(date) {
  return date > SEED_NOW ? new Date(SEED_NOW) : date
}

function projectDateFor(monthOffset, projectIndex) {
  const start = addMonths(SEED_START, monthOffset)
  start.setDate(Math.min(26, 3 + projectIndex * 8))
  start.setHours(9 + projectIndex, 0, 0, 0)
  return start
}

async function upsertUser({ name, email, password, emailVerified = null }) {
  const now = new Date()
  const existing = await User.findOne({ email })

  if (existing) {
    existing.name = name
    existing.updatedAt = now
    if (emailVerified) {
      existing.emailVerified = emailVerified
    }
    await existing.save()
    return existing
  }

  return User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    image: null,
    emailVerified,
    accounts: [],
    createdAt: now,
    updatedAt: now,
  })
}

function buildProjects(ownerId) {
  const projects = []

  for (let month = 0; month < 12; month += 1) {
    for (let slot = 0; slot < 2; slot += 1) {
      const templateIndex = (month * 2 + slot) % projectTemplates.length
      const [name, description] = projectTemplates[templateIndex]
      const createdAt = projectDateFor(month, slot)
      const status = projectStatuses[(month + slot) % projectStatuses.length]
      const priority = priorities[(month + slot * 2) % priorities.length]
      const dueDate =
        status === "completed"
          ? addDays(createdAt, 24 + slot * 6)
          : status === "on-hold"
            ? addDays(createdAt, 70 + slot * 10)
            : addDays(createdAt, 45 + slot * 14)
      const updatedAt =
        status === "completed"
          ? addDays(dueDate, -2)
          : status === "on-hold"
            ? addDays(createdAt, 18 + slot * 3)
            : addDays(createdAt, 12 + month)

      projects.push({
        name: `${name} ${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`,
        description,
        status,
        priority,
        dueDate,
        userId: ownerId,
        createdAt,
        updatedAt: clampToSeedNow(updatedAt),
      })
    }
  }

  return projects
}

function buildTasks(projects, ownerId) {
  return projects.flatMap((project, projectIndex) => {
    const count = 5 + (projectIndex % 4)

    return Array.from({ length: count }, (_, taskIndex) => {
      const [title, description, baseTags] = taskTemplates[(projectIndex + taskIndex) % taskTemplates.length]
      const createdAt = addDays(project.createdAt, taskIndex * 3)
      const dueDate = addDays(project.createdAt, 7 + taskIndex * 5 + (projectIndex % 3))
      const status =
        project.status === "completed"
          ? taskIndex % 5 === 0
            ? "in-progress"
            : "completed"
          : taskStatuses[(projectIndex + taskIndex) % taskStatuses.length]
      const updatedAt =
        status === "completed"
          ? addDays(dueDate, -1)
          : status === "in-progress"
            ? addDays(createdAt, 4 + (taskIndex % 3))
            : addDays(createdAt, 1)

      return {
        title,
        description,
        status,
        priority: priorities[(projectIndex + taskIndex) % priorities.length],
        projectId: project._id,
        assignedTo: team[(projectIndex + taskIndex) % team.length][1],
        tags: [...baseTags, project.priority, project.status],
        dueDate,
        userId: ownerId,
        createdAt,
        updatedAt: clampToSeedNow(updatedAt),
      }
    })
  })
}

await mongoose.connect(MONGODB_URI, { bufferCommands: false })

try {
  const owner = await upsertUser({
    name: "Taskflow Demo Owner",
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    emailVerified: addDays(SEED_NOW, -365),
  })

  await Promise.all(
    team.map(([name, email]) =>
      upsertUser({
        name,
        email,
        password: OWNER_PASSWORD,
      })
    )
  )

  const ownerId = owner._id.toString()

  await Task.deleteMany({ userId: ownerId })
  await Project.deleteMany({ userId: ownerId })

  const projects = await Project.insertMany(buildProjects(ownerId))
  const tasks = await Task.insertMany(buildTasks(projects, ownerId))

  const byProjectStatus = projectStatuses
    .map((status) => `${status}: ${projects.filter((project) => project.status === status).length}`)
    .join(", ")
  const byTaskStatus = taskStatuses
    .map((status) => `${status}: ${tasks.filter((task) => task.status === status).length}`)
    .join(", ")

  console.log("Seed complete.")
  console.log(`Owner: ${OWNER_EMAIL}`)
  console.log(`Password: ${OWNER_PASSWORD}`)
  console.log(`Projects: ${projects.length} (${byProjectStatus})`)
  console.log(`Tasks: ${tasks.length} (${byTaskStatus})`)
  console.log(`Range: ${SEED_START.toISOString().slice(0, 10)} to ${SEED_NOW.toISOString().slice(0, 10)}`)
} finally {
  await mongoose.disconnect()
}
