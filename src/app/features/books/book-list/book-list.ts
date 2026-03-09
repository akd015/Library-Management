import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { BookService } from '../../../core/services/book';
import { Book } from '../../../core/models/book.model';
import { GenreFilterPipe } from '../../../shared/pipes/genre-filter.pipe';
import { AuthorFilterPipe } from '../../../shared/pipes/author-filter.pipe';
import { AvailabilityFilterPipe } from '../../../shared/pipes/availability-filter.pipe';
import { HighlightPopularDirective } from '../../../shared/directives/highlight-popular.directive';

@Component({
  selector: 'app-book-list',
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    HighlightPopularDirective,
  ],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  private readonly bookService = inject(BookService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly genreFilter = new GenreFilterPipe();
  private readonly authorFilter = new AuthorFilterPipe();
  private readonly availabilityFilter = new AvailabilityFilterPipe();

  readonly books$ = this.bookService.getAll();
  readonly search = new FormControl('', { nonNullable: true });
  readonly selectedGenre = new FormControl('', { nonNullable: true });
  readonly selectedAuthor = new FormControl('', { nonNullable: true });
  readonly selectedAvailability = new FormControl<'all' | 'available' | 'unavailable'>('all', {
    nonNullable: true,
  });

  readonly addBookModel: Omit<Book, 'id'> = {
    isbn: '',
    title: '',
    author: '',
    genre: '',
    description: '',
    publishedYear: undefined,
    totalCopies: 1,
    availableCopies: 1,
    coverUrl: '',
    isPopular: false,
  };

  private readonly paginatorState$ = new BehaviorSubject<{ pageIndex: number; pageSize: number }>({
    pageIndex: 0,
    pageSize: 5,
  });

  readonly filteredBooks$ = combineLatest([
    this.books$,
    this.search.valueChanges.pipe(startWith(this.search.value)),
    this.selectedGenre.valueChanges.pipe(startWith(this.selectedGenre.value)),
    this.selectedAuthor.valueChanges.pipe(startWith(this.selectedAuthor.value)),
    this.selectedAvailability.valueChanges.pipe(startWith(this.selectedAvailability.value)),
  ]).pipe(
    map(([books, term, genre, author, availability]) => {
      const bySearch = this.searchBooks(books, term);
      const byGenre = this.genreFilter.transform(bySearch, genre);
      const byAuthor = this.authorFilter.transform(byGenre, author);
      return this.availabilityFilter.transform(byAuthor, availability);
    })
  );

  readonly pagedBooks$ = combineLatest([this.filteredBooks$, this.paginatorState$]).pipe(
    map(([books, term]) => {
      const start = term.pageIndex * term.pageSize;
      return books.slice(start, start + term.pageSize);
    })
  );

  readonly totalFilteredBooks$ = this.filteredBooks$.pipe(map((books) => books.length));
  readonly uniqueGenres$ = this.books$.pipe(
    map((books) => Array.from(new Set(books.map((book) => book.genre))).sort((a, b) => a.localeCompare(b)))
  );
  readonly uniqueAuthors$ = this.books$.pipe(
    map((books) => Array.from(new Set(books.map((book) => book.author))).sort((a, b) => a.localeCompare(b)))
  );

  readonly displayedColumns: Array<keyof Book | 'actions'> = [
    'title',
    'author',
    'genre',
    'availableCopies',
    'actions',
  ];

  onPage(event: PageEvent): void {
    this.paginatorState$.next({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  submitAddBook(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const totalCopies = Number(this.addBookModel.totalCopies);
    const publishedYear =
      this.addBookModel.publishedYear === undefined || this.addBookModel.publishedYear === null
        ? undefined
        : Number(this.addBookModel.publishedYear);

    this.bookService
      .create({
        isbn: this.addBookModel.isbn.trim(),
        title: this.addBookModel.title.trim(),
        author: this.addBookModel.author.trim(),
        genre: this.addBookModel.genre.trim(),
        description: this.addBookModel.description?.trim() || undefined,
        publishedYear,
        totalCopies,
        availableCopies: totalCopies,
        coverUrl: this.addBookModel.coverUrl?.trim() || undefined,
        isPopular: Boolean(this.addBookModel.isPopular),
      })
      .subscribe({
        next: () => {
          this.snackbar.open('Book added to catalog', 'OK', { duration: 2500 });
          form.resetForm({
            isbn: '',
            title: '',
            author: '',
            genre: '',
            description: '',
            publishedYear: null,
            totalCopies: 1,
            availableCopies: 1,
            coverUrl: '',
            isPopular: false,
          });
          this.paginatorState$.next({ pageIndex: 0, pageSize: this.paginatorState$.value.pageSize });
        },
        error: (err) => {
          this.snackbar.open(String(err?.message ?? 'Failed to add book'), 'Dismiss', { duration: 3500 });
        },
      });
  }

  private searchBooks(books: Book[], term: string): Book[] {
    const t = term.trim().toLowerCase();
    if (!t) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(t) ||
        book.author.toLowerCase().includes(t) ||
        book.genre.toLowerCase().includes(t) ||
        book.isbn.toLowerCase().includes(t)
    );
  }
}
