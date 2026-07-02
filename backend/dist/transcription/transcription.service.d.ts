import { PubSub } from 'graphql-subscriptions';
import { SessionService } from '../session/session.service';
import { TranscriptionProvider } from './transcription-provider.interface';
export declare const TRANSCRIPT_DELTA = "TRANSCRIPT_DELTA";
export declare class TranscriptionService {
    private readonly provider;
    private readonly sessionService;
    private readonly pubSub;
    constructor(provider: TranscriptionProvider, sessionService: SessionService, pubSub: PubSub);
    startForRoom(roomId: string): void;
    pushAudioChunk(roomId: string, speakerId: string, chunk: Buffer, sampleRate: number): void;
    stopForRoom(roomId: string): void;
}
