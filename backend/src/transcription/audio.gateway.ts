import { Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { TranscriptionService } from './transcription.service';

interface AudioChunkPayload {
  roomId: string;
  speakerId: string;
  data: string; // base64-encoded compressed audio segment
}

export const AUDIO_WS_PORT = Number(process.env.AUDIO_WS_PORT ?? 4001);

/**
 * Client->server transport for the AudioWorklet chunks (spec 3.3: 2000ms
 * compressed segments). GraphQL subscriptions only push server->client, so
 * the raw audio leg rides a plain native WebSocket on its own port instead —
 * kept off Socket.IO so the frontend needs zero client libraries (spec 2.2:
 * native HTML5 / vanilla ES6+ only), and kept off the main HTTP port so its
 * upgrade handling can never race with Apollo's own graphql-ws upgrade path.
 */
@WebSocketGateway(AUDIO_WS_PORT, { path: '/ws/audio' })
export class AudioGateway {
  private readonly logger = new Logger(AudioGateway.name);

  constructor(private readonly transcriptionService: TranscriptionService) {}

  @SubscribeMessage('audio-chunk')
  handleAudioChunk(@MessageBody() body: AudioChunkPayload): void {
    const buffer = Buffer.from(body.data, 'base64');
    this.transcriptionService.pushAudioChunk(body.roomId, body.speakerId, buffer);
  }
}
