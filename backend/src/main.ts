import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AudioGateway } from './transcription/audio.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.get(AudioGateway).attach(app.getHttpServer());
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Project XY backend listening on http://localhost:${port}`);
  console.log(`Audio chunk WebSocket listening on ws://localhost:${port}/ws/audio`);
}
bootstrap();
