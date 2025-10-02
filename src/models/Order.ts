import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  nameEn: string;
  nameAm: string;
  quantity: number;
  price: number;
  addOns: {
    addOnId: Types.ObjectId;
    nameEn: string;
    nameAm: string;
    price: number;
  }[];
  specialNotes?: string;
  station: "kitchen" | "juicebar";
}

export interface IOrder extends Document {
  orderNumber: string;
  items: IOrderItem[];
  kitchenStatus?: "pending" | "inprogress" | "ready";
  juicebarStatus?: "pending" | "inprogress" | "ready";
  overallStatus: "pending" | "inprogress" | "ready" | "completed";
  total: number; // Remove subtotal and tax, only total
  paymentMethod?: "cash" | "card" | "mobile";
  paymentDetails?: {
    amountReceived?: number;
    change?: number;
    mobileProvider?: string;
  };
  waitressId: Types.ObjectId;
  waitressName: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: Date;
  confirmedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
    },
    items: [
      {
        menuItemId: {
          type: Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        nameEn: {
          type: String,
          required: true,
        },
        nameAm: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        addOns: [
          {
            addOnId: {
              type: Schema.Types.ObjectId,
              ref: "AddOn",
            },
            nameEn: String,
            nameAm: String,
            price: Number,
          },
        ],
        specialNotes: String,
        station: {
          type: String,
          enum: ["kitchen", "juicebar"],
          required: true,
        },
      },
    ],
    kitchenStatus: {
      type: String,
      enum: ["pending", "inprogress", "ready"],
    },
    juicebarStatus: {
      type: String,
      enum: ["pending", "inprogress", "ready"],
    },
    overallStatus: {
      type: String,
      enum: ["pending", "inprogress", "ready", "completed"],
      default: "pending",
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile"],
    },
    paymentDetails: {
      amountReceived: Number,
      change: Number,
      mobileProvider: String,
    },
    waitressId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    waitressName: {
      type: String,
      required: true,
    },
    customerName: String,
    customerPhone: String,
    confirmedAt: Date,
    readyAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ waitressId: 1, overallStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ overallStatus: 1 });
OrderSchema.index({ kitchenStatus: 1 });
OrderSchema.index({ juicebarStatus: 1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
