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
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, username: user.username };
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
                    { expiresIn: '1h' }
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
                console.error(`[ForgotPassword] Failed to send email to ${email}`, error);
            }
        }
        // Always return success to prevent email enumeration
        return { message: 'If the email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.purpose !== 'reset-password') {
                throw new Error('Invalid token purpose');
            }
            
            const userId = payload.sub;
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            await this.usersService.updatePassword(userId, hashedPassword);
            
            return { message: 'Password successfully reset' };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}
