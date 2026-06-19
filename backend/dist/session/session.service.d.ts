import { ConfigService } from '@nestjs/config';
import { PubSub } from 'graphql-subscriptions';
import { PdfRecord, RoomRecord, TranscriptRecord } from './session.types';
export declare const SESSION_EVENT_CONNECTED = "SESSION_EVENT_CONNECTED";
export declare class SessionService {
    private readonly config;
    private readonly pubSub;
    private readonly logger;
    private readonly rooms;
    private readonly hashIndex;
    private readonly secret;
    constructor(config: ConfigService, pubSub: PubSub);
    createSession(): {
        roomId: string;
        hash: string;
        expiresAt: number;
        ttlSeconds: number;
    };
    validateHash(hash: string): {
        success: boolean;
        roomId?: string;
        message: string;
    };
    getRoom(roomId: string): RoomRecord | undefined;
    getActiveRoom(roomId: string): RoomRecord | undefined;
    appendTranscriptLine(roomId: string, line: TranscriptRecord): void;
    terminate(roomId: string): RoomRecord | undefined;
    setPdfReady(roomId: string, buffer: Buffer, wordCount: number, durationSeconds: number): string | undefined;
    getPdfRecord(roomId: string): PdfRecord | undefined;
    consumePdf(roomId: string, token: string): Buffer | undefined;
    private expireWaitingRoom;
    private wipeRoom;
    private generateUniqueHash;
    private generateHash;
}
