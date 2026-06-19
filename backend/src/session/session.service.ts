import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { PubSub } from 'graphql-subscriptions';
import { PdfRecord, RoomRecord, RoomStatus, TranscriptRecord } from './session.types';

const WAITING_TTL_MS = 300_000; // 5 minutes — spec 3.1 step 3
const WIPE_AFTER_TERMINATE_MS = 900_000; // 15 minutes — spec 5.3 / 3.4 step 6
export const SESSION_EVENT_CONNECTED = 'SESSION_EVENT_CONNECTED';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly hashIndex = new Map<string, string>(); // hash -> roomId
  private readonly secret: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {
    this.secret = this.config.get<string>('SESSION_HASH_SECRET') ?? 'dev-secret-change-me';
  }

  /** Phase 1: Caller requests a new gated room. Spec 3.1 steps 1-4. */
  createSession(): { roomId: string; hash: string; expiresAt: number; ttlSeconds: number } {
    const roomId = crypto.randomUUID();
    const hash = this.generateUniqueHash();
    const createdAt = Date.now();
    const expiresAt = createdAt + WAITING_TTL_MS;

    const room: RoomRecord = {
      roomId,
      hash,
      status: 'WAITING',
      createdAt,
      transcript: [],
    };

    room.waitingTimer = setTimeout(() => this.expireWaitingRoom(roomId), WAITING_TTL_MS);
    this.rooms.set(roomId, room);
    this.hashIndex.set(hash, roomId);

    this.logger.log(`Room ${roomId} created, awaiting recipient (TTL 300s)`);
    return { roomId, hash, expiresAt, ttlSeconds: WAITING_TTL_MS / 1000 };
  }

  /** Phase 2: Recipient submits the hash. Spec 3.2 steps 1-3. */
  validateHash(hash: string): { success: boolean; roomId?: string; message: string } {
    const normalized = hash.trim().toUpperCase();
    const roomId = this.hashIndex.get(normalized);
    const room = roomId ? this.rooms.get(roomId) : undefined;

    if (!room || room.status !== 'WAITING') {
      return { success: false, message: 'Invalid, expired, or already-claimed key.' };
    }

    clearTimeout(room.waitingTimer);
    room.status = 'PAIRED';
    room.startedAt = Date.now();

    this.pubSub.publish(`${SESSION_EVENT_CONNECTED}.${room.roomId}`, {
      sessionEventConnected: {
        roomId: room.roomId,
        status: 'PAIRED',
        connectedAt: room.startedAt,
      },
    });

    this.logger.log(`Room ${room.roomId} paired — recipient bound to hash`);
    return { success: true, roomId: room.roomId, message: 'Connected — initializing live feed.' };
  }

  getRoom(roomId: string): RoomRecord | undefined {
    return this.rooms.get(roomId);
  }

  getActiveRoom(roomId: string): RoomRecord | undefined {
    const room = this.rooms.get(roomId);
    return room && room.status !== 'TERMINATED' ? room : undefined;
  }

  appendTranscriptLine(roomId: string, line: TranscriptRecord): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status === 'TERMINATED') return;
    room.transcript.push(line);
  }

  /** Phase 4: termination + PDF lifecycle kickoff. Spec 3.4. */
  terminate(roomId: string): RoomRecord | undefined {
    const room = this.rooms.get(roomId);
    if (!room || room.status === 'TERMINATED') return room;

    clearTimeout(room.waitingTimer);
    room.status = 'TERMINATED';
    room.terminatedAt = Date.now();
    room.pdf = { status: 'PENDING' };
    this.hashIndex.delete(room.hash);

    this.logger.log(`Room ${roomId} terminated — scheduling 900s memory wipe`);
    setTimeout(() => this.wipeRoom(roomId), WIPE_AFTER_TERMINATE_MS);

    return room;
  }

  setPdfReady(roomId: string, buffer: Buffer, wordCount: number, durationSeconds: number): string | undefined {
    const room = this.rooms.get(roomId);
    if (!room || !room.pdf) return undefined;
    const token = crypto.randomBytes(24).toString('hex');
    room.pdf = { status: 'READY', buffer, token, wordCount, durationSeconds };
    return token;
  }

  getPdfRecord(roomId: string): PdfRecord | undefined {
    return this.rooms.get(roomId)?.pdf;
  }

  /** Single-use download: returns the buffer once, then immediately wipes it. Spec 3.4 step 5-6. */
  consumePdf(roomId: string, token: string): Buffer | undefined {
    const room = this.rooms.get(roomId);
    if (!room?.pdf || room.pdf.status !== 'READY' || room.pdf.token !== token) return undefined;
    const { buffer } = room.pdf;
    room.pdf = { status: 'EXPIRED' };
    return buffer;
  }

  private expireWaitingRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'WAITING') return;
    this.hashIndex.delete(room.hash);
    this.rooms.delete(roomId);
    this.logger.log(`Room ${roomId} expired unclaimed after TTL`);
  }

  private wipeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.transcript = [];
    room.pdf = undefined;
    this.rooms.delete(roomId);
    this.logger.log(`Room ${roomId} memory wiped — forensic discovery window closed`);
  }

  private generateUniqueHash(): string {
    let hash: string;
    do {
      hash = this.generateHash();
    } while (this.hashIndex.has(hash));
    return hash;
  }

  /** H = SHA-256(Salt + Timestamp + Secret), trimmed to 12-char uppercase alphanumeric. Spec 3.1 step 2. */
  private generateHash(): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString();
    const digest = crypto
      .createHash('sha256')
      .update(salt + timestamp + this.secret)
      .digest('hex');
    return digest.slice(0, 12).toUpperCase();
  }
}
