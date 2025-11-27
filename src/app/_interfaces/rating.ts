export interface RatingDtoAdd {
  tripId: number;
  username: string;
  rating: number;       
  comment?: string;
  submissionDate?: string; // Opcional, el backend puede asignarlo
}

export interface RatingDto {
  ratingId: number;     
  tripId: number;
  username: string;
  rating: number;
  comment?: string;
  submissionDate: string;
  likes: number;
  tripTitle: string;
}

export interface RatingPageResponse {
  content: RatingDto[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
