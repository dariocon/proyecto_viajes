export interface TripAdd {
  organizerUsername: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;   
  destination: string;
  categoryId: number;
  maxCapacity?: number;
  estimatedBudget?: number;
  itineraryActivities?: ItineraryActivity[];
}

export interface ItineraryActivity {
  date: string;      
  time?: string;     
  activity: string;
  location?: string;
}

export interface TripDto {
  idTrip: number;
  organizerUsername: string;
  title: string;
  description: string;
  startDate: string; 
  endDate: string; 
  destination: string;
  categoryId: number;
  maxCapacity: number;
  estimatedBudget: number;
  itineraryActivities: any[]; 
  images: string[]; 
  participations: any[]
}


