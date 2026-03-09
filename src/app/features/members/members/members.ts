import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { MemberService } from '../../../core/services/member';

@Component({
  selector: 'app-members',
  imports: [
    NgIf,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './members.html',
  styleUrl: './members.scss',
})
export class Members {
  private readonly memberService = inject(MemberService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackbar = inject(MatSnackBar);

  readonly redirect$ = this.route.queryParamMap.pipe(map((q) => q.get('redirect') ?? '/books'));
  readonly members$ = this.memberService.getAll();
  readonly loggedInMember$ = this.members$.pipe(
    map((members) => members.find((m) => m.id === this.auth.memberId()))
  );

  readonly form = new FormGroup({
    memberId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
      nonNullable: false,
    }),
  });

  readonly registerModel = {
    name: '',
    email: '',
    phone: '',
    membershipDate: this.todayIso(),
  };

  login(redirectTo: string) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const memberId = Number(this.form.value.memberId);
    this.memberService
      .getById(memberId)
      .pipe(
        switchMap((member) => {
          if (!member || !member.isActive) throw new Error('Invalid or inactive member');
          this.auth.login(member.id);
          return this.router.navigateByUrl(redirectTo);
        })
      )
      .subscribe({
        error: () => {
          this.form.setErrors({ invalidMember: true });
        },
      });
  }

  register(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.isFutureDate(this.registerModel.membershipDate)) {
      form.controls['membershipDate']?.setErrors({ futureDate: true });
      return;
    }

    this.memberService
      .create({
        name: this.registerModel.name.trim(),
        email: this.registerModel.email.trim(),
        phone: this.registerModel.phone.trim() || undefined,
        membershipDate: this.registerModel.membershipDate,
        isActive: true,
      })
      .subscribe({
        next: (member) => {
          this.snackbar.open(`Member #${member.id} registered`, 'OK', { duration: 2500 });
          form.resetForm({
            name: '',
            email: '',
            phone: '',
            membershipDate: this.todayIso(),
          });
        },
        error: (err) => {
          this.snackbar.open(String(err?.message ?? 'Registration failed'), 'Dismiss', {
            duration: 3500,
          });
        },
      });
  }

  private isFutureDate(dateIso: string): boolean {
    const selected = new Date(`${dateIso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }

  private todayIso(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
