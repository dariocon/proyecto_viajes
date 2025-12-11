import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TripsRoutingModule } from './trips-routing.module';

//import { TripsListComponent } from './pages/trips-list/trips-list.component';
import { TripDetailComponent } from './pages/trip-detail/trip-detail.component';
import { FormTripComponent } from './pages/form-trip/form-trip.component';
import { MyTripsListComponent } from './pages/my-trips-list/my-trips-list.component';
import { TripParticipantsComponent } from './pages/trip-participants/trip-participants.component';
import { TripRatingComponent } from './pages/trip-ratings/trip-ratings.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    TripDetailComponent,
    FormTripComponent,
    MyTripsListComponent,
    TripParticipantsComponent,
    TripRatingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TripsRoutingModule
  ]
})
export class TripsModule { }