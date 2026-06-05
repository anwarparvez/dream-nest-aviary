import mongoose from 'mongoose';

export interface IBreedingRecord {
  pairId: mongoose.Types.ObjectId;
  eggDate: Date;
  eggCount: number;
  hatchDate?: Date;
  chickCount?: number;
  chickStatus?: string;
  inventoryAdded: boolean; // Track if chicks added to inventory
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BreedingRecordSchema = new mongoose.Schema<IBreedingRecord>({
  pairId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pair',
    required: [true, 'Pair ID is required'],
  },
  eggDate: {
    type: Date,
    required: [true, 'Egg date is required'],
  },
  eggCount: {
    type: Number,
    required: [true, 'Egg count is required'],
    min: 1,
  },
  hatchDate: Date,
  chickCount: {
    type: Number,
    min: 0,
  },
  chickStatus: String,
  inventoryAdded: {
    type: Boolean,
    default: false,
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

export default mongoose.models.BreedingRecord || mongoose.model<IBreedingRecord>('BreedingRecord', BreedingRecordSchema);