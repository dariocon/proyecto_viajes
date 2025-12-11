import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { AuthService } from './_services/auth.service';
import { Title } from '@angular/platform-browser';
import { FooterComponent } from "./shared/footer/footer.component";
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  showFooter = false;

  constructor(private titleService: Title, private router: Router) {
    this.setTitle('Rutalix');
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Oculta el footer en /login, /register y páginas de error
        this.showFooter = !(event.urlAfterRedirects === '/auth/login' || event.urlAfterRedirects === '/auth/register' 
          || event.urlAfterRedirects === '/not-found' || event.urlAfterRedirects === '/forbidden');
      });
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }







}
