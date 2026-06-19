import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SignalingPayload {
  @Field(() => ID)
  roomId: string;

  @Field(() => String, {
    description: 'Opaque JSON string containing { from, kind, data } for SDP offer/answer/ICE relay',
  })
  payload: string;
}
