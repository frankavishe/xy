export interface TranscriptSegment {
  speakerId: string;
  timestamp: number;
  textSegment: string;
  isFinal: boolean;
}

export type TranscriptSegmentHandler = (segment: TranscriptSegment) => void;

/**
 * Pluggable boundary for the ASR engine (spec 3.3: "Deepgram Live WebSockets or
 * OpenAI Whisper Live Streaming API"). Swapping the mock for a real provider is
 * the only change needed to go from simulated to real transcription.
 */
export interface TranscriptionProvider {
  start(roomId: string, onSegment: TranscriptSegmentHandler): void;
  pushAudioChunk(roomId: string, speakerId: string, chunk: Buffer): void;
  stop(roomId: string): void;
}

export const TRANSCRIPTION_PROVIDER = 'TRANSCRIPTION_PROVIDER';
