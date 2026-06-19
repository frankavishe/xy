import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SessionKeyPair {
  @Field(() => ID)
  roomId: string;

  @Field(() => String, { description: '12-character uppercase alphanumeric access hash' })
  hash: string;

  @Field(() => Float, { description: 'Unix ms timestamp at which the unclaimed room expires' })
  expiresAt: number;

  @Field(() => Float)
  ttlSeconds: number;
}
