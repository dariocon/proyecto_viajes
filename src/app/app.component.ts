import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { AuthService } from './_services/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private titleService: Title) {
    this.setTitle('Rutalix');
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }







}
