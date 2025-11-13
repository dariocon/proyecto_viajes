import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { NotificationDtoAdd, Notifications } from '../_interfaces/notification';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/notifications';
  private http: HttpClient = inject(HttpClient);
  private authService = inject(AuthService);

  private _notifications$ = new BehaviorSubject<Notifications[]>([]);
  public notifications$ = this._notifications$.asObservable();

  // Signal que siempre refleja si hay notificaciones no leídas
  public hasUnread = signal<boolean>(false);

  constructor() {
    // Actualiza automáticamente el signal cada vez que cambian las notificaciones
    this.notifications$.subscribe(nots => {
      this.hasUnread.set(nots.some(n => !n.isRead));
    });
  }


addNotification(participation: NotificationDtoAdd): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}`, participation);
}

deleteNotification(idNotification: number): Observable<Notifications> {
  const url = `${this.apiUrl}/${idNotification}`;
  return this.http.delete<Notifications>(url).pipe(
    tap(() => {
      const updatedNotifications = this._notifications$.value.filter(
        n => n.id !== idNotification
      );
      this._notifications$.next(updatedNotifications);
    })
  );
}


  loadNotifications(username: string): Observable<Notifications[]> {
    return this.http.get<Notifications[]>(`${this.apiUrl}/user/${username}`).pipe(
      tap(nots => this._notifications$.next(nots))
    );
  }


  markAsRead(id: number): Observable<Notifications> {
    const readUrl = `${this.apiUrl}/read/${id}`;
    return this.http.put<Notifications>(readUrl, {}).pipe(
      tap(() => {
        const updatedNotifications = this._notifications$.value.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this._notifications$.next(updatedNotifications);
      })
    );
  }

  sendNotificationToAllParticipants(tripId: number, content: string) {
    return this.http.post(
        `${this.apiUrl}/send-to-participants`,
        null,
        {
            params: {
                tripId: tripId,
                content: content
            }
        }
    );
}


  markAllAsRead(): Observable<any> {
    const username = this.authService.username;
    const url = `${this.apiUrl}/read-all/${username}`;

    return this.http.put(url, {}).pipe(
      tap(() => {
        const updatedNotifications = this._notifications$.value.map(n => ({ ...n, isRead: true }));
        this._notifications$.next(updatedNotifications);
      })
    );
  }


  refreshNotifications(): void {
    const username = this.authService.username;
    if (username) {
      this.loadNotifications(username).subscribe();
    }
  }
}
