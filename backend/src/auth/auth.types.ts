export type PublicAuthUser = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  emailVerified: boolean;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: PublicAuthUser;
};
