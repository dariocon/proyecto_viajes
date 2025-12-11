import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizerProfileComponent } from './organizer-profile.component';
import { OrganizerTripsComponent } from './lists/organizer-trips/organizer-trips.component';
import { OrganizerReviewsComponent } from './lists/organizer-reviews/organizer-reviews.component';
import { OrganizerProfileRoutingModule } from './organizer-profile-routing.module';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    OrganizerReviewsComponent,
    OrganizerTripsComponent,
    OrganizerProfileComponent
  ],
  imports: [
    CommonModule,
     RouterModule, 
    OrganizerProfileRoutingModule,

  ]
})
export class OrganizerProfileModule { }
