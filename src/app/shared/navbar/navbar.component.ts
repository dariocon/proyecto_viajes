import { AsyncPipe, CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class NavbarComponent implements OnInit {

  isNotificationDropdownOpenDesktop = false;
  isNotificationDropdownOpenMobile = false;
  isDropdownVisible = false;
  isMobileMenuOpen = false;

  role: string = '';
  isMobile: boolean = window.innerWidth <= 768;

  constructor(
    public authService: AuthService,
    private tripsService: TripsService,
    private router: Router,
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef // para actualizar manualmente la vista
  ){ }

  ngOnInit(): void {
    this.authService.role$.subscribe(role => {
      this.role = role;
      this.cdr.markForCheck();  // Actualiza la vista cuando cambia el rol
    });
  }

  // Detecta cambios de tamaño de pantalla
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const newIsMobile = event.target.innerWidth <= 768;
    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile;
      this.cdr.markForCheck(); // Actualiza la vista cuando cambia el tamaño
    }
  }

  // Abre/cierra el dropdown de perfil
  toggleDropdown(): void { 
    this.isDropdownVisible = !this.isDropdownVisible; 
    this.cdr.markForCheck();  // Actualiza la vista del dropdown
  }

  // Abre/cierra notificaciones en desktop
  toggleNotificationDropdownDesktop() {
    this.isNotificationDropdownOpenDesktop = !this.isNotificationDropdownOpenDesktop;
    if (this.isNotificationDropdownOpenDesktop) {
      this.notificationService.refreshNotifications();
    }
    this.cdr.markForCheck(); // Actualiza la vista de notificaciones desktop
  }

   // Abre/cierra notificaciones en móvil
  toggleNotificationDropdownMobile() {
    this.isNotificationDropdownOpenMobile = !this.isNotificationDropdownOpenMobile;
    if (this.isNotificationDropdownOpenMobile) {
      this.notificationService.refreshNotifications();
      this.isMobileMenuOpen = false;
    }
    this.cdr.markForCheck();  // Actualiza la vista de notificaciones móvil
  }

  // Abre/cierra menú hamburguesa en móvil
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) this.isNotificationDropdownOpenMobile = false;
    this.cdr.markForCheck(); // Actualiza la vista del menú móvil
  }

  onSearch(inputElement: HTMLInputElement): void {
    const searchTerm = inputElement.value.trim();
    this.tripsService.setSearchTerm(searchTerm);
    this.router.navigate(['/viajes'], { queryParams: searchTerm ? { term: searchTerm } : {} });
    if (searchTerm) inputElement.value = '';
  }

  // Cierra dropdowns al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-container')) this.isDropdownVisible = false;
    if (!target.closest('.notification-btn, .notification-dropdown')) {
      this.isNotificationDropdownOpenDesktop = false;
      this.isNotificationDropdownOpenMobile = false;
    }
    this.cdr.markForCheck();
  }

  logout(): void { 
    this.authService.logout(); 
    this.cdr.markForCheck();
  }
}
