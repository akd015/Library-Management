import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[appHighlightPopular]',
  standalone: true,
})
export class HighlightPopularDirective {
  readonly appHighlightPopular = input(false);

  @HostBinding('style.borderLeft')
  get borderLeft(): string | null {
    return this.appHighlightPopular() ? '4px solid #2e7d32' : null;
  }

  @HostBinding('style.backgroundColor')
  get backgroundColor(): string | null {
    return this.appHighlightPopular() ? '#f1f8e9' : null;
  }
}
