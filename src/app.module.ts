import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './database/prisma/prisma.module';
import { UserModule } from './users/user.module';
import { VisitorsModule } from './visitors/visitors.module';
import { VisitsModule } from './visit/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        libraryOptions: {
          allowUnknown: true,
          abortEarly: false,
        },
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    VisitorsModule,
    VisitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
