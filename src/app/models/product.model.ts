export interface Product3 {
  id: string; // Cambiado de number a string
  productCode: string;
  type: string;
  quantity: number;
  totalArea: number;
  budget: number;
  description: string;
  dimensions: {
    width: number;
    height: number;
    length: number;
    unit: string;
  };  material: {
    type: string;
    profile: string;
    color: string;
  };
  glass?: {
    type: string;
    thickness: string;
    protection: string;
  };
}
