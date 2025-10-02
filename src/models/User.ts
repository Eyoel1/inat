import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullName: string;
  username: string;
  pin: string;
  role: "waitress" | "kitchen" | "juicebar" | "owner";
  createdAt: Date;
  updatedAt: Date;
  comparePin(candidatePin: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    pin: {
      type: String,
      required: [true, "PIN is required"],
      minlength: 4,
      maxlength: 4,
      select: false, // Don't return PIN by default
    },
    role: {
      type: String,
      enum: ["waitress", "kitchen", "juicebar", "owner"],
      required: [true, "Role is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Hash PIN before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();

  this.pin = await bcrypt.hash(this.pin, 12);
  next();
});

// Method to compare PIN
UserSchema.methods.comparePin = async function (
  candidatePin: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePin, this.pin);
};

export default mongoose.model<IUser>("User", UserSchema);
