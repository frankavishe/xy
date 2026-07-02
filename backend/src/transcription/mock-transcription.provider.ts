import { Injectable, Logger } from '@nestjs/common';
import { TranscriptSegmentHandler, TranscriptionProvider } from './transcription-provider.interface';

const SCRIPT: Array<{ speakerId: string; text: string }> = [
  { speakerId: 'Caller', text: "Welcome to our secure meeting. Let's review the system contract parameters." },
  { speakerId: 'Receiver', text: 'Agreed. The live AI feedback loop appears to be streaming perfectly.' },
  { speakerId: 'Caller', text: 'Good. Everything routes peer-to-peer, so only the audio touches the transcription engine.' },
  { speakerId: 'Receiver', text: 'Understood. And the transcript clears itself a few minutes after we hang up?' },
  { speakerId: 'Caller', text: 'Correct — fifteen minutes after termination, then the room is wiped entirely.' },
  { speakerId: 'Receiver', text: "That works for our compliance requirements. Let's continue." },
];

interface RoomTimers {
  intervalId: NodeJS.Timeout;
  pendingTimeouts: NodeJS.Timeout[];
  scriptIndex: number;
}

/**
 * Simulates a streaming ASR provider: emits an interim (isFinal:false) segment,
 * then the finalized version a beat later, alternating speakers on a fixed
 * cadence. Ignores actual audio bytes — see pushAudioChunk.
 */
@Injectable()
export class MockTranscriptionProvider implements TranscriptionProvider {
  private readonly logger = new Logger(MockTranscriptionProvider.name);
  private readonly rooms = new Map<string, RoomTimers>();

  start(roomId: string, onSegment: TranscriptSegmentHandler): void {
    if (this.rooms.has(roomId)) return;
    this.logger.log(`Mock ASR engine attached to room ${roomId}`);

    const timers: RoomTimers = { intervalId: null as unknown as NodeJS.Timeout, pendingTimeouts: [], scriptIndex: 0 };

    const emitNext = () => {
      const line = SCRIPT[timers.scriptIndex % SCRIPT.length];
      timers.scriptIndex += 1;
      const interimText = line.text.split(' ').slice(0, 3).join(' ') + '…';

      onSegment({
        speakerId: line.speakerId,
        timestamp: Date.now(),
        textSegment: interimText,
        isFinal: false,
      });

      const finalTimeout = setTimeout(() => {
        onSegment({
          speakerId: line.speakerId,
          timestamp: Date.now(),
          textSegment: line.text,
          isFinal: true,
        });
      }, 900);
      timers.pendingTimeouts.push(finalTimeout);
    };

    emitNext();
    timers.intervalId = setInterval(emitNext, 4000);
    this.rooms.set(roomId, timers);
  }

  pushAudioChunk(_roomId: string, _speakerId: string, _chunk: Buffer, _sampleRate: number): void {
    // Mock provider doesn't analyze audio — a real provider (Deepgram/Whisper)
    // would forward `chunk` to its streaming ASR socket here.
  }

  stop(roomId: string): void {
    const timers = this.rooms.get(roomId);
    if (!timers) return;
    clearInterval(timers.intervalId);
    timers.pendingTimeouts.forEach(clearTimeout);
    this.rooms.delete(roomId);
    this.logger.log(`Mock ASR engine detached from room ${roomId}`);
  }
}
