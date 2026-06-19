"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = exports.SESSION_EVENT_CONNECTED = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const pubsub_module_1 = require("../pubsub/pubsub.module");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const WAITING_TTL_MS = 300_000;
const WIPE_AFTER_TERMINATE_MS = 900_000;
exports.SESSION_EVENT_CONNECTED = 'SESSION_EVENT_CONNECTED';
let SessionService = SessionService_1 = class SessionService {
    constructor(config, pubSub) {
        this.config = config;
        this.pubSub = pubSub;
        this.logger = new common_1.Logger(SessionService_1.name);
        this.rooms = new Map();
        this.hashIndex = new Map();
        this.secret = this.config.get('SESSION_HASH_SECRET') ?? 'dev-secret-change-me';
    }
    createSession() {
        const roomId = crypto.randomUUID();
        const hash = this.generateUniqueHash();
        const createdAt = Date.now();
        const expiresAt = createdAt + WAITING_TTL_MS;
        const room = {
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
    validateHash(hash) {
        const normalized = hash.trim().toUpperCase();
        const roomId = this.hashIndex.get(normalized);
        const room = roomId ? this.rooms.get(roomId) : undefined;
        if (!room || room.status !== 'WAITING') {
            return { success: false, message: 'Invalid, expired, or already-claimed key.' };
        }
        clearTimeout(room.waitingTimer);
        room.status = 'PAIRED';
        room.startedAt = Date.now();
        this.pubSub.publish(`${exports.SESSION_EVENT_CONNECTED}.${room.roomId}`, {
            sessionEventConnected: {
                roomId: room.roomId,
                status: 'PAIRED',
                connectedAt: room.startedAt,
            },
        });
        this.logger.log(`Room ${room.roomId} paired — recipient bound to hash`);
        return { success: true, roomId: room.roomId, message: 'Connected — initializing live feed.' };
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getActiveRoom(roomId) {
        const room = this.rooms.get(roomId);
        return room && room.status !== 'TERMINATED' ? room : undefined;
    }
    appendTranscriptLine(roomId, line) {
        const room = this.rooms.get(roomId);
        if (!room || room.status === 'TERMINATED')
            return;
        room.transcript.push(line);
    }
    terminate(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status === 'TERMINATED')
            return room;
        clearTimeout(room.waitingTimer);
        room.status = 'TERMINATED';
        room.terminatedAt = Date.now();
        room.pdf = { status: 'PENDING' };
        this.hashIndex.delete(room.hash);
        this.logger.log(`Room ${roomId} terminated — scheduling 900s memory wipe`);
        setTimeout(() => this.wipeRoom(roomId), WIPE_AFTER_TERMINATE_MS);
        return room;
    }
    setPdfReady(roomId, buffer, wordCount, durationSeconds) {
        const room = this.rooms.get(roomId);
        if (!room || !room.pdf)
            return undefined;
        const token = crypto.randomBytes(24).toString('hex');
        room.pdf = { status: 'READY', buffer, token, wordCount, durationSeconds };
        return token;
    }
    getPdfRecord(roomId) {
        return this.rooms.get(roomId)?.pdf;
    }
    consumePdf(roomId, token) {
        const room = this.rooms.get(roomId);
        if (!room?.pdf || room.pdf.status !== 'READY' || room.pdf.token !== token)
            return undefined;
        const { buffer } = room.pdf;
        room.pdf = { status: 'EXPIRED' };
        return buffer;
    }
    expireWaitingRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'WAITING')
            return;
        this.hashIndex.delete(room.hash);
        this.rooms.delete(roomId);
        this.logger.log(`Room ${roomId} expired unclaimed after TTL`);
    }
    wipeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.transcript = [];
        room.pdf = undefined;
        this.rooms.delete(roomId);
        this.logger.log(`Room ${roomId} memory wiped — forensic discovery window closed`);
    }
    generateUniqueHash() {
        let hash;
        do {
            hash = this.generateHash();
        } while (this.hashIndex.has(hash));
        return hash;
    }
    generateHash() {
        const salt = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now().toString();
        const digest = crypto
            .createHash('sha256')
            .update(salt + timestamp + this.secret)
            .digest('hex');
        return digest.slice(0, 12).toUpperCase();
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(pubsub_module_1.PUB_SUB)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        graphql_subscriptions_1.PubSub])
], SessionService);
//# sourceMappingURL=session.service.js.map