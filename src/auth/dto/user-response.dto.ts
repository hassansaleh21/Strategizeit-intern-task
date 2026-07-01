export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;

  static fromEntity(user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    isActive: boolean;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      isActive: user.isActive,
    };
  }
}
