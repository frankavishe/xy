"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_ws_1 = require("@nestjs/platform-ws");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Project XY backend listening on http://localhost:${port}`);
    console.log('Audio chunk WebSocket listening on ws://localhost:3001/ws/audio');
}
bootstrap();
//# sourceMappingURL=main.js.map