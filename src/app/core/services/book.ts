import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, take, throwError } from 'rxjs';
import { Book } from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly books$ = new BehaviorSubject<Book[] | null>(null);
  private readonly url = '/assets/mock/books.json';

  getAll(): Observable<Book[]> {
    return this.ensureLoaded().pipe(map((books) => books.slice()));
  }

  getById(id: number): Observable<Book | undefined> {
    return this.ensureLoaded().pipe(map((books) => books.find((b) => b.id === id)));
  }

  create(book: Omit<Book, 'id'>): Observable<Book> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((books) => {
        const nextId = Math.max(0, ...books.map((b) => b.id)) + 1;
        const created: Book = { ...book, id: nextId };
        this.books$.next([...books, created]);
        return of(created);
      })
    );
  }

  update(id: number, patch: Partial<Book>): Observable<Book> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((books) => {
        const idx = books.findIndex((b) => b.id === id);
        if (idx === -1) return throwError(() => new Error('Book not found'));
        const updated: Book = { ...books[idx], ...patch, id };
        const next = books.slice();
        next[idx] = updated;
        this.books$.next(next);
        return of(updated);
      })
    );
  }

  borrow(bookId: number): Observable<Book> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((books) => {
        const book = books.find((b) => b.id === bookId);
        if (!book) return throwError(() => new Error('Book not found'));
        if (book.availableCopies <= 0) return throwError(() => new Error('No copies available'));
        return this.update(bookId, { availableCopies: book.availableCopies - 1 });
      })
    );
  }

  return(bookId: number): Observable<Book> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((books) => {
        const book = books.find((b) => b.id === bookId);
        if (!book) return throwError(() => new Error('Book not found'));
        const nextAvailable = Math.min(book.totalCopies, book.availableCopies + 1);
        return this.update(bookId, { availableCopies: nextAvailable });
      })
    );
  }

  private ensureLoaded(): Observable<Book[]> {
    const cached = this.books$.value;
    if (cached) return of(cached);
    return this.http.get<Book[]>(this.url).pipe(
      map((books) => books ?? []),
      map((books) => {
        this.books$.next(books);
        return books;
      })
    );
  }
}
