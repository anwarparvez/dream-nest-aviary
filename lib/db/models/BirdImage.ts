import mongoose from 'mongoose';

export interface IBirdImage {
  title: string;
  species: 'Pigeon' | 'Chicken';
  breed: string;
  tags: string[];
  description?: string;
  imageUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  pairId?: mongoose.Types.ObjectId;
  visibility: 'public' | 'private';
  createdAt: Date;
}

const BirdImageSchema = new mongoose.Schema<IBirdImage>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  species: {
    type: String,
    enum: ['Pigeon', 'Chicken'],
    required: [true, 'Species is required'],
  },
  breed: {
    type: String,
    required: [true, 'Breed is required'],
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  pairId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pair',
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.BirdImage || mongoose.model<IBirdImage>('BirdImage', BirdImageSchema);