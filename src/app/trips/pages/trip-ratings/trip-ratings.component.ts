import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import Swal from 'sweetalert2';
import { RatingDto, RatingDtoAdd, RatingPageResponse } from '../../../_interfaces/rating';
import { RatingsService } from '../../../_services/rating.service';
import { TripsService } from '../../../_services/trips.service';


@Component({
  selector: 'app-trip-ratings',
  standalone:false,
  templateUrl: './trip-ratings.component.html',
  styleUrls: ['./trip-ratings.component.css', '../trip-detail/trip-detail.component.css']
})

export class TripRatingComponent implements OnInit {

  @Input() trip!: TripDto;
  @Input() hasParticipated: boolean | null = false;

  Math = Math;
  ratings: RatingDto[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  page: number = 0;
  size: number = 5;

  commentForm!: FormGroup;
  selectedScore: number = 0;

  constructor(
    private ratingsService: RatingsService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadRatings();
    this.loadAverageFromBackend();
    this.initForm();
  }

  private initForm() {
    this.commentForm = this.fb.group({
      score: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required,Validators.maxLength(500)]]
    });
  }

  loadAverageFromBackend() {
    this.ratingsService.getAverageRatingByTrip(this.trip.idTrip).subscribe({
      next: (avg: number) => {
        this.averageRating = avg;
      },
      error: err => {
        console.error('Error obteniendo la media del backend', err);
      }
    });
  }

  loadRatings() {
    this.ratingsService.getRatingsByTrip(this.trip.idTrip, this.page, this.size).subscribe({
      next: (res: RatingPageResponse) => {
        this.ratings = res.content;
        
        this.totalReviews = res.page.totalElements;
      },
      error: (err) => {
        console.error('Error al cargar valoraciones', err);
      }
    });
  }



  selectScore(score: number) {
    this.selectedScore = score;
    this.commentForm.patchValue({ score });
  }

submitComment() {
  if (this.commentForm.invalid) {
    this.commentForm.markAllAsTouched();
    return;
  }

  const rating: RatingDtoAdd = {
    tripId: this.trip.idTrip,
    username: this.authService.username,
    rating: this.commentForm.value.score,
    comment: this.commentForm.value.comment
  };

  this.ratingsService.addRating(rating).subscribe({
    next: (res: RatingDto) => {
      Swal.fire({
        title: '¡Valoración publicada!',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        background: 'linear-gradient(135deg, #F95596, #FE7079)',
        color: 'white',
        iconColor: 'white',
        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
      });
      this.ratings.unshift(res);
      this.commentForm.reset();
      this.selectedScore = 0;
      this.loadAverageFromBackend();
      this.totalReviews++;
    },
    error: (err) => {
      Swal.fire({
        title: 'Error al enviar la valoración',
        text: err?.message || 'Intenta de nuevo',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        background: 'linear-gradient(135deg, #F95596, #FE7079)',
        color: 'white',
        iconColor: 'white',
        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
  });
}




  loadMore() {
    this.page++;
    this.ratingsService.getRatingsByTrip(this.trip.idTrip, this.page, this.size).subscribe({
      next: (res: RatingPageResponse) => {
        this.ratings = [...this.ratings, ...res.content];
      }
    });
  }

getStars(rating: number): number[] {
  return Array(rating).fill(0).map((_, i) => i + 1);
}

}