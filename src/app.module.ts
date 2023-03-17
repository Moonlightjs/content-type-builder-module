import { logQueryEvent, PrismaModule } from '@moonlightjs/common';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContentTypeBuilderModule } from './modules/content-type-builder/content-type-builder.module';

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        prismaOptions: {
          log: [
            {
              emit: 'event',
              level: 'query',
            },
            {
              emit: 'stdout',
              level: 'error',
            },
            {
              emit: 'stdout',
              level: 'info',
            },
            {
              emit: 'stdout',
              level: 'warn',
            },
          ],
          errorFormat: 'colorless',
        },
        events: {
          query: logQueryEvent,
        },
      },
    }),
    ContentTypeBuilderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
