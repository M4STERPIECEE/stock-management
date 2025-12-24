import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const rawPassword = configService.get<unknown>('database.password');
                const password = typeof rawPassword === 'string' ? rawPassword : '';

                return {
                type: 'postgres',
                host: configService.get<string>('database.host'),
                port: configService.get<number>('database.port'),
                username: configService.get<string>('database.username'),
                password,
                database: configService.get<string>('database.name'),
                entities: [__dirname + '/../../modules/**/entities/*.entity{.ts,.js}'],
                synchronize: true,
                autoLoadEntities: true,
                };
            },
        }),
    ],
})
export class DatabaseModule { }
