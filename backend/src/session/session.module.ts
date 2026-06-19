import { Module } from '@nestjs/common';
import { PubSubModule } from '../pubsub/pubsub.module';
import { SessionService } from './session.service';

@Module({
  imports: [PubSubModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
