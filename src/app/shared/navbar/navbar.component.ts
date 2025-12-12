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

  isNotificationDropdownOpen = false;
  isDropdownVisible = false;
  isMobileMenuOpen = false;

  role: string = '';
  isMobile: boolean = window.innerWidth <= 768;

  constructor(
    public authService: AuthService,
    private tripsService: TripsService,
    private router: Router,
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ){ }

  ngOnInit(): void {
    this.authService.role$.subscribe(role => {
      this.role = role;
      this.cdr.markForCheck(); 
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const newIsMobile = event.target.innerWidth <= 768;
    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile;
      this.cdr.markForCheck();
    }
  }

  toggleDropdown(): void { 
    this.isDropdownVisible = !this.isDropdownVisible; 
    this.cdr.markForCheck(); 
  }

  toggleNotificationDropdown() {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) {
      this.notificationService.refreshNotifications();
      this.isMobileMenuOpen = false;
    }
    this.cdr.markForCheck();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) this.isNotificationDropdownOpen = false;
    this.cdr.markForCheck();
  }

  onSearch(inputElement: HTMLInputElement): void {
    const searchTerm = inputElement.value.trim();
    this.tripsService.setSearchTerm(searchTerm);
    this.router.navigate(['/viajes'], { queryParams: searchTerm ? { term: searchTerm } : {} });
    if (searchTerm) inputElement.value = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-container')) this.isDropdownVisible = false;
    if (!target.closest('.notification-btn, .notification-dropdown')) this.isNotificationDropdownOpen = false;
    this.cdr.markForCheck();
  }

  logout(): void { 
    this.authService.logout(); 
    this.cdr.markForCheck();
  }
}
