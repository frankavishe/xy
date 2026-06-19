"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const path_1 = require("path");
const apollo_1 = require("@nestjs/apollo");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const graphql_1 = require("@nestjs/graphql");
const serve_static_1 = require("@nestjs/serve-static");
const pdf_module_1 = require("./pdf/pdf.module");
const pubsub_module_1 = require("./pubsub/pubsub.module");
const session_module_1 = require("./session/session.module");
const session_resolver_1 = require("./session/session.resolver");
const transcription_module_1 = require("./transcription/transcription.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                subscriptions: {
                    'graphql-ws': true,
                },
                playground: false,
                introspection: true,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), '..', 'frontend'),
                exclude: ['/graphql', '/api/(.*)'],
            }),
            pubsub_module_1.PubSubModule,
            session_module_1.SessionModule,
            transcription_module_1.TranscriptionModule,
            pdf_module_1.PdfModule,
        ],
        providers: [session_resolver_1.SessionResolver],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map