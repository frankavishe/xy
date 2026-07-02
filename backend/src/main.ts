import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { AUDIO_WS_PORT } from './transcription/audio.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Project XY backend listening on http://localhost:${port}`);
  console.log(`Audio chunk WebSocket listening on ws://localhost:${AUDIO_WS_PORT}/ws/audio`);
}
bootstrap();
