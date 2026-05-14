import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

interface IUser {
  name: string
  email: string
  password?: string
  image?: string | null
  phone?: string | null
  emailVerified?: Date | null
  accounts?: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>
}

type UserModel = mongoose.Model<IUser, object, UserMethods>
type UserDocument = mongoose.HydratedDocument<IUser, UserMethods>

const userSchema = new mongoose.Schema<IUser, UserModel, UserMethods>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function(this: UserDocument) {
      // Password is required only for non-OAuth users
      return !this.emailVerified && (!this.accounts || this.accounts.length === 0)
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  image: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null,
    maxlength: [30, 'Phone number cannot exceed 30 characters']
  },
  emailVerified: {
    type: Date,
    default: null
  },
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Hash password before saving and update timestamp
userSchema.pre('save', async function(this: UserDocument) {
  this.updatedAt = new Date()

  if (!this.isModified('password') || !this.password) {
    return
  }

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare password method
userSchema.methods.comparePassword = async function(this: UserDocument, candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false
  }

  const isMatch = await bcrypt.compare(candidatePassword, this.password)
  return Boolean(isMatch)
}

// Remove password from JSON output
userSchema.methods.toJSON = function(this: UserDocument) {
  const userObject = this.toObject() as unknown as Record<string, unknown>
  delete userObject.password
  delete userObject.__v
  return userObject
}

if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  delete mongoose.models.User
}

const User =
  (mongoose.models.User as UserModel | undefined) ||
  mongoose.model<IUser, UserModel>('User', userSchema)

export default User
