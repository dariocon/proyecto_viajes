import { NgModule } from '@angular/core';
import { RouterModule, Routes,withComponentInputBinding  } from '@angular/router';

import { OrganizerProfileComponent } from './organizer-profile.component';
import { OrganizerTripsComponent } from './lists/organizer-trips/organizer-trips.component';
import { OrganizerReviewsComponent } from './lists/organizer-reviews/organizer-reviews.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizerProfileRoutingModule { }
