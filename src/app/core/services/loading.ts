import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly pendingCount = signal(0);
  readonly isLoading = computed(() => this.pendingCount() > 0);

  show(): void {
    this.pendingCount.update((count) => count + 1);
  }

  hide(): void {
    this.pendingCount.update((count) => Math.max(0, count - 1));
  }
}
