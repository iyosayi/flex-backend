import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true, enum: ['hostaway', 'google'] })
  source: string;

  @Prop({ required: true })
  sourceReviewId: string;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true })
  channel: string;

  @Prop()
  authorName?: string;

  @Prop()
  authorAvatarUrl?: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  title?: string;

  @Prop({ required: true })
  text: string;

  @Prop()
  language?: string;

  @Prop()
  stayDate?: Date;

  @Prop()
  stayNights?: number;

  @Prop({ required: true })
  reviewDate: Date;

  @Prop({
    type: {
      cleanliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      checkin: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      other: { type: Map, of: Number },
    },
    default: {},
  })
  categories: Record<string, number>;

  @Prop({ default: false })
  approvedForPublic: boolean;

  @Prop([String])
  tags: string[];

  @Prop({
    type: {
      approvedBy: { type: Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      reason: String,
    },
    default: {},
  })
  moderation: Record<string, any>;

  @Prop({ type: Object })
  raw: object;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ source: 1, sourceReviewId: 1 }, { unique: true });
ReviewSchema.index({ propertyId: 1, reviewDate: -1 });
ReviewSchema.index({ approvedForPublic: 1, reviewDate: -1 });
ReviewSchema.index({ channel: 1, reviewDate: -1 });
ReviewSchema.index({ text: 'text', title: 'text', authorName: 'text' });
// Optimized compound indexes for property stats aggregation
ReviewSchema.index({ propertyId: 1, approvedForPublic: 1, rating: 1 });
ReviewSchema.index({ propertyId: 1, approvedForPublic: 1, channel: 1 });
ReviewSchema.index({ propertyId: 1, approvedForPublic: 1, reviewDate: -1 });
