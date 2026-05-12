import mongoose from "mongoose"

export interface ITask {
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  projectId: mongoose.Types.ObjectId
  assignedTo?: string
  tags: string[]
  dueDate: Date
  userId?: string
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new mongoose.Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [120, "Task title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    userId: {
      type: String,
      index: true,
    },
  },
  {
    collection: "taskcollection",
    timestamps: true,
  }
)

if (process.env.NODE_ENV !== "production" && mongoose.models.Task) {
  delete mongoose.models.Task
}

const Task =
  (mongoose.models.Task as mongoose.Model<ITask> | undefined) ||
  mongoose.model<ITask>("Task", taskSchema)

export default Task
