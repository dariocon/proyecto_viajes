import { Component, Input, OnInit } from '@angular/core';
import { TripsService } from '../../_services/trips.service';
import { UsuariosDto } from '../../_interfaces/user';
import { CommonModule } from '@angular/common';
import { RatingDto } from '../../_interfaces/rating';
import { RouterLink } from '@angular/router';
import { TripDto } from '../../_interfaces/trip';
import { OrganizerTripsComponent } from './lists/organizer-trips/organizer-trips.component';
import { OrganizerReviewsComponent } from './lists/organizer-reviews/organizer-reviews.component';

@Component({
  selector: 'app-organizer-profile',
  imports: [CommonModule,RouterLink, OrganizerTripsComponent, OrganizerReviewsComponent],
  templateUrl: './organizer-profile.component.html',
  styleUrl: './organizer-profile.component.css'
})
export class OrganizerProfileComponent implements OnInit {
  @Input() organizerUsername!: string;
  organizer: UsuariosDto | null = null;
  stats: any;
  activeTab: 'trips' | 'reviews' | 'past' = 'trips';

  constructor(private tripsService: TripsService) {}

  ngOnInit(): void {
    this.loadOrganizer();
    this.loadOrganizerStats();
  }

  switchTab(tab: 'trips' | 'reviews' | 'past'): void {
    this.activeTab = tab;
  }

  loadOrganizer(): void {
    this.tripsService.getOrganizerByUsername(this.organizerUsername).subscribe({
      next: data => this.organizer = data,
      error: err => console.error('Error cargando organizador', err)
    });
  }

  loadOrganizerStats(): void {
    this.tripsService.getOrganizerStats(this.organizerUsername).subscribe({
      next: data => this.stats = data,
      error: err => console.error('Error cargando stats', err)
    });
  }
}