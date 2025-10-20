
import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, index: true, unique: true, required: true },
    name: { type: String },
    picture: { type: String },
    provider: { type: String, default: 'google' },
    providerId: { type: String },
  },
  { timestamps: true }
);

export const User = model('User', UserSchema);
