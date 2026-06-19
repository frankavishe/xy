import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PdfStatus } from '../enums/pdf-status.enum';

@ObjectType()
export class PdfStatusResult {
  @Field(() => PdfStatus)
  status: PdfStatus;

  @Field(() => String, { nullable: true })
  downloadUrl?: string;

  @Field(() => Int, { nullable: true })
  wordCount?: number;

  @Field(() => Int, { nullable: true })
  durationSeconds?: number;
}
