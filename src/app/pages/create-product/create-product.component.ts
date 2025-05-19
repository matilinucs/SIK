import { Component, OnInit, ViewChild, ComponentFactoryResolver, ViewContainerRef, ApplicationRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

import { Product3 } from '../../models/product.model';
import { ProductsTableComponent } from '../../components/products-table/products-table.component';
import { ProductFormComponent } from '../../components/product-form/product-form.component';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ProductsTableComponent, // Necesario si se usa en el template
    ProductFormComponent    // Necesario si se usa en el template
  ],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.scss']
})
export class CreateProductComponent implements OnInit {
  isFullScreenTable: boolean = false;
  products: Product3[] = [];
  selectedProduct: Product3 | null = null;

  @ViewChild('productFormContainer', { read: ViewContainerRef, static: false }) productFormContainer?: ViewContainerRef;
  @ViewChild(ProductFormComponent) productFormComponentInstance?: ProductFormComponent;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    this.products = this.getDemoProducts(); // Carga inicial de productos
  }

  /**
   * Carga o actualiza la lista de productos.
   * Actualmente, si no se provee una nueva lista, simplemente refresca la vista
   * con los productos existentes en memoria.
   * Si se quisiera conectar a un backend, aquí se haría la llamada al servicio.
   * @param newProducts Opcional. Nueva lista de productos para reemplazar la actual.
   */
  loadProducts(newProducts?: Product3[]): void {
    if (newProducts) {
      this.products = newProducts;
    }
    // Para forzar la detección de cambios en la tabla si la referencia del array no cambia
    this.products = [...this.products]; 
  }

  toggleView(): void {
    this.isFullScreenTable = !this.isFullScreenTable;
    if (!this.isFullScreenTable && this.selectedProduct) {
      setTimeout(() => {
        if (this.productFormComponentInstance) {
          this.productFormComponentInstance.editProduct(this.selectedProduct!);
        }
      });
    } else if (this.isFullScreenTable) {
      this.selectedProduct = null;
      if (this.productFormComponentInstance) {
         this.productFormComponentInstance.resetForm();
      }
    }
  }

  handleProductSelect(product: Product3): void {
    this.selectedProduct = {...product};
    if (this.isFullScreenTable) {
      this.openProductFormModal(this.selectedProduct);
    } else {
      if (this.productFormComponentInstance) {
        this.productFormComponentInstance.editProduct(this.selectedProduct);
      }
    }
  }

  handleProductAdd(): void {
    this.selectedProduct = null;
    if (this.isFullScreenTable) {
      this.openProductFormModal(null);
    } else {
      if (this.productFormComponentInstance) {
        this.productFormComponentInstance.resetForm();
        this.productFormComponentInstance.productForm.enable();
      }
    }
  }

  handleProductSave(product: Product3): void {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index > -1) {
      this.products[index] = product;
    } else {
      this.products.push(product);
    }
    this.loadProducts(); // Recarga/refresca la tabla con la lista actualizada
    this.selectedProduct = null;
    if (Swal.isVisible()) {
      Swal.close();
    }
    if (this.productFormComponentInstance && !this.isFullScreenTable) {
      this.productFormComponentInstance.resetForm();
    }
  }

  /**
   * Maneja la eliminación de un producto.
   * Encuentra el producto en la lista y lo elimina.
   * Luego actualiza la tabla.
   * @param productToDelete El producto a eliminar.
   */
  handleProductDelete(productToDelete: Product3): void {
    this.products = this.products.filter(p => p.id !== productToDelete.id);
    this.loadProducts(); // Recarga/refresca la tabla
    this.selectedProduct = null; // Deselecciona si estaba seleccionado
     if (this.productFormComponentInstance && !this.isFullScreenTable) {
        this.productFormComponentInstance.resetForm(); // Resetea el formulario si está visible
    }
  }

  handleCancelEdit(): void {
    this.selectedProduct = null;
    if (Swal.isVisible()) {
      Swal.close();
    }
    if (this.productFormComponentInstance && !this.isFullScreenTable) {
        this.productFormComponentInstance.resetForm();
    }
  }

  private openProductFormModal(product: Product3 | null): void {
    const swalContainer = document.createElement('div');

    Swal.fire({
      title: product ? 'Editar Producto' : 'Agregar Producto',
      html: swalContainer,
      showConfirmButton: false,
      showCancelButton: false,
      width: '800px',
      didOpen: () => {
        const factory = this.componentFactoryResolver.resolveComponentFactory(ProductFormComponent);
        const componentRef = factory.create(this.injector, [], swalContainer);
        this.appRef.attachView(componentRef.hostView);

        if (product) {
          componentRef.instance.editProduct({...product});
        } else {
          componentRef.instance.resetForm();
          componentRef.instance.productForm.enable();
        }

        const saveSub = componentRef.instance.saveProduct.subscribe((savedProduct: Product3) => {
          this.handleProductSave(savedProduct);
          saveSub.unsubscribe();
          cancelSub.unsubscribe();
          this.appRef.detachView(componentRef.hostView);
          componentRef.destroy();
        });
        const cancelSub = componentRef.instance.cancelEdit.subscribe(() => {
          this.handleCancelEdit();
          cancelSub.unsubscribe();
          saveSub.unsubscribe();
          this.appRef.detachView(componentRef.hostView);
          componentRef.destroy();
        });
      },
      willClose: () => {
        // Implementar limpieza si es necesario
      }
    });
  }

  private getDemoProducts(): Product3[] {
    return [
      { id: '1', productCode: 'VENT-001', type: 'Ventana Corrediza', quantity: 10, totalArea: 1.8, budget: 1200.50, description: 'Vidrio templado', dimensions: { width: 1200, height: 1500, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, glass: { type: 'Templado', thickness: '6mm', protection: 'Ninguna'} },
      { id: '2', productCode: 'PUER-002', type: 'Puerta Abatible', quantity: 5, totalArea: 1.89, budget: 950.75, description: 'Cerradura de seguridad', dimensions: { width: 900, height: 2100, length: 70, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A30', color: 'Negro'}, glass: { type: 'Laminado', thickness: '3+3mm', protection: 'UV'} },
      { id: '3', productCode: 'FIJO-003', type: 'Paño Fijo', quantity: 8, totalArea: 0.48, budget: 350.00, description: 'Para baño', dimensions: { width: 600, height: 800, length: 0, unit: 'mm'}, material: { type: 'PVC', profile: 'P50', color: 'Blanco'} },
      { id: '4', productCode: 'VENT-004', type: 'Ventana Proyectante', quantity: 6, totalArea: 2.1, budget: 1400.00, description: 'Ventana con apertura exterior', dimensions: { width: 1000, height: 1200, length: 60, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A40', color: 'Gris'}, glass: { type: 'Doble', thickness: '4+16+4', protection: 'Bajo-E'} },
      { id: '5', productCode: 'PUER-005', type: 'Puerta Corrediza', quantity: 3, totalArea: 2.5, budget: 1800.00, description: 'Puerta de terraza', dimensions: { width: 1500, height: 2100, length: 80, unit: 'mm'}, material: { type: 'PVC', profile: 'P80', color: 'Blanco'}, glass: { type: 'Templado', thickness: '8mm', protection: 'UV'} },
      { id: '6', productCode: 'VENT-006', type: 'Ventana Oscilobatiente', quantity: 4, totalArea: 1.2, budget: 900.00, description: 'Aislamiento acústico', dimensions: { width: 800, height: 1200, length: 60, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A50', color: 'Negro'}, glass: { type: 'Laminado', thickness: '3+0,38+3', protection: 'Ninguna'} },
      { id: '7', productCode: 'FIJO-007', type: 'Paño Fijo', quantity: 7, totalArea: 0.7, budget: 400.00, description: 'Fijo lateral', dimensions: { width: 500, height: 1000, length: 0, unit: 'mm'}, material: { type: 'PVC', profile: 'P50', color: 'Blanco'} },
      { id: '8', productCode: 'VENT-008', type: 'Ventana Corrediza', quantity: 12, totalArea: 2.4, budget: 1600.00, description: 'Vidrio doble', dimensions: { width: 1200, height: 1200, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, glass: { type: 'Doble', thickness: '4+16+4', protection: 'Bajo-E'} },
      { id: '9', productCode: 'PUER-009', type: 'Puerta Abatible', quantity: 2, totalArea: 1.7, budget: 1100.00, description: 'Puerta principal', dimensions: { width: 1000, height: 2100, length: 70, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A30', color: 'Negro'}, glass: { type: 'Templado', thickness: '6mm', protection: 'UV'} },
      { id: '10', productCode: 'VENT-010', type: 'Ventana Proyectante', quantity: 5, totalArea: 1.5, budget: 950.00, description: 'Ventana baño', dimensions: { width: 700, height: 900, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, glass: { type: 'Laminado', thickness: '3+3mm', protection: 'Ninguna'} },
      { id: '11', productCode: 'VENT-011', type: 'Ventana Corrediza', quantity: 9, totalArea: 2.0, budget: 1300.00, description: 'Ventana dormitorio', dimensions: { width: 1100, height: 1300, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, glass: { type: 'Templado', thickness: '6mm', protection: 'Ninguna'} },
      { id: '12', productCode: 'PUER-012', type: 'Puerta Corrediza', quantity: 4, totalArea: 2.2, budget: 1700.00, description: 'Puerta balcón', dimensions: { width: 1400, height: 2100, length: 80, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A80', color: 'Gris'}, glass: { type: 'Doble', thickness: '4+16+4', protection: 'Bajo-E'} },
      { id: '13', productCode: 'VENT-013', type: 'Ventana Oscilobatiente', quantity: 3, totalArea: 1.1, budget: 800.00, description: 'Ventana cocina', dimensions: { width: 900, height: 900, length: 60, unit: 'mm'}, material: { type: 'Aluminio', profile: ' A50', color: 'Negro'}, glass: { type: 'Laminado', thickness: '3+0,38+3', protection: 'Ninguna'} },
      { id: '14', productCode: 'FIJO-014', type: 'Paño Fijo', quantity: 6, totalArea: 0.6, budget: 350.00, description: 'Fijo escalera', dimensions: { width: 400, height: 900, length: 0, unit: 'mm'}, material: { type: 'PVC', profile: 'P50', color: 'Blanco'} },
      { id: '15', productCode: 'VENT-015', type: 'Ventana Corrediza', quantity: 11, totalArea: 2.3, budget: 1500.00, description: 'Ventana sala', dimensions: { width: 1300, height: 1200, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: 'P70', color: 'Blanco'}, glass: { type: 'Templado', thickness: '6mm', protection: 'Ninguna'} },
      { id: '16', productCode: 'PUER-016', type: 'Puerta Abatible', quantity: 3, totalArea: 1.6, budget: 1000.00, description: 'Puerta interior', dimensions: { width: 800, height: 2000, length: 70, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A30', color: 'Negro'}, glass: { type: 'Laminado', thickness: '3+3mm', protection: 'UV'} },
      { id: '17', productCode: 'VENT-017', type: 'Ventana Proyectante', quantity: 7, totalArea: 2.0, budget: 1200.00, description: 'Ventana estudio', dimensions: { width: 1000, height: 1100, length: 60, unit: 'mm'}, material: { type: 'Aluminio', profile: 'A40', color: 'Gris'}, glass: { type: 'Doble', thickness: '4+16+4', protection: 'Bajo-E'} },
      { id: '18', productCode: 'FIJO-018', type: 'Paño Fijo', quantity: 5, totalArea: 0.5, budget: 300.00, description: 'Fijo pasillo', dimensions: { width: 300, height: 800, length: 0, unit: 'mm'}, material: { type: 'PVC', profile: 'P50', color: 'Blanco'} },
      { id: '19', productCode: 'VENT-019', type: 'Ventana Oscilobatiente', quantity: 2, totalArea: 0.8, budget: 600.00, description: 'Ventana baño', dimensions: { width: 700, height: 800, length: 60, unit: 'mm'}, material: { type: 'Aluminio', profile: ' A50', color: 'Negro'}, glass: { type: 'Laminado', thickness: '3+0,38+3', protection: 'Ninguna'} },
      { id: '20', productCode: 'VENT-020', type: 'Ventana Corrediza', quantity: 10, totalArea: 2.1, budget: 1400.00, description: 'Ventana principal', dimensions: { width: 1200, height: 1300, length: 50, unit: 'mm'}, material: { type: 'PVC', profile: ' P70', color: 'Blanco'}, glass: { type: 'Templado', thickness: '6mm', protection: 'Ninguna'} }
    ];
  }
}
