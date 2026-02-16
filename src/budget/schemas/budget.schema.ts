import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Budget {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], required: true })
  categories: string[];

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' })
  period: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
