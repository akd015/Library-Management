import { Pipe, PipeTransform } from '@angular/core';
import { Book } from '../../core/models/book.model';

@Pipe({
  name: 'availabilityFilter',
  standalone: true,
})
export class AvailabilityFilterPipe implements PipeTransform {
  transform(
    books: Book[] | null | undefined,
    filter: 'all' | 'available' | 'unavailable' | null | undefined
  ): Book[] {
    if (!books) return [];
    switch (filter) {
      case 'available':
        return books.filter((book) => book.availableCopies > 0);
      case 'unavailable':
        return books.filter((book) => book.availableCopies <= 0);
      default:
        return books;
    }
  }
}
