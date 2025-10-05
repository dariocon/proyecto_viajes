import { AsyncPipe, CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink,AsyncPipe, CommonModule, NgClass],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  //isAuthenticaded = false;
  constructor(public authService: AuthService){}

  isDropdownVisible: boolean = false;
/*  ngOnInit(): void {
    this.authService.isLogged.subscribe(value => {
      this.isAuthenticaded = value;
    });
  }  */
  toggleDropdown(): void {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  // Cierra el desplegable cuando el usuario hace clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
      const clickedInside = (event.target as HTMLElement).closest('.user-profile-container');
      if (!clickedInside) {
      this.isDropdownVisible = false;
      }
}
  logout(): void {
    this.authService.logout()
  }

}
