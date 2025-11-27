import { Component, Input, OnDestroy, LOCALE_ID, OnInit } from '@angular/core';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { TripsService } from '../../../_services/trips.service';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../_interfaces/categoria';
import { switchMap, tap, of } from 'rxjs'; // <--- AÑADIDO 'of'
import { DatePipe, registerLocaleData, CommonModule } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ParticipationAdd } from '../../../_interfaces/user';
import { TripRatingComponent } from '../trip-ratings/trip-ratings.component';
import { RatingsService } from '../../../_services/rating.service';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-trip-detail',
  imports: [RouterLink, DatePipe, CommonModule,TripRatingComponent ],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.css',
  providers: [
    { provide: LOCALE_ID, useValue: 'es' } 
  ],
})
export class TripDetailComponent implements OnInit, OnDestroy {

  constructor(public authService: AuthService, private tripsService: TripsService, private ratingService: RatingsService) {}

  @Input() id!: number;
  @Input() trip?: TripDto; 
averageRating: number = 0; // valor numérico real
starArray: ('full' | 'half' | 'empty')[] = [];

  categoryName?: String;
  currentImageIndex: number = 0;
  hasParticipated: boolean | null = null;
  participationDate: string | null = null;
  stats: any;
  
  ngOnInit(): void {
      document.body.style.backgroundColor = '#F6F7F8';

      if (this.authService.isLogged()) {
          this.hasParticipated = null; 
      } else {
          this.hasParticipated = false;
      }
     
      /* Si 'this.trip' ya tiene datos del Resolver, usamos 'of(this.trip)' para que sea instantáneo.
       Si no, usamos la llamada original al servicio.*/
      const tripSource$ = this.trip 
          ? of(this.trip) 
          : this.tripsService.getTripById(this.id);

      tripSource$.pipe(
        switchMap((trip: TripDto) => {
          this.trip = trip;
          this.ratingService.getAverageRatingByTrip(this.trip.idTrip).subscribe({
  next: avg => {
    this.averageRating = avg;
    this.generateStars();
  },
  error: err => console.error('No se pudo obtener la media de valoraciones', err)
});
          
          if (this.trip.images && this.trip.images.length > 0) {
                const coverIndex = this.trip.images.findIndex(image => image.isCover);
                if (coverIndex !== -1) {
                    this.currentImageIndex = coverIndex;
                }
            }
            this.loadOrganizerStats();
          if (this.authService.isLogged()) { 
              return this.tripsService.checkParticipation(this.id).pipe(
                  tap(participation => {
                      this.hasParticipated = !!participation;;
                        this.participationDate = participation ? participation.participationDate : null;

                  }),
                  switchMap(() => this.tripsService.getCategoryById(trip.categoryId)) 
              );
          } else {
              return this.tripsService.getCategoryById(trip.categoryId);
          }
        })
      ).subscribe({
        next: (category: Categoria) => {
          if (category) {
            this.categoryName = category.name;
          }
        },
        error: (err) => {
          Swal.fire({
            title: "Error al obtener el viaje",
            text: err?.error.message || "No se ha podido obtener el viaje.",
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

  ngOnDestroy(): void {
      document.body.style.backgroundColor = ''; 
  }

  onSubmit(): void {
    const participation: ParticipationAdd = {
      idTrip: this.id,
      username: this.authService.username
    }

    Swal.fire({
      title: '¿Deseas unirte a este viaje?',
      text: 'Confirma si quieres reservar tu plaza.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reservar',
      cancelButtonText: 'Cancelar',
      background: 'linear-gradient(135deg, #F95596, #FE7079)',
      color: 'white',
      iconColor: 'white',
      confirmButtonColor: 'rgba(255, 255, 255, 0.3)',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) { 
        this.tripsService.addParticipation(participation).subscribe(
          {
             next: response => {
                Swal.fire({      
                      title: "¡Participación Registrada!",
                      text: "Te has unido al viaje con éxito. ¡Prepárate para la aventura!",
                      icon: 'success',
                      confirmButtonText: 'Aceptar',
                      background: 'linear-gradient(135deg, #F95596, #FE7079)',
                      color: 'white', 
                      iconColor: 'white', 
                      confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    }).then(() => {
                          this.hasParticipated = true;
                          if (this.trip?.participations && response) {
                            this.trip.participations.push(response); 
                            this.participationDate = response.participationDate;
                          }
                        });
             },
             error: error => Swal.fire({
                 title: '¡Error!',
                 text: error?.error.message,
                 icon: 'error',
                 confirmButtonText: 'Aceptar',
                 background: 'linear-gradient(135deg, #F95596, #FE7079)', 
                 color: 'white',
                 iconColor: 'white',
                 confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
               })
          });
      }
    });
  }

  nextSlide(): void {
    if (this.trip && this.trip.images && this.trip.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.trip.images.length;
    }
  }

  prevSlide(): void {
    if (this.trip && this.trip.images && this.trip.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.trip.images.length) % this.trip.images.length;
    }
  }

  onCancelParticipation(): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar participación',
            cancelButtonText: 'No, mantener',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        }).then((result) => {
            if (result.isConfirmed) {
                this.tripsService.deleteParticipation(this.id, this.authService.username, this.participationDate!).subscribe({
                    next: (deletedParticipation) => {
                        Swal.fire({
                            title: "¡Participación Cancelada!",
                            text: "Tu participación ha sido eliminada.",
                            icon: 'info',
                            background: 'linear-gradient(135deg, #F95596, #FE7079)',
                            color: 'white',
                            iconColor: 'white',
                            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                        });
                        this.hasParticipated = false;
                          if (this.trip?.participations) {
                            this.trip.participations = this.trip.participations.filter(
                              p => p.username !== this.authService.username
                            );
                          } 

                    },
                        error: error => {
                        Swal.fire({
                            title: '¡Error!',
                            text: error?.error?.message || 'No se pudo cancelar la participación.',
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
        });
    }

  isTripInThePast(): boolean {
    if (!this.trip?.startDate) {
      return false;
    }
    const startDate = new Date(this.trip.startDate);
    const now = new Date();
    return startDate.getTime() <= now.getTime();
  }

  isTripFinished(): boolean {
    if (!this.trip?.endDate) {
      return false;
    }
    const endDate = new Date(this.trip.endDate);
    const now = new Date();
    return endDate.getTime() < now.getTime();
  }

  getNumberOfDays(): number {
    if (!this.trip?.startDate || !this.trip?.endDate) return 0; 
    const msPerDay = 86400000;
    const days = Math.floor((new Date(this.trip.endDate).getTime() - new Date(this.trip.startDate).getTime()) / msPerDay) + 1;
    return days > 0 ? days : 0;
  }

    loadOrganizerStats(): void {
    this.tripsService.getOrganizerStats(this.trip!.organizerUsername).subscribe({
      next: data => this.stats = data,
      error: err => console.error('Error cargando stats', err)
    });
  }

generateStars(): void {
  this.starArray = [];
  const fullStars = Math.floor(this.averageRating);
  const halfStar = (this.averageRating - fullStars) >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) this.starArray.push('full');
  if (halfStar) this.starArray.push('half');
  for (let i = 0; i < emptyStars; i++) this.starArray.push('empty');
}


}