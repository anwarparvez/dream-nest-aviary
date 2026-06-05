import mongoose from 'mongoose';

export interface IIncome {
  projectId: mongoose.Types.ObjectId;
  source: 'egg_sales' | 'bird_sales' | 'other';
  date: Date;
  amount: number;
  quantity: number;
  unitPrice: number;
  description?: string;
  relatedId?: mongoose.Types.ObjectId; // inventoryId or pairId
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new mongoose.Schema<IIncome>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  source: {
    type: String,
    enum: ['egg_sales', 'bird_sales', 'other'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  description: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);