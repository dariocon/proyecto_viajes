import { AsyncPipe, CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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


/*  ngOnInit(): void {
    this.authService.isLogged.subscribe(value => {
      this.isAuthenticaded = value;
    });
  }  */
  
  logout(): void {
    this.authService.logout()
  }

}
