import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripDto } from '../../../../_interfaces/trip';

import { TripsService } from '../../../../_services/trips.service';

@Component({
  selector: 'app-organizer-trips',
  imports: [CommonModule, RouterLink],
  templateUrl: './organizer-trips.component.html',
  styleUrl: './organizer-trips.component.css'
})
export class OrganizerTripsComponent implements OnInit {
  @Input() organizerUsername!: string;
  @Input() tripType: 'proximos' | 'pasados' = 'proximos';
  
  organizerTrips: TripDto[] = [];
  page = 0;
  size = 12;
  totalPages = 0;
  loading = true;

  constructor(private tripsService: TripsService) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.tripsService.getTripsByOrganizer(
      this.organizerUsername, 
      this.page, 
      this.size, 
      'startDate', 
      'DESC', 
      this.tripType
    ).subscribe({
      next: data => {
        this.organizerTrips = data.content || [];
        this.totalPages = data.page.totalPages || 0;
        this.loading = false;
      },
      error: err => console.error('Error cargando viajes', err)
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadTrips();
      document.querySelector('.tabs-navigation')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  get displayCurrentPage(): number {
    return this.page + 1;
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  isTripFinished(trip: TripDto): boolean {
    if (!trip.endDate) return false;
    const endDate = new Date(trip.endDate);
    const now = new Date();
    return endDate.getTime() < now.getTime();
  }

  getCoverImage(trip: TripDto): string {
    const defaultImage = 'assets/images/default-trip.png';
    if (!trip.images || trip.images.length === 0) {
      return defaultImage;
    }
    const coverImage = trip.images.find(image => image.isCover);
    if (coverImage) {
      return coverImage.imageUrl;
    }
    if (trip.images.length > 0) {
      return trip.images[0].imageUrl;
    }
    return defaultImage;
  }
}