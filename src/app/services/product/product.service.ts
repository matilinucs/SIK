import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product3 } from '../../models/product.model';

// Tipos para mejorar la legibilidad y tipado
export interface IDimensions {
  width: number;
  height: number;
  length: number;
  unit: string;
}

export interface IMaterial {
  type: string;
  profile: string;
  color: string;
}

export interface IGlass {
  type: string;
  thickness: string;
  protection: string;
}

// Factores de conversión para dimensiones
const DIMENSION_UNIT_FACTORS: Record<string, number> = {
  'mm': 1000,
  'cm': 100,
  'm': 1
};

/**
 * Servicio central para la gestión de productos
 * Implementa el patrón Observer para notificar cambios en la lista de productos
 * y aplica operaciones inmutables para prevenir efectos secundarios
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Sujeto privado para almacenar los productos en memoria
  private readonly productsSubject = new BehaviorSubject<Product3[]>([]);
  
  // Observable público para que los componentes se suscriban a cambios
  public readonly products$: Observable<Product3[]> = this.productsSubject.asObservable();
  
  constructor() {
    this.loadDemoProducts();
  }

  // MÉTODOS PÚBLICOS DE ACCESO A DATOS

  /**
   * Obtiene la lista actual de productos
   * @returns Copia inmutable del array de productos
   */
  getProducts(): Product3[] {
    return [...this.productsSubject.getValue()];
  }

  /**
   * Establece una nueva lista de productos
   * @param products Nueva lista de productos
   */
  setProducts(products: Product3[]): void {
    this.productsSubject.next([...products]);
  }

  /**
   * Agrega un nuevo producto o actualiza uno existente
   * @param product El producto a guardar o actualizar
   * @returns Copia inmutable del producto guardado
   */
  saveProduct(product: Product3): Product3 {
    // Validación básica
    if (!product) {
      throw new Error('El producto no puede ser nulo o indefinido');
    }
    
    const products = this.getProducts();
    const productToSave = this.prepareProductForSave(product);
    
    // Actualizar o agregar según exista o no
    const updatedProducts = productToSave.id 
      ? products.map(p => p.id === productToSave.id ? productToSave : p)
      : [...products, productToSave];
    
    this.productsSubject.next(updatedProducts);
    return { ...productToSave }; // Devolver copia para prevenir mutaciones
  }

  /**
   * Elimina un producto de la lista
   * @param productId ID del producto a eliminar
   * @returns Booleano indicando si la operación fue exitosa
   */
  deleteProduct(productId: string): boolean {
    if (!productId) {
      throw new Error('El ID del producto no puede ser nulo o indefinido');
    }
    
    const products = this.getProducts();
    const filteredProducts = products.filter(p => p.id !== productId);
    
    if (filteredProducts.length !== products.length) {
      this.productsSubject.next(filteredProducts);
      return true;
    }
    
    return false;
  }

  /**
   * Busca un producto en la lista por su ID
   * @param productId ID del producto a buscar
   * @returns El producto encontrado o null
   */
  getProductById(productId: string): Product3 | null {
    if (!productId) return null;
    
    const product = this.getProducts().find(p => p.id === productId);
    return product ? { ...product } : null; // Devolver copia para prevenir mutaciones
  }

  /**
   * Aplica cambios a múltiples productos seleccionados (unificación)
   * @param productIds Lista de IDs de productos a modificar
   * @param modifiedFields Campos a modificar con sus nuevos valores
   * @returns Lista de productos actualizados
   */
  unifyProducts(productIds: string[], modifiedFields: Record<string, any>): Product3[] {
    if (!productIds?.length || !modifiedFields) {
      throw new Error('Se requieren IDs de productos y campos a modificar');
    }
    
    const products = this.getProducts();
    const productsToUpdate = products.filter(p => productIds.includes(p.id));
    
    if (!productsToUpdate.length) return [];
    
    // Crear copias profundas y aplicar cambios
    const updatedProducts = productsToUpdate.map(product => {
      const productCopy = this.cloneProduct(product);
      
      Object.keys(modifiedFields).forEach(fieldPath => {
        this.mapFieldToProduct(productCopy, fieldPath, modifiedFields[fieldPath]);
      });
      
      return productCopy;
    });
    
    // Actualizar la lista completa preservando inmutabilidad
    const updatedFullList = products.map(p => {
      const updated = updatedProducts.find(up => up.id === p.id);
      return updated || { ...p };
    });
    
    this.productsSubject.next(updatedFullList);
    return [...updatedProducts]; // Devolver copia para prevenir mutaciones
  }

  /**
   * Recalcula el área total de un producto basado en sus dimensiones
   * @param product Producto del cual recalcular el área
   * @returns Área calculada en metros cuadrados
   */
  recalculateArea(product: Product3): number {
    if (!product?.dimensions) return 0;
    
    const { width = 0, height = 0, unit = 'mm' } = product.dimensions;
    
    // Convertir a metros según la unidad
    const factor = DIMENSION_UNIT_FACTORS[unit] || 1000;
    const widthInMeters = width / factor;
    const heightInMeters = height / factor;
    
    // Calcular y asignar el área con precisión de 3 decimales
    const area = parseFloat((widthInMeters * heightInMeters).toFixed(3));
    product.totalArea = area;
    return area;
  }

  // MÉTODOS PRIVADOS DE UTILIDAD

  /**
   * Prepara un producto para ser guardado, asegurando que tenga todos los campos necesarios
   */
  private prepareProductForSave(product: Product3): Product3 {
    const preparedProduct = { ...product };
    
    // Asignar ID si no tiene
    if (!preparedProduct.id) {
      preparedProduct.id = this.generateProductId();
    }
    
    // Recalcular área siempre antes de guardar
    this.recalculateArea(preparedProduct);
    
    // Asegurar que las estructuras anidadas existan
    this.ensureObjectStructure(preparedProduct);
    
    return preparedProduct;
  }

  /**
   * Asegura que todas las estructuras de objetos anidados existan para evitar errores null
   */
  private ensureObjectStructure(product: Product3): void {
    if (!product.dimensions) {
      product.dimensions = { width: 0, height: 0, length: 0, unit: 'mm' };
    }
    
    if (!product.material) {
      product.material = { type: '', profile: '', color: '' };
    }
    
    if (!product.glass) {
      product.glass = { type: '', thickness: '', protection: '' };
    }
  }

  /**
   * Crea una copia profunda de un producto
   */
  private cloneProduct(product: Product3): Product3 {
    return JSON.parse(JSON.stringify(product));
  }

  /**
   * Mapea un campo de formulario a la propiedad correspondiente del modelo Product3
   */
  private mapFieldToProduct(product: Product3, fieldPath: string, value: any): void {
    // Usar un objeto para mapear los prefijos a sus manejadores
    const pathHandlers: Record<string, (product: Product3, path: string, value: any) => void> = {
      'generalData.': this.mapGeneralDataField.bind(this),
      'technicalSpecs.': this.mapTechnicalSpecsField.bind(this),
      'costs.': this.mapCostsField.bind(this)
    };
    
    // Buscar el manejador adecuado según el prefijo
    for (const [prefix, handler] of Object.entries(pathHandlers)) {
      if (fieldPath.startsWith(prefix)) {
        handler(product, fieldPath.substring(prefix.length), value);
        return;
      }
    }
    
    // Campos directos (sin prefijo)
    if (fieldPath === 'description') {
      product.description = value;
    }
  }

  /**
   * Mapea los campos de datos generales del producto
   */
  private mapGeneralDataField(product: Product3, fieldPath: string, value: any): void {
    // Usar un objeto para mapeo directo de campos
    const directMappings: Record<string, (val: any) => void> = {
      'productType': (val) => { product.type = val; },
      'productCode': (val) => { product.productCode = val; },
      'description': (val) => { product.description = val; }
    };
    
    // Manejar mapeo directo si existe
    if (directMappings[fieldPath]) {
      directMappings[fieldPath](value);
      return;
    }
    
    // Manejo especial para quantity (afecta budget)
    if (fieldPath === 'quantity') {
      const newQuantity = parseInt(value);
      product.quantity = newQuantity;
      
      // Actualizar presupuesto si existe
      if (product.budget) {
        const unitPrice = product.budget / (product.quantity || 1);
        product.budget = parseFloat((unitPrice * newQuantity).toFixed(2));
      }
      return;
    }
    
    // Manejo de dimensiones
    if (fieldPath.startsWith('dimensions.')) {
      this.mapDimensionsField(product, fieldPath.substring('dimensions.'.length), value);
    }
  }

  /**
   * Mapea los campos de dimensiones del producto
   */
  private mapDimensionsField(product: Product3, fieldPath: string, value: any): void {
    // Inicializar dimensiones si no existen
    if (!product.dimensions) {
      product.dimensions = { width: 0, height: 0, length: 0, unit: 'mm' };
    }
    
    // Mapeo directo mediante objeto
    const fieldToProperty: Record<string, keyof IDimensions> = {
      'width': 'width',
      'height': 'height',
      'length': 'length',
      'unit': 'unit'
    };
    
    // Si es un campo numérico, parsearlo
    if (fieldPath === 'width' || fieldPath === 'height' || fieldPath === 'length') {
      product.dimensions[fieldToProperty[fieldPath] as 'width' | 'height' | 'length'] = parseFloat(value);
    } else if (fieldPath === 'unit') {
      product.dimensions.unit = value;
    }
    
    // Recalcular área si cambia ancho, alto o unidad
    if (fieldPath === 'width' || fieldPath === 'height' || fieldPath === 'unit') {
      this.recalculateArea(product);
    }
  }

  /**
   * Mapea los campos de especificaciones técnicas del producto
   */
  private mapTechnicalSpecsField(product: Product3, fieldPath: string, value: any): void {
    if (fieldPath.startsWith('material.')) {
      this.mapMaterialField(product, fieldPath.substring('material.'.length), value);
    } else if (fieldPath.startsWith('glass.')) {
      this.mapGlassField(product, fieldPath.substring('glass.'.length), value);
    }
  }

  /**
   * Mapea los campos de material del producto
   */
  private mapMaterialField(product: Product3, fieldPath: string, value: any): void {
    if (!product.material) {
      product.material = { type: '', profile: '', color: '' };
    }
    
    // Usar tipado para evitar errores
    const validFields: Array<keyof IMaterial> = ['type', 'profile', 'color'];
    if (validFields.includes(fieldPath as keyof IMaterial)) {
      product.material[fieldPath as keyof IMaterial] = value;
    }
  }

  /**
   * Mapea los campos de vidrio del producto
   */
  private mapGlassField(product: Product3, fieldPath: string, value: any): void {
    if (!product.glass) {
      product.glass = { type: '', thickness: '', protection: '' };
    }
    
    const validFields: Array<keyof IGlass> = ['type', 'thickness', 'protection'];
    if (validFields.includes(fieldPath as keyof IGlass)) {
      product.glass[fieldPath as keyof IGlass] = value;
    }
  }

  /**
   * Mapea los campos de costos del producto
   */
  private mapCostsField(product: Product3, fieldPath: string, value: any): void {
    if (fieldPath === 'unitPrice') {
      const unitPrice = parseFloat(value);
      product.budget = parseFloat((unitPrice * product.quantity).toFixed(2));
    } else if (fieldPath === 'totalArea') {
      product.totalArea = parseFloat(value);
    }
  }

  /**
   * Genera un ID único para un nuevo producto con formato consistente
   */
  private generateProductId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PRD-${timestamp}-${random}`;
  }

  /**
   * Carga productos de demostración
   * En producción, esto se reemplazaría por una llamada a una API
   */
  private loadDemoProducts(): void {
    const demoProducts: Product3[] = [
      { 
        id: '1', 
        productCode: 'VENT-001', 
        type: 'Ventana Corrediza', 
        quantity: 10, 
        totalArea: 1.8, 
        budget: 1200.50, 
        description: 'Vidrio templado', 
        dimensions: { width: 1200, height: 1500, length: 50, unit: 'mm'}, 
        material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, 
        glass: { type: 'Templado', thickness: '6mm', protection: 'UV' } 
      },
      { 
        id: '2', 
        productCode: 'PUER-002', 
        type: 'Puerta Abatible', 
        quantity: 5, 
        totalArea: 1.89, 
        budget: 950.75, 
        description: 'Cerradura de seguridad', 
        dimensions: { width: 900, height: 2100, length: 70, unit: 'mm'}, 
        material: { type: 'Aluminio', profile: 'A30', color: 'Negro'}, 
        glass: { type: 'Laminado', thickness: '8mm', protection: 'Térmica' } 
      },
      { 
        id: '3', 
        productCode: 'FIJO-003', 
        type: 'Paño Fijo', 
        quantity: 8, 
        totalArea: 0.48, 
        budget: 350.00, 
        description: 'Para baño', 
        dimensions: { width: 600, height: 800, length: 0, unit: 'mm'}, 
        material: { type: 'PVC', profile: 'P50', color: 'Blanco'} 
      },
      { 
        id: '4', 
        productCode: 'VENT-004', 
        type: 'Ventana Proyectante', 
        quantity: 6, 
        totalArea: 2.1, 
        budget: 1400.00, 
        description: 'Ventana con apertura exterior', 
        dimensions: { width: 1000, height: 1200, length: 60, unit: 'mm'}, 
        material: { type: 'Aluminio', profile: 'A40', color: 'Gris'}, 
        glass: { type: 'Doble', thickness: '10mm', protection: 'Acústica' } 
      },
      { 
        id: '5', 
        productCode: 'PUER-005', 
        type: 'Puerta Corrediza', 
        quantity: 3, 
        totalArea: 2.5, 
        budget: 1800.00, 
        description: 'Puerta de terraza', 
        dimensions: { width: 1500, height: 2100, length: 80, unit: 'mm'}, 
        material: { type: 'PVC', profile: 'P80', color: 'Blanco'}, 
        glass: { type: 'Templado', thickness: '10mm', protection: 'UV' } 
      }
    ];
    
    this.productsSubject.next(demoProducts);
  }
}
