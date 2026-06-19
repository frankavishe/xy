import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from '../session/session.service';

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly sessionService: SessionService) {}

  /** Transient single-use download link referenced by pollPdfStatus.downloadUrl. Spec 3.4 step 5. */
  @Get(':roomId/:token')
  download(@Param('roomId') roomId: string, @Param('token') token: string, @Res() res: Response): void {
    const buffer = this.sessionService.consumePdf(roomId, token);
    if (!buffer) {
      throw new NotFoundException('This download link is invalid, already used, or has expired.');
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="project-xy-session-transcript.pdf"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
