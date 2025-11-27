import { Component, Input, OnInit } from '@angular/core';
import { TripsService } from '../../_services/trips.service';
import { UsuariosDto } from '../../_interfaces/user';
import { CommonModule } from '@angular/common';
import { RatingDto } from '../../_interfaces/rating';
import { RouterLink } from '@angular/router';
import { TripDto } from '../../_interfaces/trip';


@Component({
  selector: 'app-organizer-profile',
  imports: [CommonModule,RouterLink],
  templateUrl: './organizer-profile.component.html',
  styleUrl: './organizer-profile.component.css'
})
export class OrganizerProfileComponent implements OnInit {

   
  @Input() organizerUsername!:string;
  organizer: UsuariosDto | null = null;
  reviews: RatingDto[] = [];
  organizerTrips: TripDto[] = [];
  stats: any;
  page = 0;
  size = 12;
  totalPages = 0;

  pageTrips = 0;
  sizeTrips = 12;
  totalPagesTrips = 0;

  pagePast = 0;
  sizePast = 12;
  totalPagesPast = 0;
  pastTrips: TripDto[] = [];

  activeTab: 'trips' | 'reviews' | 'past' = 'trips';

  loadingTrips = true;
  loadingPastTrips = true;
  loadingReviews = true;

  constructor(private tripsService: TripsService) {}

  ngOnInit(): void {
    this.loadOrganizer();
    // this.loadOrganizerReviews();
    this.loadOrganizerStats();
    this.loadOrganizerTrips();
    //this.loadPastTrips();
  }


  switchTab(tab: 'trips' | 'reviews' | 'past'): void {
    this.activeTab = tab;
    // Carga los datos solo cuando se accede a la pestaña
    if (tab === 'reviews' && this.reviews.length === 0) {
      this.loadingReviews = true;
      this.loadOrganizerReviews();
    } else if (tab === 'past' && this.pastTrips.length === 0) {
      this.loadingPastTrips = true;
      this.loadPastTrips();
    }
  }


  loadOrganizer(): void {
    this.tripsService.getOrganizerByUsername(this.organizerUsername).subscribe({
      next: data => this.organizer = data,
      error: err => console.error('Error cargando organizador', err)
    });
  }

  isTripFinished(trip: TripDto): boolean {
    if (!trip.endDate) return false;
    const endDate = new Date(trip.endDate);
    const now = new Date();
    return endDate.getTime() < now.getTime();
  }

  loadOrganizerTrips(): void {
    this.loadingTrips = true;
    this.tripsService.getTripsByOrganizer(this.organizerUsername, this.pageTrips, this.sizeTrips, 'startDate', 'DESC', 'proximos')
      .subscribe({
        next: data => {
          this.organizerTrips = data.content || [];
          this.totalPagesTrips = data.page.totalPages || 0; 
          this.loadingTrips = false;
        }
      });
  }

  loadPastTrips(): void {
    this.loadingPastTrips = true;
    this.tripsService.getTripsByOrganizer(this.organizerUsername, this.pagePast, this.sizePast, 'startDate', 'DESC', 'pasados')
      .subscribe({
        next: data => {
          this.pastTrips = data.content || [];
          this.totalPagesPast = data.page.totalPages || 0;
          this.loadingPastTrips = false;
        },
        error: err => console.error('Error cargando viajes pasados', err)
      });
  }

  changePastTripsPage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPagesPast) {
      this.pagePast = newPage;
      this.loadPastTrips();
    }
  }

  get displayCurrentPastTripsPage(): number {
    return this.pagePast + 1;
  }

  getPastTripsPageNumbers(): number[] {
    return Array(this.totalPagesPast).fill(0).map((_, i) => i + 1);
  }


loadOrganizerReviews(): void {
  this.loadingReviews = true;
  this.tripsService.getOrganizerReviews(this.organizerUsername, this.page, this.size).subscribe({
    next: data => {
      this.reviews = data.content || [];
      this.totalPages = data.page.totalPages || 0;
      this.loadingReviews = false;
    },
    error: err => console.error('Error cargando reseñas', err)
  });
}

  loadOrganizerStats(): void {
    this.tripsService.getOrganizerStats(this.organizerUsername).subscribe({
      next: data => this.stats = data,
      error: err => console.error('Error cargando stats', err)
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadOrganizerReviews();
    }
  }

  changeTripsPage(newPage: number): void {
  if (newPage >= 0 && newPage < this.totalPagesTrips) {
    this.pageTrips = newPage;
    this.loadOrganizerTrips();
  }
}
get displayCurrentTripsPage(): number {
  return this.pageTrips + 1;
}

get displayCurrentReviewsPage(): number {
  return this.page + 1;
}

getTripsPageNumbers(): number[] {
  return Array(this.totalPagesTrips).fill(0).map((_, i) => i + 1);
}

getReviewPageNumbers(): number[] {
  return Array(this.totalPages).fill(0).map((_, i) => i + 1);
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
