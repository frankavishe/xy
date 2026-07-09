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
var AudioGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioGateway = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
const transcription_service_1 = require("./transcription.service");
const AUDIO_WS_PATH = '/ws/audio';
let AudioGateway = AudioGateway_1 = class AudioGateway {
    constructor(transcriptionService) {
        this.transcriptionService = transcriptionService;
        this.logger = new common_1.Logger(AudioGateway_1.name);
        this.wss = new ws_1.WebSocketServer({ noServer: true });
    }
    attach(httpServer) {
        httpServer.on('upgrade', (request, socket, head) => {
            const { pathname } = new URL(request.url ?? '', 'http://localhost');
            if (pathname !== AUDIO_WS_PATH)
                return;
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        });
        this.wss.on('connection', (ws) => {
            ws.on('message', (raw) => this.handleMessage(raw));
            ws.on('error', (err) => this.logger.error(`Audio socket error: ${err.message}`));
        });
    }
    handleMessage(raw) {
        let message;
        try {
            message = JSON.parse(raw.toString());
        }
        catch {
            return;
        }
        if (message.event !== 'audio-chunk' || !message.data)
            return;
        const { roomId, speakerId, data, sampleRate } = message.data;
        const buffer = Buffer.from(data, 'base64');
        this.transcriptionService.pushAudioChunk(roomId, speakerId, buffer, sampleRate);
    }
};
exports.AudioGateway = AudioGateway;
exports.AudioGateway = AudioGateway = AudioGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transcription_service_1.TranscriptionService])
], AudioGateway);
//# sourceMappingURL=audio.gateway.js.map