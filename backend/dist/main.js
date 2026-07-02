"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const platform_ws_1 = require("@nestjs/platform-ws");
const app_module_1 = require("./app.module");
const audio_gateway_1 = require("./transcription/audio.gateway");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
    console.log(`Project XY backend listening on http://localhost:${port}`);
    console.log(`Audio chunk WebSocket listening on ws://localhost:${audio_gateway_1.AUDIO_WS_PORT}/ws/audio`);
}
bootstrap();
//# sourceMappingURL=main.js.map