import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { MemberService } from '../../../core/services/member';

@Component({
  selector: 'app-members',
  imports: [
    NgIf,
    AsyncPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './members.html',
  styleUrl: './members.scss',
})
export class Members {
  private readonly memberService = inject(MemberService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
}
