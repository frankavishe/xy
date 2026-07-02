import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSubModule } from '../pubsub/pubsub.module';
import { SessionModule } from '../session/session.module';
import { AudioGateway } from './audio.gateway';
import { DeepgramTranscriptionProvider } from './deepgram-transcription.provider';
import { MockTranscriptionProvider } from './mock-transcription.provider';
import { TRANSCRIPTION_PROVIDER, TranscriptionProvider } from './transcription-provider.interface';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [SessionModule, PubSubModule],
  providers: [
    TranscriptionService,
    AudioGateway,
    {
      provide: TRANSCRIPTION_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): TranscriptionProvider => {
        const apiKey = config.get<string>('DEEPGRAM_API_KEY');
        return apiKey ? new DeepgramTranscriptionProvider(apiKey) : new MockTranscriptionProvider();
      },
    },
  ],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
