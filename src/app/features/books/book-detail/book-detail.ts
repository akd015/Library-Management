import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { map, switchMap } from 'rxjs';
import { BookService } from '../../../core/services/book';

@Component({
  selector: 'app-book-detail',
  imports: [NgIf, AsyncPipe, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
})
export class BookDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly bookService = inject(BookService);

  readonly book$ = this.route.paramMap.pipe(
    map((pm) => Number(pm.get('id'))),
    switchMap((id) => this.bookService.getById(id))
  );
}
