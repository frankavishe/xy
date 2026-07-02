import { TranscriptionService } from './transcription.service';
interface AudioChunkPayload {
    roomId: string;
    speakerId: string;
    data: string;
    sampleRate: number;
}
export declare const AUDIO_WS_PORT: number;
export declare class AudioGateway {
    private readonly transcriptionService;
    private readonly logger;
    constructor(transcriptionService: TranscriptionService);
    handleAudioChunk(body: AudioChunkPayload): void;
}
export {};
