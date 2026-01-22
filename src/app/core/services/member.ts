import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, take, throwError } from 'rxjs';
import { Member } from '../models/member.model';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly members$ = new BehaviorSubject<Member[] | null>(null);
  private readonly url = '/assets/mock/members.json';

  getAll(): Observable<Member[]> {
    return this.ensureLoaded().pipe(map((members) => members.slice()));
  }

  getById(id: number): Observable<Member | undefined> {
    return this.ensureLoaded().pipe(map((members) => members.find((m) => m.id === id)));
  }

  create(member: Omit<Member, 'id'>): Observable<Member> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((members) => {
        const nextId = Math.max(0, ...members.map((m) => m.id)) + 1;
        const created: Member = { ...member, id: nextId };
        this.members$.next([...members, created]);
        return of(created);
      })
    );
  }

  update(id: number, patch: Partial<Member>): Observable<Member> {
    return this.ensureLoaded().pipe(
      take(1),
      switchMap((members) => {
        const idx = members.findIndex((m) => m.id === id);
        if (idx === -1) return throwError(() => new Error('Member not found'));
        const updated: Member = { ...members[idx], ...patch, id };
        const next = members.slice();
        next[idx] = updated;
        this.members$.next(next);
        return of(updated);
      })
    );
  }

  private ensureLoaded(): Observable<Member[]> {
    const cached = this.members$.value;
    if (cached) return of(cached);
    return this.http.get<Member[]>(this.url).pipe(
      map((members) => members ?? []),
      map((members) => {
        this.members$.next(members);
        return members;
      })
    );
  }
}
