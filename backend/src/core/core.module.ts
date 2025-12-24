import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../.env', '.env'],
            load: [configuration],
        }),
        MailerModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get('mail.host'),
                    secure: false,
                    auth: {
                        user: configService.get('mail.user'),
                        pass: configService.get('mail.password'),
                    },
                },
                defaults: {
                    from: configService.get('mail.from'),
                },
                template: {
                    dir: join(process.cwd(), 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
        DatabaseModule,
    ],
    exports: [DatabaseModule, MailerModule],
})
export class CoreModule { }
