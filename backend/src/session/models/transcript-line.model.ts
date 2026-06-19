import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TranscriptLine {
  @Field(() => String, { description: '"Caller" or "Receiver"' })
  speakerId: string;

  @Field(() => Float, { description: 'Unix millisecond timestamp' })
  timestamp: number;

  @Field(() => String)
  textSegment: string;

  @Field(() => Boolean)
  isFinal: boolean;
}
