import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { RoomRecord } from '../session/session.types';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /** Spec 3.4 step 4: metadata + cryptographic params + speaker-attributed script. */
  async compile(room: RoomRecord): Promise<{ buffer: Buffer; wordCount: number; durationSeconds: number }> {
    const durationSeconds = Math.max(0, Math.round(((room.terminatedAt ?? Date.now()) - (room.startedAt ?? room.createdAt)) / 1000));
    const wordCount = room.transcript.reduce((sum, line) => sum + line.textSegment.split(/\s+/).filter(Boolean).length, 0);

    const buffer = await this.render(room, wordCount, durationSeconds);
    this.logger.log(`Compiled PDF for room ${room.roomId} (${wordCount} words, ${durationSeconds}s)`);
    return { buffer, wordCount, durationSeconds };
  }

  private render(room: RoomRecord, wordCount: number, durationSeconds: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
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
}
