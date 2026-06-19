import { RoomRecord } from '../session/session.types';
export declare class PdfService {
    private readonly logger;
    compile(room: RoomRecord): Promise<{
        buffer: Buffer;
        wordCount: number;
        durationSeconds: number;
    }>;
    private render;
}
