import { Pipe, PipeTransform } from '@angular/core';
import { Book } from '../../core/models/book.model';

@Pipe({
  name: 'genreFilter',
  standalone: true,
})
export class GenreFilterPipe implements PipeTransform {
  transform(books: Book[] | null | undefined, genre: string | null | undefined): Book[] {
    if (!books) return [];
    const normalized = (genre ?? '').trim().toLowerCase();
    if (!normalized) return books;
    return books.filter((book) => book.genre.toLowerCase() === normalized);
  }
}
