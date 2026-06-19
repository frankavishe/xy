import { Module } from '@nestjs/common';
import { PubSubModule } from '../pubsub/pubsub.module';
import { SessionModule } from '../session/session.module';
import { AudioGateway } from './audio.gateway';
import { MockTranscriptionProvider } from './mock-transcription.provider';
import { TRANSCRIPTION_PROVIDER } from './transcription-provider.interface';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [SessionModule, PubSubModule],
  providers: [
    TranscriptionService,
    AudioGateway,
    { provide: TRANSCRIPTION_PROVIDER, useClass: MockTranscriptionProvider },
  ],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
