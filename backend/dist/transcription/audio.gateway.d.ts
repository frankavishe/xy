import { TranscriptionService } from './transcription.service';
interface AudioChunkPayload {
    roomId: string;
    speakerId: string;
    data: string;
}
export declare const AUDIO_WS_PORT = 3001;
export declare class AudioGateway {
    private readonly transcriptionService;
    private readonly logger;
    constructor(transcriptionService: TranscriptionService);
    handleAudioChunk(body: AudioChunkPayload): void;
}
export {};
