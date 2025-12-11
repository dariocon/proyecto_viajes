import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';


@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.css',
  standalone: false
})
export class AdministrationComponent  {

  activeSection!: 'trips' | 'users';

  constructor(private router: Router) {}

  ngOnInit() {
    // detectar sección actual al cargar el componente
    const url = this.router.url;

    this.activeSection = url.includes('/users') ? 'users' : 'trips';

    // actualizar cuando cambie la navegación interna
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeSection = event.urlAfterRedirects.includes('/users')
          ? 'users'
          : 'trips';
      });
  }
}
