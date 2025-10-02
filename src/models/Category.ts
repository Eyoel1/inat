import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  nameEn: string;
  nameAm: string;
  station: "kitchen" | "juicebar";
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    nameEn: {
      type: String,
      required: [true, "English name is required"],
      trim: true,
    },
    nameAm: {
      type: String,
      required: [true, "Amharic name is required"],
      trim: true,
    },
    station: {
      type: String,
      enum: ["kitchen", "juicebar"],
      required: [true, "Station is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
CategorySchema.index({ nameEn: 1 }, { unique: true });
CategorySchema.index({ nameAm: 1 }, { unique: true });
CategorySchema.index({ station: 1 });

export default mongoose.model<ICategory>("Category", CategorySchema);
