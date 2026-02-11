import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      ret.plaidTransactionId = ret.transactionId;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  isoCurrencyCode: string;

  @Prop()
  unofficialCurrencyCode: string;

  @Prop({ type: [String], default: [] })
  category: string[];

  @Prop()
  categoryId: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  authorizedDate: Date;

  @Prop({ required: true })
  name: string;

  @Prop()
  merchantName: string;

  @Prop({ required: true })
  pending: boolean;

  @Prop()
  paymentChannel: string;

  @Prop({ type: Object })
  personalFinanceCategory?: {
    primary?: string;
    detailed?: string;
    confidenceLevel?: string;
  };

  @Prop({ type: Object })
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };

  @Prop({ type: Object })
  paymentMeta?: {
    referenceNumber?: string;
    ppdId?: string;
    payee?: string;
    byOrderOf?: string;
    payer?: string;
    paymentMethod?: string;
    paymentProcessor?: string;
    reason?: string;
  };

  @Prop()
  transactionType: string;

  @Prop()
  originalDescription: string;

  @Prop()
  merchantEntityId: string;

  @Prop()
  logoUrl: string;

  @Prop()
  website: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
