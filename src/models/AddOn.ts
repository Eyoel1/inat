import mongoose, { Schema, Document } from "mongoose";

export interface IAddOn extends Document {
  nameEn: string;
  nameAm: string;
  price: number;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnSchema = new Schema<IAddOn>(
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
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
      default: 0,
    },
    cost: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAddOn>("AddOn", AddOnSchema);
