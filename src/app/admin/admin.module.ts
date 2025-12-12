import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdministrationComponent } from './administration/administration.component';
import { TableTripsComponent } from './tables/table-trips/table-trips.component';
import { TableUsersComponent } from './tables/table-users/table-users.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    AdministrationComponent, 
    TableTripsComponent, 
    TableUsersComponent,
     
  ],
  imports: [
    FormsModule, 
    CommonModule, 
    AdminRoutingModule
    
  ]
})
export class AdminModule { }
