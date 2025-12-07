import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { NotificationDtoAdd, Notifications } from '../_interfaces/notification';
import { AuthService } from './auth.service';

//import SockJS from 'sockjs-client';
import { Client, Stomp } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/notifications';
  private http: HttpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private stompClient!: Client;
  private _notifications$ = new BehaviorSubject<Notifications[]>([]);
  public notifications$ = this._notifications$.asObservable();

  // Signal que siempre refleja si hay notificaciones no leídas
  public hasUnread = signal<boolean>(false);

  constructor() {
    this.notifications$.subscribe(nots => {
      this.hasUnread.set(nots.some(n => !n.isRead));
    });

    this.initWebSocket();
  }

  //Método para el websocket de notificaciones (tanto la notificación del día antes del comienzo del viaje como las de borrado/editado viaje)
  private initWebSocket() {
    const username = this.authService.username;
    if (!username) return;

    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws', 
      reconnectDelay: 5000
    });

    this.stompClient.onConnect = () => {
      console.log('WS conectado');
      this.stompClient.subscribe(`/topic/notifications/${username}`, message => {
        const notification: Notifications = JSON.parse(message.body);
        const current = this._notifications$.value;
        this._notifications$.next([notification, ...current]);
      });
    };

    this.stompClient.activate();
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
