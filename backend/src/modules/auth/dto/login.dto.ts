import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'The email of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
