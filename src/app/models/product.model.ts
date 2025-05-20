export interface Product3 {
  id: string;
  productCode: string;
  type: string; // Corresponde a generalData.productType
  quantity: number;
  totalArea: number; // Calculado
  budget: number; // Calculado a partir de costs.unitPrice y quantity
  description: string;
  dimensions: {
    width: number;
    height: number;
    length: number; // Añadido
    unit: string;
  };
  material: {
    type: string;
    profile: string;
    color: string;
    customColor?: string | null; // Añadido
  };
  glass?: {
    type: string;
    thickness: string;
    protection: string;
  };
  opening?: { // Añadido
    system: string;
    handle: string;
  };
  installation?: { // Añadido
    climateResistance: string;
    regulation: string;
  };
  additionalFeatures?: Array<{ name: string; value: string }>; // Añadido
  plans?: { // Añadido
    technicalPlan?: string | File | null; // Puede ser string (URL/path) o File
    clientApproved?: boolean;
  };
  productImage?: string | null; // Para la URL o path de la imagen
  creationDate?: Date | null;
  lastModified?: Date | null;

  // Campos adicionales que estaban causando errores, ahora definidos:
  status?: string;
  version?: number;
  project?: string | null; // Asumiendo que es un ID o nombre de proyecto
  supplier?: string | null; // Asumiendo que es un ID o nombre de proveedor
  category?: string;
  tags?: string[];
  notes?: string | null;
  attachments?: Array<{ name: string; url: string; type?: string }>; // Array de objetos con nombre y URL
  relatedProducts?: string[]; // Array de IDs de productos relacionados
  purchaseHistory?: Array<{ date: Date; price: number; supplier: string }>;

  stock?: {
    quantity: number;
    location: string;
  };
  leadTime?: number; // en días, por ejemplo
  priority?: string; // Ej: Baja, Media, Alta
  assignedTo?: string | null; // ID o nombre de usuario
  client?: string | null; // ID o nombre de cliente
  currency?: string; // Ej: USD, MXN
  tax?: number | { type: string; rate: number }; // Puede ser un número (tasa) o un objeto más complejo
  discount?: number | { type: string; amount?: number; percentage?: number }; // Puede ser un número (porcentaje) o un objeto
  shippingCost?: number;
  finalPrice?: number; // Calculado: budget + tax - discount + shipping
  paymentTerms?: string;
  warranty?: string; // Ej: "1 año", "Limitada"
  certifications?: string[];
  environmentalImpact?: {
    co2Emissions?: string;
    recyclability?: string;
  } | null;
  assemblyInstructions?: string | null; // URL o path al documento
  maintenanceGuide?: string | null; // URL o path al documento
  customFields?: { [key: string]: any };
  location?: { // Corresponde a generalData.locations
    roomType: string;
    housingType: string;
    customName: string;
  };
}
