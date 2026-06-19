import { Response } from 'express';
import { SessionService } from '../session/session.service';
export declare class PdfController {
    private readonly sessionService;
    constructor(sessionService: SessionService);
    download(roomId: string, token: string, res: Response): void;
}
