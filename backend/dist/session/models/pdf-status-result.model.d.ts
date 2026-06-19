import { PdfStatus } from '../enums/pdf-status.enum';
export declare class PdfStatusResult {
    status: PdfStatus;
    downloadUrl?: string;
    wordCount?: number;
    durationSeconds?: number;
}
