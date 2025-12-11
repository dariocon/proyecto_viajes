import { Routes } from '@angular/router';
import { OrganizerProfileComponent } from './organizer-profile.component';
import { OrganizerTripsComponent } from './lists/organizer-trips/organizer-trips.component';
import { OrganizerReviewsComponent } from './lists/organizer-reviews/organizer-reviews.component';

export const ORGANIZER_ROUTES: Routes = [
  {
    path: ':organizerUsername',
    component: OrganizerProfileComponent,
    children: [
      { path: 'trips/:tripType', component: OrganizerTripsComponent },
      { path: 'reviews', component: OrganizerReviewsComponent },
      { path: '', redirectTo: 'trips/proximos', pathMatch: 'full' }
    ]
  }
];
