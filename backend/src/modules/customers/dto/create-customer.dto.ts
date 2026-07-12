import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'emailOrPhone', async: false })
export class EmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(_value: string, args: ValidationArguments) {
    const dto = args.object as CreateCustomerDto;
    return !!(dto.email || dto.phone);
  }

  defaultMessage() {
    return 'Either email or phone must be provided';
  }
}

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Customer phone', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Customer address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @Validate(EmailOrPhoneConstraint)
  readonly emailOrPhone?: string;
}
