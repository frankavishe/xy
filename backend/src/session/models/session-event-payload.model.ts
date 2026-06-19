import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SessionEventPayload {
  @Field(() => ID)
  roomId: string;

  @Field(() => String, { description: 'e.g. PAIRED' })
  status: string;

  @Field(() => Float)
  connectedAt: number;
}
