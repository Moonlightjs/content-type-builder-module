import {
  FilterPipe,
  GlobalApiLoggerMiddleware,
  GlobalExceptionFilter,
  isDevelopment,
  PrismaClientExceptionFilter,
  PrismaService,
  ResponseInterceptor,
  TransformInterceptor,
} from '@moonlightjs/common';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as httpContext from 'express-http-context';
import * as moduleAlias from 'module-alias';
import { AppModule } from './app.module';
import { setupSwagger } from './setup-swagger';
dotenv.config({ override: true });
moduleAlias.addAliases({
  '@modules': `${__dirname}/modules`,
  '@src': `${__dirname}`,
});

const PORT = process.env.PORT || 1999;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //setup prisma
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalPipes(new FilterPipe());
  app.enableCors();
  app.use(httpContext.middleware);
  app.use('/api', GlobalApiLoggerMiddleware);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  if (isDevelopment()) {
    setupSwagger(app);
  }
  await app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    if (isDevelopment()) {
      console.log(`🚀 Swagger at http://localhost:${PORT}/api/docs`);
    }
  });
}
bootstrap().then();
