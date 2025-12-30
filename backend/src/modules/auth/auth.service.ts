import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await user.validatePassword(pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: any) {
    const payload = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      email: user.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      sub: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      role: user.role,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      username: user.username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      firstName: user.firstName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      lastName: user.lastName,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      try {
        const token = this.jwtService.sign(
          { sub: user.id, purpose: 'reset-password' },
          { expiresIn: '1h' },
        );

        await this.mailerService.sendMail({
          to: email,
          subject: 'Réinitialisation de mot de passe - StockManager',
          template: './forgot-password',
          context: {
            name: user.username,
            url: `http://localhost:5173/reset-password?token=${token}`,
          },
        });
        console.log(`[ForgotPassword] Email sent to ${email}`);
      } catch (error) {
        console.error(
          `[ForgotPassword] Failed to send email to ${email}`,
          error,
        );
      }
    }
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payload.purpose !== 'reset-password') {
        throw new Error('Invalid token purpose');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const userId = payload.sub;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.usersService.updatePassword(userId, hashedPassword);

      return { message: 'Password successfully reset' };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
      const _ = error;
      throw new Error('Invalid or expired token');
    }
  }

  async updateProfilePicture(userId: string, profilePicture: string) {
    await this.usersService.updateProfilePicture(userId, profilePicture);
    const user = await this.usersService.findOneById(userId);
    return this.login(user);
  }

  async updateProfile(userId: string, updateData: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (updateData.password) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete updateData.password;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.usersService.updateUser(userId, updateData);
    const user = await this.usersService.findOneById(userId);
    return this.login(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
