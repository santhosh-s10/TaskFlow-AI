import mongoose from "mongoose"

export interface IProject {
  name: string
  description: string
  status: "planning" | "in-progress" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  dueDate: Date
  userId?: string
  createdAt: Date
  updatedAt: Date
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "on-hold"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
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
    collection: "projectscollections",
    timestamps: true,
  }
)

if (process.env.NODE_ENV !== "production" && mongoose.models.Project) {
  delete mongoose.models.Project
}

const Project =
  (mongoose.models.Project as mongoose.Model<IProject> | undefined) ||
  mongoose.model<IProject>("Project", projectSchema)

export default Project
