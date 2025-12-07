import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { NotificationService } from '../../_services/notification.service';
import { Notifications } from '../../_interfaces/notification';
import { NgClass, NgStyle } from '@angular/common';
import { interval, tap } from 'rxjs';
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  imports:[NgClass, NgStyle]
})
export class NotificationComponent implements OnInit {
  @Input() isOpen = false;             // lo controla el padre
  @Output() toggle = new EventEmitter<void>();
  notifications: Notifications[] = []; // array de notificaciones
  public hasUnread = this.notificationService.hasUnread;
  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(nots => this.notifications = nots);
     this.notificationService.refreshNotifications();
 /*   this.notificationService.refreshNotifications();
      interval(5000)
      .pipe(
        tap(() => this.notificationService.refreshNotifications())
      )
      .subscribe();*/
  }

markAsRead(notification: Notifications) {
  this.notificationService.markAsRead(notification.id).subscribe();
}

markAllAsRead() {
  this.notificationService.markAllAsRead().subscribe();
}



formatDate(dateString: string): string {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

deleteNotification(idNotification: number): void {
  this.notificationService.deleteNotification(idNotification).subscribe({
    next: () => {
      console.log(`Notificación ${idNotification} eliminada correctamente.`);
      
   //   this.notifications = this.notifications.filter(n => n.id !== idNotification);
    },
    error: (err) => {
      console.error('Error al eliminar la notificación:', err);
    }
  });
}


 /* get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }*/
}
