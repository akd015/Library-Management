import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, take, throwError } from 'rxjs';
import { Transaction, TransactionStatus } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly tx$ = new BehaviorSubject<Transaction[] | null>(null);
  private readonly url = 'assets/mock/transactions.json';

  getAll(): Observable<Transaction[]> {
    return this.ensureLoaded().pipe(map((tx) => tx.slice()));
  }

  getOpenByBookId(bookId: number): Observable<Transaction | undefined> {
    return this.ensureLoaded().pipe(
      map((tx) =>
        tx
          .filter((t) => t.bookId === bookId)
          .find((t) => t.status === 'BORROWED' || t.status === 'OVERDUE')
      )
    );
  }

  getOpenByMemberId(memberId: number): Observable<Transaction[]> {
    return this.ensureLoaded().pipe(
      map((tx) =>
        tx
          .filter((t) => t.memberId === memberId)
          .filter((t) => t.status === 'BORROWED' || t.status === 'OVERDUE')
          .slice()
      )
    );
  }

  create(tx: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((all) => {
        const nextId = Math.max(0, ...all.map((t) => t.id)) + 1;
        const created: Transaction = { ...tx, id: nextId };
        this.tx$.next([...all, created]);
        return of(created);
      })
    );
  }

  updateStatus(id: number, status: TransactionStatus, returnedAt?: string): Observable<Transaction> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((all) => {
        const idx = all.findIndex((t) => t.id === id);
        if (idx === -1) return throwError(() => new Error('Transaction not found'));
        const updated: Transaction = { ...all[idx], status, returnedAt: returnedAt ?? all[idx].returnedAt };
        const next = all.slice();
        next[idx] = updated;
        this.tx$.next(next);
        return of(updated);
      })
    );
  }

  private ensureLoaded(): Observable<Transaction[]> {
    const cached = this.tx$.value;
    if (cached) return of(cached);
    return this.http.get<Transaction[]>(this.url).pipe(
      map((tx) => tx ?? []),
      map((tx) => {
        this.tx$.next(tx);
        return tx;
      })
    );
  }
}
