import { Inject } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { PdfService } from '../pdf/pdf.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { PdfStatus } from './enums/pdf-status.enum';
import { PdfStatusResult } from './models/pdf-status-result.model';
import { SessionEventPayload } from './models/session-event-payload.model';
import { SessionJoinResult } from './models/session-join-result.model';
import { SessionKeyPair } from './models/session-key-pair.model';
import { SignalingPayload } from './models/signaling-payload.model';
import { TranscriptLine } from './models/transcript-line.model';
import { SESSION_EVENT_CONNECTED, SessionService } from './session.service';
import { TRANSCRIPT_DELTA } from '../transcription/transcription.service';

const SIGNALING_STREAM = 'SIGNALING_STREAM';

@Resolver()
export class SessionResolver {
  constructor(
    private readonly sessionService: SessionService,
    private readonly transcriptionService: TranscriptionService,
    private readonly pdfService: PdfService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => SessionKeyPair)
  initiateSecureSession(): SessionKeyPair {
    return this.sessionService.createSession();
  }

  @Mutation(() => SessionJoinResult)
  validateSessionHash(@Args('hash', { type: () => String }) hash: string): SessionJoinResult {
    const result = this.sessionService.validateHash(hash);
    if (result.success && result.roomId) {
      this.transcriptionService.startForRoom(result.roomId);
    }
    return result;
  }

  @Mutation(() => Boolean)
  sendSignalingPayload(
    @Args('roomId', { type: () => ID }) roomId: string,
    @Args('payload', { type: () => String }) payload: string,
  ): boolean {
    const room = this.sessionService.getActiveRoom(roomId);
    if (!room) return false;
    this.pubSub.publish(`${SIGNALING_STREAM}.${roomId}`, {
      signalingStream: { roomId, payload },
    });
    return true;
  }

  @Mutation(() => Boolean)
  async terminateSession(@Args('roomId', { type: () => ID }) roomId: string): Promise<boolean> {
    const room = this.sessionService.terminate(roomId);
    if (!room) return false;

    this.transcriptionService.stopForRoom(roomId);

    const { buffer, wordCount, durationSeconds } = await this.pdfService.compile(room);
    this.sessionService.setPdfReady(roomId, buffer, wordCount, durationSeconds);
    return true;
  }

  @Query(() => PdfStatusResult)
  pollPdfStatus(@Args('roomId', { type: () => ID }) roomId: string): PdfStatusResult {
    const pdf = this.sessionService.getPdfRecord(roomId);
    if (!pdf) return { status: PdfStatus.NOT_FOUND };

    if (pdf.status === 'READY' && pdf.token) {
      return {
        status: PdfStatus.READY,
        downloadUrl: `/api/pdf/${roomId}/${pdf.token}`,
        wordCount: pdf.wordCount,
        durationSeconds: pdf.durationSeconds,
      };
    }
    return { status: pdf.status === 'EXPIRED' ? PdfStatus.EXPIRED : PdfStatus.PENDING };
  }

  @Subscription(() => SessionEventPayload, {
    filter: (payload, variables) => payload.sessionEventConnected.roomId === variables.roomId,
    resolve: (payload) => payload.sessionEventConnected,
  })
  sessionEventConnected(@Args('roomId', { type: () => ID }) roomId: string) {
    return this.pubSub.asyncIterableIterator(`${SESSION_EVENT_CONNECTED}.${roomId}`);
  }

  @Subscription(() => SignalingPayload, {
    filter: (payload, variables) => payload.signalingStream.roomId === variables.roomId,
    resolve: (payload) => payload.signalingStream,
  })
  signalingStream(@Args('roomId', { type: () => ID }) roomId: string) {
    return this.pubSub.asyncIterableIterator(`${SIGNALING_STREAM}.${roomId}`);
  }

  @Subscription(() => TranscriptLine, {
    // No `filter` needed: the topic name itself (`TRANSCRIPT_DELTA.<roomId>`) already
    // scopes events to this room — TranscriptLine carries no roomId field per spec 3.3.
    resolve: (payload) => payload.transcriptDelta,
  })
  transcriptDelta(@Args('roomId', { type: () => ID }) roomId: string) {
    return this.pubSub.asyncIterableIterator(`${TRANSCRIPT_DELTA}.${roomId}`);
  }
}
