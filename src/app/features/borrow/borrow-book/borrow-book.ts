import { AsyncPipe, NgIf } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { combineLatest, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { BookService } from '../../../core/services/book';
import { MemberService } from '../../../core/services/member';
import { TransactionService } from '../../../core/services/transaction';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-borrow-book',
  imports: [
    NgIf,
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './borrow-book.html',
  styleUrl: './borrow-book.scss',
})
export class BorrowBook {
  private readonly auth = inject(AuthService);
  private readonly bookService = inject(BookService);
  private readonly memberService = inject(MemberService);
  private readonly txService = inject(TransactionService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly memberId = computed(() => this.auth.memberId());
  readonly minDueDate = this.todayDate();

  readonly form = new FormGroup({
    bookId: new FormControl<number | null>(null, {
      validators: [Validators.required],
      nonNullable: false,
    }),
    dueAt: new FormControl<Date | null>(this.defaultDueDate(), {
      validators: [Validators.required, dueDateNotPastValidator()],
      nonNullable: false,
    }),
  });

  readonly books$ = this.bookService.getAll().pipe(map((books) => books.filter((b) => b.availableCopies > 0)));

  readonly selectedBook$ = combineLatest([
    this.books$,
    this.form.controls.bookId.valueChanges.pipe(startWith(this.form.controls.bookId.value)),
  ]).pipe(map(([books, id]) => books.find((b) => b.id === Number(id))));

  readonly member$ = this.memberService.getAll().pipe(map((m) => m.find((x) => x.id === this.memberId())));

  submit() {
    if (!this.memberId()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const bookId = Number(this.form.value.bookId);
    const due = this.form.value.dueAt!;
    const todayIso = this.toIsoDate(new Date());
    const dueIso = this.toIsoDate(due);

    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Confirm Borrow',
          message: `Borrow this book until ${dueIso}?`,
          confirmText: 'Borrow',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.bookService.borrow(bookId).subscribe({
          next: () => {
            this.txService
              .create({
                bookId,
                memberId: this.memberId()!,
                borrowedAt: todayIso,
                dueAt: dueIso,
                status: 'BORROWED',
              })
              .subscribe({
                next: () => {
                  this.snackbar.open('Book borrowed successfully', 'OK', { duration: 2500 });
                  this.router.navigate(['/book', bookId]);
                },
                error: (err) => {
                  this.snackbar.open(String(err?.message ?? 'Failed to create transaction'), 'Dismiss', {
                    duration: 3500,
                  });
                },
              });
          },
          error: (err) => {
            this.snackbar.open(String(err?.message ?? 'Borrow failed'), 'Dismiss', { duration: 3500 });
          },
        });
      });
  }

  private defaultDueDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  }

  private toIsoDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private todayDate(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }
}

function dueDateNotPastValidator(): ValidatorFn {
  return (control: AbstractControl<Date | null>): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const dueDate = new Date(value);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today ? { pastDate: true } : null;
  };
}
