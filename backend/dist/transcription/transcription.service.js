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
exports.TranscriptionService = exports.TRANSCRIPT_DELTA = void 0;
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const pubsub_module_1 = require("../pubsub/pubsub.module");
const session_service_1 = require("../session/session.service");
const transcription_provider_interface_1 = require("./transcription-provider.interface");
exports.TRANSCRIPT_DELTA = 'TRANSCRIPT_DELTA';
let TranscriptionService = class TranscriptionService {
    constructor(provider, sessionService, pubSub) {
        this.provider = provider;
        this.sessionService = sessionService;
        this.pubSub = pubSub;
    }
    startForRoom(roomId) {
        this.provider.start(roomId, (segment) => {
            if (segment.isFinal && segment.textSegment.trim() !== '') {
                this.sessionService.appendTranscriptLine(roomId, segment);
            }
            this.pubSub.publish(`${exports.TRANSCRIPT_DELTA}.${roomId}`, { transcriptDelta: segment });
        });
    }
    pushAudioChunk(roomId, speakerId, chunk, sampleRate) {
        this.provider.pushAudioChunk(roomId, speakerId, chunk, sampleRate);
    }
    stopForRoom(roomId) {
        this.provider.stop(roomId);
    }
};
exports.TranscriptionService = TranscriptionService;
exports.TranscriptionService = TranscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(transcription_provider_interface_1.TRANSCRIPTION_PROVIDER)),
    __param(2, (0, common_1.Inject)(pubsub_module_1.PUB_SUB)),
    __metadata("design:paramtypes", [Object, session_service_1.SessionService,
        graphql_subscriptions_1.PubSub])
], TranscriptionService);
//# sourceMappingURL=transcription.service.js.map