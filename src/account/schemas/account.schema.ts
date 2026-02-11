import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      ret.plaidAccountId = ret.accountId;
      ret.currentBalance = ret.balances?.current ?? null;
      ret.availableBalance = ret.balances?.available ?? null;
      ret.isoCurrencyCode = ret.balances?.isoCurrencyCode ?? null;
      ret.unofficialCurrencyCode = ret.balances?.unofficialCurrencyCode ?? null;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Account {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  accountId: string;

  @Prop({ required: true })
  itemId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  officialName: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  subtype: string;

  @Prop({ required: true })
  mask: string;

  @Prop()
  email: string;

  @Prop({ default: true })
  receiveEmailSummary: boolean;

  @Prop({ type: Object })
  balances?: {
    available?: number;
    current?: number;
    limit?: number;
    isoCurrencyCode?: string;
    unofficialCurrencyCode?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastSyncedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
