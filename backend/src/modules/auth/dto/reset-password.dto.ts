import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The reset token received via email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewStrongPassword123!',
    description: 'The new password',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
