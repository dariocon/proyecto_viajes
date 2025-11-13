export interface Notifications {
  id: number;
  content: string;
  isRead: boolean;
  sentDate: string;
  route?: string; 
}

export interface NotificationDtoAdd {
  username: string;
  tripId: number;
  content: string;
  sentDate: string;
}