import { AsyncPipe, NgIf } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, map, startWith, switchMap, take } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { BookService } from '../../../core/services/book';
import { TransactionService } from '../../../core/services/transaction';

@Component({
  selector: 'app-return-book',
  imports: [
    NgIf,
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './return-book.html',
  styleUrl: './return-book.scss',
})
export class ReturnBook {
  private readonly auth = inject(AuthService);
  private readonly bookService = inject(BookService);
  private readonly txService = inject(TransactionService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly memberId = computed(() => this.auth.memberId());

  readonly openTransactions$ = toObservable(this.memberId).pipe(
    switchMap((memberId) =>
      memberId === null ? this.txService.getAll().pipe(map(() => [])) : this.txService.getOpenByMemberId(memberId)
    )
  );

  readonly form = new FormGroup({
    transactionId: new FormControl<number | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
  });

  readonly vm$ = combineLatest([this.bookService.getAll(), this.openTransactions$]).pipe(
    map(([books, openTx]) => {
      const byId = new Map(books.map((b) => [b.id, b]));
      return {
        openTx: openTx.map((t) => ({ tx: t, book: byId.get(t.bookId) })),
      };
    })
  );

  readonly selectedTx$ = combineLatest([
    this.vm$,
    this.form.controls.transactionId.valueChanges.pipe(startWith(this.form.controls.transactionId.value)),
  ]).pipe(map(([vm, id]) => vm.openTx.find((x) => x.tx.id === Number(id))));

  submit() {
    if (!this.memberId()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const txId = Number(this.form.value.transactionId);
    const todayIso = this.toIsoDate(new Date());

    this.txService
      .getAll()
      .pipe(
        take(1),
        map((all) => all.find((t) => t.id === txId)),
        switchMap((tx) => {
          if (!tx) throw new Error('Transaction not found');
          return this.bookService.return(tx.bookId).pipe(map(() => tx));
        }),
        switchMap((tx) => this.txService.updateStatus(tx.id, 'RETURNED', todayIso).pipe(map(() => tx)))
      )
      .subscribe({
        next: (tx) => {
          this.snackbar.open('Book returned successfully', 'OK', { duration: 2500 });
          this.router.navigate(['/books', tx.bookId]);
        },
        error: (err) => {
          this.snackbar.open(String(err?.message ?? 'Return failed'), 'Dismiss', { duration: 3500 });
        },
      });
  }

  private toIsoDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
