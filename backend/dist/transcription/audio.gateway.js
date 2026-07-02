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
var AudioGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioGateway = exports.AUDIO_WS_PORT = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const transcription_service_1 = require("./transcription.service");
exports.AUDIO_WS_PORT = Number(process.env.AUDIO_WS_PORT ?? 4001);
let AudioGateway = AudioGateway_1 = class AudioGateway {
    constructor(transcriptionService) {
        this.transcriptionService = transcriptionService;
        this.logger = new common_1.Logger(AudioGateway_1.name);
    }
    handleAudioChunk(body) {
        const buffer = Buffer.from(body.data, 'base64');
        this.transcriptionService.pushAudioChunk(body.roomId, body.speakerId, buffer);
    }
};
exports.AudioGateway = AudioGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('audio-chunk'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AudioGateway.prototype, "handleAudioChunk", null);
exports.AudioGateway = AudioGateway = AudioGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)(exports.AUDIO_WS_PORT, { path: '/ws/audio' }),
    __metadata("design:paramtypes", [transcription_service_1.TranscriptionService])
], AudioGateway);
//# sourceMappingURL=audio.gateway.js.map