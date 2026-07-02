export interface TranscriptSegment {
    speakerId: string;
    timestamp: number;
    textSegment: string;
    isFinal: boolean;
}
export type TranscriptSegmentHandler = (segment: TranscriptSegment) => void;
export interface TranscriptionProvider {
    start(roomId: string, onSegment: TranscriptSegmentHandler): void;
    pushAudioChunk(roomId: string, speakerId: string, chunk: Buffer, sampleRate: number): void;
    stop(roomId: string): void;
}
export declare const TRANSCRIPTION_PROVIDER = "TRANSCRIPTION_PROVIDER";
