import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Demo-only "session" state */
  readonly memberId = signal<number | null>(null);

  login(memberId: number) {
    this.memberId.set(memberId);
  }

  logout() {
    this.memberId.set(null);
  }

  isLoggedIn(): boolean {
    return this.memberId() !== null;
  }
}
