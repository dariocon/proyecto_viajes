export interface SelectedImageFile extends File {
    previewUrl: string; // urll temporal generada por FileReader
}

export interface imageDto {
    imageUrl: string,
    isCover: boolean,
    id: number 
}

