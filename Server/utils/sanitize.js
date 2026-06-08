import mongoose from 'mongoose';

export const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

export const sanitizeObjectId = (value) =>
  isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;

export const rejectNonString = (value) => {
  if (value !== null && value !== undefined && typeof value !== 'string') {
    throw Object.assign(new Error('Invalid input type'), { status: 400 });
  }
  return value;
};

export const rejectNonObjectId = (value) => {
  if (!isValidObjectId(value)) {
    throw Object.assign(new Error('Invalid ID'), { status: 400 });
  }
  return sanitizeObjectId(value);
};
