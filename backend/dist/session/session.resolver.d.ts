import { PubSub } from 'graphql-subscriptions';
import { PdfService } from '../pdf/pdf.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { PdfStatusResult } from './models/pdf-status-result.model';
import { SessionJoinResult } from './models/session-join-result.model';
import { SessionKeyPair } from './models/session-key-pair.model';
import { SessionService } from './session.service';
export declare class SessionResolver {
    private readonly sessionService;
    private readonly transcriptionService;
    private readonly pdfService;
    private readonly pubSub;
    constructor(sessionService: SessionService, transcriptionService: TranscriptionService, pdfService: PdfService, pubSub: PubSub);
    initiateSecureSession(): SessionKeyPair;
    validateSessionHash(hash: string): SessionJoinResult;
    sendSignalingPayload(roomId: string, payload: string): boolean;
    terminateSession(roomId: string): Promise<boolean>;
    pollPdfStatus(roomId: string): PdfStatusResult;
    sessionEventConnected(roomId: string): import("graphql-subscriptions/dist/pubsub-async-iterable-iterator").PubSubAsyncIterableIterator<unknown>;
    signalingStream(roomId: string): import("graphql-subscriptions/dist/pubsub-async-iterable-iterator").PubSubAsyncIterableIterator<unknown>;
    transcriptDelta(roomId: string): import("graphql-subscriptions/dist/pubsub-async-iterable-iterator").PubSubAsyncIterableIterator<unknown>;
}
