import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { RegisterComponent } from '../auth/register/register.component';
import { AdministrationComponent } from './administration/administration.component';
import { TableTripsComponent } from './tables/table-trips/table-trips.component';
import { TableUsersComponent } from './tables/table-users/table-users.component';
import { loginGuard } from '../shared/guards/login.guard';
import { roleGuard } from '../shared/guards/role.guard';
//import { RegisterComponent } from '../auth/register/register.component';
//import { FormTripComponent } from '../trips/pages/form-trip/form-trip.component';

const routes: Routes = [
  {
    path: '',
    component: AdministrationComponent,
    children: [
      {
        path: 'trips',
        component: TableTripsComponent
      },
      {
        path: 'users',
        component: TableUsersComponent
      },
      {
        path: 'create-trip',
        loadChildren: () => import('../trips/trips.module').then(m => m.TripsModule)
      },
      {
        path: 'create-user',
        loadChildren: () => import('../auth/auth.module').then(m => m.AuthModule)
      },
  // { path: 'create-user', component: RegisterComponent, canMatch: [loginGuard, roleGuard], data: { roles: ['admin'] } },
      {
        path: '',
        redirectTo: 'trips',
        pathMatch: 'full'
      },
    ]
  },
  /*{
    path: 'usuarios',
    loadChildren: () => import('../auth/auth.module').then(m => m.AuthModule)
  },*/

 /* {
    path: 'usuarios',
    children: [
      {
        path: 'create',
        component: RegisterComponent
      }
    ]
  },*/
    // { path: '', loadChildren: () => import('../trips/trips.module').then(m => m.TripsModule) },
  //   { path: 'create-trip', redirectTo: '/create-trip', pathMatch: 'full' },
  /*{
        path: 'create-trip',
        component: FormTripComponent
  },*/
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
