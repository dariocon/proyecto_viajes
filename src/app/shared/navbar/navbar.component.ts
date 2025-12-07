import { AsyncPipe, CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { TripsService } from '../../_services/trips.service';
import { NotificationService } from '../../_services/notification.service';
import { NotificationComponent } from "../../profile-data/notification/notification.component";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, NgClass, RouterLinkActive, NotificationComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {

  constructor(public authService: AuthService, private tripsService: TripsService, private router: Router,
    public notificationService: NotificationService
  ){}
  isNotificationDropdownOpen = false;
  isDropdownVisible: boolean = false;
  role: string = '';

  ngOnInit(): void {
    this.authService.role$.subscribe(role => {
      this.role = role; 
    });
  }
  toggleDropdown(): void {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

    toggleNotificationDropdown() {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) {
      this.notificationService.refreshNotifications();
    }
  }
  
  onSearch(inputElement: HTMLInputElement): void {
    const searchTerm = inputElement.value.trim();
    
    // Actualizar el BehaviorSubject en el servicio
    this.tripsService.setSearchTerm(searchTerm);
    
    // Navegar a la página de viajes con el término de búsqueda
    this.router.navigate(['/viajes'], { 
      queryParams: searchTerm ? { term: searchTerm } : {} 
    });

    // Limpiar el input después de buscar
    if (searchTerm) {
      inputElement.value = '';
    }
  }


  // Cierra el desplegable del icono de perfil cuando el usuario hace clic fuera de él
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  // Cierra dropdown de perfil
  const clickedInsideProfile = target.closest('.user-profile-container');
  if (!clickedInsideProfile) {
    this.isDropdownVisible = false;
  }

  // Cierra dropdown de notificaciones
  const clickedInsideNotification = target.closest('.notification-btn, .notification-dropdown');
  if (!clickedInsideNotification) {
    this.isNotificationDropdownOpen = false;
  }
}

  logout(): void {
    this.authService.logout()
  }

}
