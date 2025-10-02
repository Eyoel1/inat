import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  language: "am" | "en";
  taxRate: number;
  currency: {
    en: string;
    am: string;
  };
  nextOrderNumber: number;
  lastBackup?: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    language: {
      type: String,
      enum: ["am", "en"],
      default: "am",
    },
    taxRate: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1,
    },
    currency: {
      en: {
        type: String,
        default: "$",
      },
      am: {
        type: String,
        default: "ብር",
      },
    },
    nextOrderNumber: {
      type: Number,
      default: 1,
    },
    lastBackup: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISettings>("Settings", SettingsSchema);
