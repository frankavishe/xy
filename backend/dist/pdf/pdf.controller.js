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
exports.PdfController = void 0;
const common_1 = require("@nestjs/common");
const session_service_1 = require("../session/session.service");
let PdfController = class PdfController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    download(roomId, token, res) {
        const buffer = this.sessionService.consumePdf(roomId, token);
        if (!buffer) {
            throw new common_1.NotFoundException('This download link is invalid, already used, or has expired.');
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="project-xy-session-transcript.pdf"',
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    }
};
exports.PdfController = PdfController;
__decorate([
    (0, common_1.Get)(':roomId/:token'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Param)('token')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "download", null);
exports.PdfController = PdfController = __decorate([
    (0, common_1.Controller)('api/pdf'),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], PdfController);
//# sourceMappingURL=pdf.controller.js.map