import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Project XY backend listening on http://localhost:${port}`);
  console.log('Audio chunk WebSocket listening on ws://localhost:3001/ws/audio');
}
bootstrap();
