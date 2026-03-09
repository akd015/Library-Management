import { Pipe, PipeTransform } from '@angular/core';
import { Book } from '../../core/models/book.model';

@Pipe({
  name: 'authorFilter',
  standalone: true,
})
export class AuthorFilterPipe implements PipeTransform {
  transform(books: Book[] | null | undefined, author: string | null | undefined): Book[] {
    if (!books) return [];
    const normalized = (author ?? '').trim().toLowerCase();
    if (!normalized) return books;
    return books.filter((book) => book.author.toLowerCase().includes(normalized));
  }
}
