import { Injectable, Logger } from '@nestjs/common';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Duplex } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import { TranscriptionService } from './transcription.service';

interface AudioChunkPayload {
  roomId: string;
  speakerId: string;
  data: string; // base64-encoded compressed audio segment
  sampleRate: number; // the capturing AudioContext's native sample rate
}

const AUDIO_WS_PATH = '/ws/audio';

/**
 * Client->server transport for the AudioWorklet chunks (spec 3.3: 2000ms
 * compressed segments). Bound to the same HTTP port to ensure compatibility
 * with single-port hosting environments (like Render/Railway).
 *
 * This deliberately does NOT use Nest's `@WebSocketGateway`/`WsAdapter`:
 * that adapter's `upgrade` handler destroys any socket whose path it
 * doesn't recognize, which would kill Apollo's own graphql-ws upgrade
 * handling on `/graphql` since both ride the same shared HTTP server. So
 * instead this attaches a plain `noServer` `ws` server and only reacts to
 * requests for its own path, leaving anything else untouched for other
 * `upgrade` listeners (e.g. graphql-ws) to handle.
 */
@Injectable()
export class AudioGateway {
  private readonly logger = new Logger(AudioGateway.name);
  private readonly wss = new WebSocketServer({ noServer: true });

  constructor(private readonly transcriptionService: TranscriptionService) {}

  attach(httpServer: HttpServer): void {
    httpServer.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const { pathname } = new URL(request.url ?? '', 'http://localhost');
      if (pathname !== AUDIO_WS_PATH) return;

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (raw: Buffer) => this.handleMessage(raw));
      ws.on('error', (err: Error) => this.logger.error(`Audio socket error: ${err.message}`));
    });
  }

  private handleMessage(raw: Buffer): void {
    let message: { event?: string; data?: AudioChunkPayload };
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (message.event !== 'audio-chunk' || !message.data) return;

    const { roomId, speakerId, data, sampleRate } = message.data;
    const buffer = Buffer.from(data, 'base64');
    this.transcriptionService.pushAudioChunk(roomId, speakerId, buffer, sampleRate);
  }
}
