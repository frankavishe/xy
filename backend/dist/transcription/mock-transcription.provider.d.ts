import { TranscriptSegmentHandler, TranscriptionProvider } from './transcription-provider.interface';
export declare class MockTranscriptionProvider implements TranscriptionProvider {
    private readonly logger;
    private readonly rooms;
    start(roomId: string, onSegment: TranscriptSegmentHandler): void;
    pushAudioChunk(_roomId: string, _speakerId: string, _chunk: Buffer, _sampleRate: number): void;
    stop(roomId: string): void;
}
