import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../core/services/loading';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    @if (loading.isLoading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }
  `,
})
export class LoadingBar {
  readonly loading = inject(LoadingService);
}
