import mongoose from 'mongoose';

export interface IInventory {
  projectId: mongoose.Types.ObjectId;
  type: 'pigeon' | 'chicken' | 'egg';
  quantity: number;
  unit: 'birds' | 'dozen' | 'piece';
  status: 'available' | 'sold' | 'growing';
  sourceId?: mongoose.Types.ObjectId; // pairId or purchaseId
  purchaseDate: Date;
  purchasePrice: number;
  sellDate?: Date;
  sellPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new mongoose.Schema<IInventory>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  type: {
    type: String,
    enum: ['pigeon', 'chicken', 'egg'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: ['birds', 'dozen', 'piece'],
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'growing'],
    default: 'available',
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pair',
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellDate: Date,
  sellPrice: {
    type: Number,
    min: 0,
  },
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

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);