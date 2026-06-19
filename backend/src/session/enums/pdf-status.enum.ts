import { registerEnumType } from '@nestjs/graphql';

export enum PdfStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  EXPIRED = 'EXPIRED',
  NOT_FOUND = 'NOT_FOUND',
}

registerEnumType(PdfStatus, {
  name: 'PdfStatus',
  description: 'Processing state of the server-side compiled session PDF.',
});
