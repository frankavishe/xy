import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { TranscriptSegmentHandler, TranscriptionProvider } from './transcription-provider.interface';

const DEEPGRAM_LISTEN_URL = 'wss://api.deepgram.com/v1/listen';

interface Connection {
  socket: WebSocket;
  ready: boolean;
  queue: Buffer[];
}

/** Real ASR via Deepgram's live streaming WebSocket — one connection per (roomId, speakerId). */
@Injectable()
export class DeepgramTranscriptionProvider implements TranscriptionProvider {
  private readonly logger = new Logger(DeepgramTranscriptionProvider.name);
  private readonly handlers = new Map<string, TranscriptSegmentHandler>();
  private readonly connections = new Map<string, Connection>();

  constructor(private readonly apiKey: string) {}

  start(roomId: string, onSegment: TranscriptSegmentHandler): void {
    this.handlers.set(roomId, onSegment);
  }

  pushAudioChunk(roomId: string, speakerId: string, chunk: Buffer, sampleRate: number): void {
    const key = `${roomId}:${speakerId}`;
    let conn = this.connections.get(key);
    if (!conn) {
      conn = this.openConnection(key, roomId, speakerId, sampleRate);
      this.connections.set(key, conn);
    }
    if (conn.ready) {
      conn.socket.send(chunk);
    } else {
      conn.queue.push(chunk);
    }
  }

  stop(roomId: string): void {
    this.handlers.delete(roomId);
    for (const [key, conn] of this.connections) {
      if (key.startsWith(`${roomId}:`)) {
        conn.socket.close();
        this.connections.delete(key);
      }
    }
  }

  private openConnection(key: string, roomId: string, speakerId: string, sampleRate: number): Connection {
    const params = new URLSearchParams({
      model: 'nova-3',
      language: 'en',
      encoding: 'linear16',
      sample_rate: String(Math.round(sampleRate)),
      channels: '1',
      interim_results: 'true',
      punctuate: 'true',
      smart_format: 'true',
    });

    const socket = new WebSocket(`${DEEPGRAM_LISTEN_URL}?${params.toString()}`, {
      headers: { Authorization: `Token ${this.apiKey}` },
    });

    const conn: Connection = { socket, ready: false, queue: [] };

    socket.on('open', () => {
      conn.ready = true;
      for (const chunk of conn.queue) socket.send(chunk);
      conn.queue = [];
    });

    socket.on('message', (raw: Buffer) => {
      const handler = this.handlers.get(roomId);
      if (!handler) return;

      let payload: any;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const transcript = payload?.channel?.alternatives?.[0]?.transcript ?? '';
      const isFinal = Boolean(payload.is_final);

      // If the transcript is empty and it's not a final result, skip it.
      if (!transcript && !isFinal) return;

      handler({
        speakerId,
        timestamp: Date.now(),
        textSegment: transcript,
        isFinal,
      });
    });

    socket.on('error', (err: Error) => {
      this.logger.error(`Deepgram socket error for ${key}: ${err.message}`);
    });

    socket.on('close', () => {
      this.connections.delete(key);
    });

    return conn;
  }
}
