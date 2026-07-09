import type { Server as HttpServer } from 'http';
import { TranscriptionService } from './transcription.service';
export declare class AudioGateway {
    private readonly transcriptionService;
    private readonly logger;
    private readonly wss;
    constructor(transcriptionService: TranscriptionService);
    attach(httpServer: HttpServer): void;
    private handleMessage;
}
