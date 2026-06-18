import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "reflect-metadata";

import { AppModule } from "@/app.module";
import { ApiErrorFilter } from "@/presentation/common/http/api-error.filter";
import { validationExceptionFactory } from "@/presentation/common/http/validation-exception.factory";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const clientOrigin =
    configService.get<string>("CLIENT_ORIGIN") ?? "http://localhost:3000";

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: clientOrigin.split(",").map((origin) => origin.trim()),
    credentials: true
  });
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory
    })
  );

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
  Logger.log(`Es por AI API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
