import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TripsService } from '../../../_services/trips.service'; 
import { TripDto } from '../../../_interfaces/trip';

export const tripResolver: ResolveFn<TripDto> = (
  //Usado para facilitar la animación visual de view transition en la selección del viaje
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const tripsService = inject(TripsService);
  const id = Number(route.paramMap.get('id')); 
  
  return tripsService.getTripById(id);
};