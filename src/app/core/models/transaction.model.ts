export type TransactionStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE';

export interface Transaction {
  id: number;
  bookId: number;
  memberId: number;
  borrowedAt: string; // ISO date
  dueAt: string; // ISO date
  returnedAt?: string; // ISO date
  status: TransactionStatus;
}
