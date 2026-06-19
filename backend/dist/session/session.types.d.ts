export type RoomStatus = 'WAITING' | 'PAIRED' | 'TERMINATED';
export interface TranscriptRecord {
    speakerId: string;
    timestamp: number;
    textSegment: string;
    isFinal: boolean;
}
export interface PdfRecord {
    status: 'PENDING' | 'READY' | 'EXPIRED';
    buffer?: Buffer;
    token?: string;
    wordCount?: number;
    durationSeconds?: number;
    wipeTimer?: NodeJS.Timeout;
}
export interface RoomRecord {
    roomId: string;
    hash: string;
    status: RoomStatus;
    createdAt: number;
    startedAt?: number;
    terminatedAt?: number;
    waitingTimer?: NodeJS.Timeout;
    transcript: TranscriptRecord[];
    pdf?: PdfRecord;
}
