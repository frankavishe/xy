"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockTranscriptionProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTranscriptionProvider = void 0;
const common_1 = require("@nestjs/common");
const SCRIPT = [
    { speakerId: 'Caller', text: "Welcome to our secure meeting. Let's review the system contract parameters." },
    { speakerId: 'Receiver', text: 'Agreed. The live AI feedback loop appears to be streaming perfectly.' },
    { speakerId: 'Caller', text: 'Good. Everything routes peer-to-peer, so only the audio touches the transcription engine.' },
    { speakerId: 'Receiver', text: 'Understood. And the transcript clears itself a few minutes after we hang up?' },
    { speakerId: 'Caller', text: 'Correct — fifteen minutes after termination, then the room is wiped entirely.' },
    { speakerId: 'Receiver', text: "That works for our compliance requirements. Let's continue." },
];
let MockTranscriptionProvider = MockTranscriptionProvider_1 = class MockTranscriptionProvider {
    constructor() {
        this.logger = new common_1.Logger(MockTranscriptionProvider_1.name);
        this.rooms = new Map();
    }
    start(roomId, onSegment) {
        if (this.rooms.has(roomId))
            return;
        this.logger.log(`Mock ASR engine attached to room ${roomId}`);
        const timers = { intervalId: null, pendingTimeouts: [], scriptIndex: 0 };
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
    pushAudioChunk(_roomId, _speakerId, _chunk) {
    }
    stop(roomId) {
        const timers = this.rooms.get(roomId);
        if (!timers)
            return;
        clearInterval(timers.intervalId);
        timers.pendingTimeouts.forEach(clearTimeout);
        this.rooms.delete(roomId);
        this.logger.log(`Mock ASR engine detached from room ${roomId}`);
    }
};
exports.MockTranscriptionProvider = MockTranscriptionProvider;
exports.MockTranscriptionProvider = MockTranscriptionProvider = MockTranscriptionProvider_1 = __decorate([
    (0, common_1.Injectable)()
], MockTranscriptionProvider);
//# sourceMappingURL=mock-transcription.provider.js.map