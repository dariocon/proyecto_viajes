import { AsyncPipe, CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { TripsService } from '../../_services/trips.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, NgClass, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {

  constructor(public authService: AuthService, private tripsService: TripsService, private router: Router){}

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
onSearch(inputElement: HTMLInputElement): void {
  const searchTerm = inputElement.value;

 
  this.router.navigate(['/viajes'], { queryParams: { term: searchTerm } });

  if (searchTerm) {
    inputElement.value = '';
  }
}


  // Cierra el desplegable del icono de perfil cuando el usuario hace clic fuera de él
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
