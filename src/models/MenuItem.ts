import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
  nameEn: string;
  nameAm: string;
  price: number;
  categoryId: mongoose.Types.ObjectId;
  station: "kitchen" | "juicebar";
  imageUrl?: string;
  addOns: mongoose.Types.ObjectId[];
  costPerServing?: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
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
      min: [0, "Price cannot be negative"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    station: {
      type: String,
      enum: ["kitchen", "juicebar"],
      required: [true, "Station is required"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    addOns: [
      {
        type: Schema.Types.ObjectId,
        ref: "AddOn",
      },
    ],
    costPerServing: {
      type: Number,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MenuItemSchema.index({ categoryId: 1 });
MenuItemSchema.index({ inStock: 1 });
MenuItemSchema.index({ station: 1 });

export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
