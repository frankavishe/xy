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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub_module_1 = require("../pubsub/pubsub.module");
const pdf_service_1 = require("../pdf/pdf.service");
const transcription_service_1 = require("../transcription/transcription.service");
const pdf_status_enum_1 = require("./enums/pdf-status.enum");
const pdf_status_result_model_1 = require("./models/pdf-status-result.model");
const session_event_payload_model_1 = require("./models/session-event-payload.model");
const session_join_result_model_1 = require("./models/session-join-result.model");
const session_key_pair_model_1 = require("./models/session-key-pair.model");
const signaling_payload_model_1 = require("./models/signaling-payload.model");
const transcript_line_model_1 = require("./models/transcript-line.model");
const session_service_1 = require("./session.service");
const transcription_service_2 = require("../transcription/transcription.service");
const SIGNALING_STREAM = 'SIGNALING_STREAM';
let SessionResolver = class SessionResolver {
    constructor(sessionService, transcriptionService, pdfService, pubSub) {
        this.sessionService = sessionService;
        this.transcriptionService = transcriptionService;
        this.pdfService = pdfService;
        this.pubSub = pubSub;
    }
    initiateSecureSession() {
        return this.sessionService.createSession();
    }
    validateSessionHash(hash) {
        const result = this.sessionService.validateHash(hash);
        if (result.success && result.roomId) {
            this.transcriptionService.startForRoom(result.roomId);
        }
        return result;
    }
    sendSignalingPayload(roomId, payload) {
        const room = this.sessionService.getActiveRoom(roomId);
        if (!room)
            return false;
        this.pubSub.publish(`${SIGNALING_STREAM}.${roomId}`, {
            signalingStream: { roomId, payload },
        });
        return true;
    }
    async terminateSession(roomId) {
        const room = this.sessionService.terminate(roomId);
        if (!room)
            return false;
        this.transcriptionService.stopForRoom(roomId);
        const { buffer, wordCount, durationSeconds } = await this.pdfService.compile(room);
        this.sessionService.setPdfReady(roomId, buffer, wordCount, durationSeconds);
        return true;
    }
    pollPdfStatus(roomId) {
        const pdf = this.sessionService.getPdfRecord(roomId);
        if (!pdf)
            return { status: pdf_status_enum_1.PdfStatus.NOT_FOUND };
        if (pdf.status === 'READY' && pdf.token) {
            return {
                status: pdf_status_enum_1.PdfStatus.READY,
                downloadUrl: `/api/pdf/${roomId}/${pdf.token}`,
                wordCount: pdf.wordCount,
                durationSeconds: pdf.durationSeconds,
            };
        }
        return { status: pdf.status === 'EXPIRED' ? pdf_status_enum_1.PdfStatus.EXPIRED : pdf_status_enum_1.PdfStatus.PENDING };
    }
    sessionEventConnected(roomId) {
        return this.pubSub.asyncIterableIterator(`${session_service_1.SESSION_EVENT_CONNECTED}.${roomId}`);
    }
    signalingStream(roomId) {
        return this.pubSub.asyncIterableIterator(`${SIGNALING_STREAM}.${roomId}`);
    }
    transcriptDelta(roomId) {
        return this.pubSub.asyncIterableIterator(`${transcription_service_2.TRANSCRIPT_DELTA}.${roomId}`);
    }
};
exports.SessionResolver = SessionResolver;
__decorate([
    (0, graphql_1.Mutation)(() => session_key_pair_model_1.SessionKeyPair),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", session_key_pair_model_1.SessionKeyPair)
], SessionResolver.prototype, "initiateSecureSession", null);
__decorate([
    (0, graphql_1.Mutation)(() => session_join_result_model_1.SessionJoinResult),
    __param(0, (0, graphql_1.Args)('hash', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", session_join_result_model_1.SessionJoinResult)
], SessionResolver.prototype, "validateSessionHash", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('payload', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Boolean)
], SessionResolver.prototype, "sendSignalingPayload", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionResolver.prototype, "terminateSession", null);
__decorate([
    (0, graphql_1.Query)(() => pdf_status_result_model_1.PdfStatusResult),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", pdf_status_result_model_1.PdfStatusResult)
], SessionResolver.prototype, "pollPdfStatus", null);
__decorate([
    (0, graphql_1.Subscription)(() => session_event_payload_model_1.SessionEventPayload, {
        filter: (payload, variables) => payload.sessionEventConnected.roomId === variables.roomId,
        resolve: (payload) => payload.sessionEventConnected,
    }),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SessionResolver.prototype, "sessionEventConnected", null);
__decorate([
    (0, graphql_1.Subscription)(() => signaling_payload_model_1.SignalingPayload, {
        filter: (payload, variables) => payload.signalingStream.roomId === variables.roomId,
        resolve: (payload) => payload.signalingStream,
    }),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SessionResolver.prototype, "signalingStream", null);
__decorate([
    (0, graphql_1.Subscription)(() => transcript_line_model_1.TranscriptLine, {
        resolve: (payload) => payload.transcriptDelta,
    }),
    __param(0, (0, graphql_1.Args)('roomId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SessionResolver.prototype, "transcriptDelta", null);
exports.SessionResolver = SessionResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __param(3, (0, common_1.Inject)(pubsub_module_1.PUB_SUB)),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        transcription_service_1.TranscriptionService,
        pdf_service_1.PdfService,
        graphql_subscriptions_1.PubSub])
], SessionResolver);
//# sourceMappingURL=session.resolver.js.map