import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[appHighlightOverdue]',
  standalone: true,
})
export class HighlightOverdueDirective {
  readonly appHighlightOverdue = input(false);

  @HostBinding('style.borderLeft')
  get borderLeft(): string | null {
    return this.appHighlightOverdue() ? '4px solid #c62828' : null;
  }

  @HostBinding('style.backgroundColor')
  get backgroundColor(): string | null {
    return this.appHighlightOverdue() ? '#ffebee' : null;
  }
}
