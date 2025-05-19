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
      { id: '3', productCode: 'FIJO-003', type: 'Paño Fijo', quantity: 8, totalArea: 0.48, budget: 350.00, description: 'Para baño', dimensions: { width: 600, height: 800, length: 0, unit: 'mm'}, material: { type: 'PVC', profile: 'P50', color: 'Blanco'} }
    ];
  }
}
