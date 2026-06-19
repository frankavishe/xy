import { Inject, Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { SessionService } from '../session/session.service';
import { TRANSCRIPTION_PROVIDER, TranscriptionProvider } from './transcription-provider.interface';

export const TRANSCRIPT_DELTA = 'TRANSCRIPT_DELTA';

@Injectable()
export class TranscriptionService {
  constructor(
    @Inject(TRANSCRIPTION_PROVIDER) private readonly provider: TranscriptionProvider,
    private readonly sessionService: SessionService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  /** Phase 3: begin streaming ASR for a freshly-paired room. Spec 3.3. */
  startForRoom(roomId: string): void {
    this.provider.start(roomId, (segment) => {
      if (segment.isFinal) {
        this.sessionService.appendTranscriptLine(roomId, segment);
      }
      this.pubSub.publish(`${TRANSCRIPT_DELTA}.${roomId}`, { transcriptDelta: segment });
    });
  }

  pushAudioChunk(roomId: string, speakerId: string, chunk: Buffer): void {
    this.provider.pushAudioChunk(roomId, speakerId, chunk);
  }

  stopForRoom(roomId: string): void {
    this.provider.stop(roomId);
  }
}
