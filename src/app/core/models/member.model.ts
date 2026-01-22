export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
  membershipDate: string; // ISO date
  isActive: boolean;
}
