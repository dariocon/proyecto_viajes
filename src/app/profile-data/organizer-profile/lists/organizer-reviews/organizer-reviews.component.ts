import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TripsService } from '../../../../_services/trips.service';
import { RatingDto } from '../../../../_interfaces/rating';

@Component({
  selector: 'app-organizer-reviews',
  imports: [CommonModule, RouterLink],
  templateUrl: './organizer-reviews.component.html',
  styleUrl: './organizer-reviews.component.css'
})
export class OrganizerReviewsComponent implements OnInit {
  @Input() organizerUsername!: string;
  
  reviews: RatingDto[] = [];
  page = 0;
  size = 12;
  totalPages = 0;
  loadingReviews = true;

  constructor(private tripsService: TripsService) {}

  ngOnInit(): void {
    this.loadOrganizerReviews();
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

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadOrganizerReviews();
      document.querySelector('.tabs-navigation')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  get displayCurrentReviewsPage(): number {
    return this.page + 1;
  }

  getReviewPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
}