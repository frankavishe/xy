import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SessionJoinResult {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => ID, { nullable: true })
  roomId?: string;

  @Field(() => String)
  message: string;
}
