import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    await this.seedAdminUser();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }

  async updateProfilePicture(
    id: string,
    profilePicture: string,
  ): Promise<void> {
    await this.usersRepository.update(id, { profilePicture });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, updateData);
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('admin.email');
    const adminPassword = this.configService.get<string>('admin.password');

    if (!adminEmail || !adminPassword) {
      console.warn(
        'Admin credentials not found in configuration. Skipping seeding.',
      );
      return;
    }

    const existingAdmin = await this.findOneByEmail(adminEmail);

    if (!existingAdmin) {
      const admin = this.usersRepository.create({
        username: 'MASTERPIECE',
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'ADMIN',
      });
      await this.usersRepository.save(admin);
      console.log('Admin user seeded successfully.');
    }
  }
}
