export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  description?: string;
  publishedYear?: number;
  coverUrl?: string;

  totalCopies: number;
  availableCopies: number;

  isPopular?: boolean;
}
