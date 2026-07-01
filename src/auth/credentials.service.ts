import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
// Adjust this import to wherever your shared PrismaService actually lives,
// e.g. '@formify/common' if you exported it from the shared lib.
import { PrismaService } from '../prisma/prisma.service';

export interface CredentialUser {
  id: string;
  email: string;
  password: string;
  isActive: boolean;
  firstName?: string | null;
  lastName?: string | null;
}

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates an email/password pair.
   * Returns the user (active or inactive) on a password match, or null
   * if the user doesn't exist or the password is wrong. Intentionally
   * does NOT check `isActive` here - that decision belongs to the caller
   * so it can distinguish 401 (bad creds) from 403 (inactive account).
   *
   * The raw password is never logged, printed, or included in any thrown
   * error - only the email is used for audit logging.
   */
  async validatePassword(email: string, password: string): Promise<CredentialUser | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(`Login attempt for unknown email: ${normalizedEmail}`);
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      this.logger.warn(`Failed login attempt (bad password) for: ${normalizedEmail}`);
      return null;
    }

    return user;
  }
}
