import { Routes } from '@angular/router';
import { BookList } from './features/books/book-list/book-list';
import { BookDetail } from './features/books/book-detail/book-detail';
import { BorrowBook } from './features/borrow/borrow-book/borrow-book';
import { ReturnBook } from './features/return/return-book/return-book';
import { Members } from './features/members/members/members';
import { memberGuard } from './core/auth/member-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  { path: 'books', component: BookList },
  { path: 'books/:id', component: BookDetail },
  { path: 'borrow', component: BorrowBook, canActivate: [memberGuard] },
  { path: 'return', component: ReturnBook, canActivate: [memberGuard] },
  { path: 'members', component: Members },
  { path: '**', redirectTo: 'books' },
];
