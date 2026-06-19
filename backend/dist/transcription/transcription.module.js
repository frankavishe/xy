"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptionModule = void 0;
const common_1 = require("@nestjs/common");
const pubsub_module_1 = require("../pubsub/pubsub.module");
const session_module_1 = require("../session/session.module");
const audio_gateway_1 = require("./audio.gateway");
const mock_transcription_provider_1 = require("./mock-transcription.provider");
const transcription_provider_interface_1 = require("./transcription-provider.interface");
const transcription_service_1 = require("./transcription.service");
let TranscriptionModule = class TranscriptionModule {
};
exports.TranscriptionModule = TranscriptionModule;
exports.TranscriptionModule = TranscriptionModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, pubsub_module_1.PubSubModule],
        providers: [
            transcription_service_1.TranscriptionService,
            audio_gateway_1.AudioGateway,
            { provide: transcription_provider_interface_1.TRANSCRIPTION_PROVIDER, useClass: mock_transcription_provider_1.MockTranscriptionProvider },
        ],
        exports: [transcription_service_1.TranscriptionService],
    })
], TranscriptionModule);
//# sourceMappingURL=transcription.module.js.map