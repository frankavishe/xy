import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PdfModule } from './pdf/pdf.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { SessionModule } from './session/session.module';
import { SessionResolver } from './session/session.resolver';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      subscriptions: {
        'graphql-ws': true,
      },
      playground: false,
      introspection: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'frontend'),
      exclude: ['/graphql', '/api/(.*)'],
    }),
    PubSubModule,
    SessionModule,
    TranscriptionModule,
    PdfModule,
  ],
  providers: [SessionResolver],
})
export class AppModule {}
