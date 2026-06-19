"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
let PdfService = PdfService_1 = class PdfService {
    constructor() {
        this.logger = new common_1.Logger(PdfService_1.name);
    }
    async compile(room) {
        const durationSeconds = Math.max(0, Math.round(((room.terminatedAt ?? Date.now()) - (room.startedAt ?? room.createdAt)) / 1000));
        const wordCount = room.transcript.reduce((sum, line) => sum + line.textSegment.split(/\s+/).filter(Boolean).length, 0);
        const buffer = await this.render(room, wordCount, durationSeconds);
        this.logger.log(`Compiled PDF for room ${room.roomId} (${wordCount} words, ${durationSeconds}s)`);
        return { buffer, wordCount, durationSeconds };
    }
    render(room, wordCount, durationSeconds) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(20).fillColor('#1d3557').text('Project XY — Secure Session Transcript', { align: 'center' });
            doc.moveDown(1.5);
            doc.fontSize(11).fillColor('#000000');
            doc.text(`Session Date: ${new Date(room.startedAt ?? room.createdAt).toLocaleString()}`);
            doc.text(`Call Duration: ${durationSeconds} seconds`);
            doc.text(`Total Word Count: ${wordCount}`);
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#555555').text('Cryptographic Authentication Parameters', { underline: true });
            doc.fontSize(10).fillColor('#000000');
            doc.text(`Room ID: ${room.roomId}`);
            doc.text(`Access Hash (consumed): ${room.hash}`);
            doc.moveDown(1);
            doc.fontSize(13).fillColor('#1d3557').text('Conversation Script', { underline: true });
            doc.moveDown(0.5);
            if (room.transcript.length === 0) {
                doc.fontSize(11).fillColor('#777777').text('No speech was transcribed during this session.');
            }
            for (const line of room.transcript) {
                const time = new Date(line.timestamp).toLocaleTimeString();
                doc
                    .fontSize(11)
                    .fillColor(line.speakerId === 'Caller' ? '#1d3557' : '#7b2cbf')
                    .text(`[${time}] ${line.speakerId}: `, { continued: true })
                    .fillColor('#000000')
                    .text(line.textSegment);
                doc.moveDown(0.3);
            }
            doc.moveDown(1);
            doc
                .fontSize(9)
                .fillColor('#999999')
                .text('This document was generated automatically upon session termination and is ephemeral by design.', {
                align: 'center',
            });
            doc.end();
        });
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map