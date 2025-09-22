import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Property extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop({
    type: {
      provider: { type: String, enum: ['hostaway', 'google'], required: true },
      propertyId: { type: String }, // Hostaway listing ID
      placeId: { type: String },    // Google Places ID
    },
    required: true,
  })
  external: {
    provider: 'hostaway' | 'google';
    propertyId?: string;
    placeId?: string;
  };

  @Prop([String])
  channelCodes: string[]; // e.g. ["airbnb", "booking", "direct"]

  @Prop()
  imageUrl?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Indexes
PropertySchema.index({ 'external.propertyId': 1 });
PropertySchema.index({ 'external.placeId': 1 });
