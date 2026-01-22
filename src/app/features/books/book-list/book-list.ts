import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { combineLatest, map, startWith } from 'rxjs';
import { BookService } from '../../../core/services/book';
import { Book } from '../../../core/models/book.model';

@Component({
  selector: 'app-book-list',
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
  ],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  private readonly bookService = inject(BookService);

  readonly books$ = this.bookService.getAll();
  readonly search = new FormControl('', { nonNullable: true });

  readonly filteredBooks$ = combineLatest([
    this.books$,
    this.search.valueChanges.pipe(startWith(this.search.value)),
  ]).pipe(
    map(([books, term]) => {
      const t = term.trim().toLowerCase();
      if (!t) return books;
      return books.filter(
        (b) =>
          b.title.toLowerCase().includes(t) ||
          b.author.toLowerCase().includes(t) ||
          b.genre.toLowerCase().includes(t) ||
          b.isbn.toLowerCase().includes(t)
      );
    })
  );

  readonly displayedColumns: Array<keyof Book | 'actions'> = [
    'title',
    'author',
    'genre',
    'availableCopies',
    'actions',
  ];
}
