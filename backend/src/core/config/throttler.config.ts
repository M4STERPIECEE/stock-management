import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      /**
       * Global limit: 60 requests per 60 seconds per IP
       */
      ttl: configService.get<number>('throttle.ttl') || 60000,
      limit: configService.get<number>('throttle.limit') || 60,
    },
  ],
});
