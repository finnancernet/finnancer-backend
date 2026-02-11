import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SyncConfigDocument = SyncConfig & Document;

@Schema({ timestamps: true })
export class SyncConfig {
  @Prop({ required: true, unique: true })
  itemId: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  cursor: string;

  @Prop()
  lastSyncedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  institutionName: string;
}

export const SyncConfigSchema = SchemaFactory.createForClass(SyncConfig);
