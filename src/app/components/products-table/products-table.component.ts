import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import * as XLSX from 'xlsx';

import { Product3 } from '../../models/product.model';

/**
 * Componente para mostrar y gestionar la tabla de productos
 * Incluye funcionalidades de exportación a Excel y cálculos de totales
 */
@Component({
  selector: 'app-products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatCheckboxModule
  ]
})
export class ProductsTableComponent {
  /**
   * Constructor del componente.
   */
  constructor(private fb: FormBuilder, private elementRef: ElementRef) {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      material: [''],
      minQuantity: [''],
      maxQuantity: [''],
      minBudget: [''],
      maxBudget: ['']
    });
    // Escuchar cambios en filtros y aplicar
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROPIEDADES DE ENTRADA (INPUTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Lista de productos a mostrar en la tabla.
   * Cuando se actualiza, también se actualiza el MatTableDataSource.
   * @param value Array de objetos Product3.
   */
  @Input() set products(value: Product3[]) {
    this._products = value;
    this.productsDataSource.data = value;
    this.updateFilterOptions();
    this.applyFilters(); // Aplica filtros al cargar productos
  }
  /**
   * Indica si la tabla se está mostrando en modo de pantalla completa.
   * Esto puede usarse para ajustar el comportamiento o la apariencia de la tabla.
   */
  @Input() isFullScreenMode: boolean = false;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROPIEDADES DE SALIDA (OUTPUTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Evento emitido cuando se solicita editar un producto.
   * Emite el objeto Product3 que se va a editar.
   */
  @Output() editProduct = new EventEmitter<Product3>();

  /**
   * Evento emitido cuando se solicita eliminar un producto.
   * Emite el objeto Product3 que se va a eliminar.
   */
  @Output() deleteProduct = new EventEmitter<Product3>();
  
  /**
   * Evento emitido cuando se solicita agregar un nuevo producto.
   * No emite datos, solo una señal para iniciar el proceso de adición.
   */
  @Output() addProduct = new EventEmitter<void>();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROPIEDADES INTERNAS DE LA TABLA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Columnas que se mostrarán en la tabla. El orden define el orden visual.
   */
  // Columns with selection
  displayedColumns: string[] = ['select', 'productCode', 'type', 'quantity', 'totalArea', 'budget', 'actions']; // 'select' added
  /**
   * IDs de productos fijados (para mantener el estado de fijado y mostrarlos al inicio)
   */
  pinnedProductIds: Set<string> = new Set();
  /**
   * IDs de productos seleccionados.
   */
  selectedProductIds: Set<string> = new Set(); // Added for selection

  /**
   * Fuente de datos para MatTable. Se inicializa con un array vacío.
   */
  productsDataSource = new MatTableDataSource<Product3>([]);
  
  /**
   * Almacenamiento interno de la lista de productos.
   */
  private _products: Product3[] = [];

  /**
   * Formulario reactivo para filtros avanzados de la tabla.
   * Permite filtrar por texto, tipo, material, cantidad, presupuesto, etc.
   */
  filterForm: FormGroup;

  /**
   * Lista de tipos únicos de productos para el filtro de tipo.
   */
  productTypes: string[] = [];
  /**
   * Lista de materiales únicos para el filtro de material.
   */
  productMaterials: string[] = [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MÉTODOS DE EXPORTACIÓN Y CÁLCULO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Exporta los datos de la tabla actual a un archivo Excel (.xlsx).
   * Utiliza la librería XLSX para generar el archivo.
   * Incluye campos relevantes del producto y formatea los anchos de columna.
   */
  exportToExcel(): void {
    // Prepara los datos para exportar, seleccionando y nombrando las columnas deseadas.
    const exportData = this._products.map(product => ({
      'Código': product.productCode,
      'Tipo': product.type,
      'Cantidad': product.quantity,
      'Área Total (m²)': product.totalArea,
      'Presupuesto': product.budget,
      'Descripción': product.description,
      'Material': product.material?.type, // Acceso seguro por si no existe material
      'Perfil': product.material?.profile,
      'Color': product.material?.color,
      'Dimensiones (Ancho)': product.dimensions?.width,
      'Dimensiones (Alto)': product.dimensions?.height,
      'Dimensiones (Profundidad)': product.dimensions?.length,
      'Unidad Dim.': product.dimensions?.unit,
      'Vidrio (Tipo)': product.glass?.type,
      'Vidrio (Espesor)': product.glass?.thickness,
      'Vidrio (Protección)': product.glass?.protection,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // Define anchos de columna aproximados (en caracteres)
    const columnWidths = [
      { wch: 15 }, // Código
      { wch: 20 }, // Tipo
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Área Total
      { wch: 15 }, // Presupuesto
      { wch: 30 }, // Descripción
      { wch: 15 }, // Material
      { wch: 15 }, // Perfil
      { wch: 15 }, // Color
      { wch: 15 }, // Ancho
      { wch: 15 }, // Alto
      { wch: 15 }, // Profundidad
      { wch: 10 }, // Unidad
      { wch: 15 }, // Vidrio Tipo
      { wch: 15 }, // Vidrio Espesor
      { wch: 20 }, // Vidrio Protección
    ];
    worksheet['!cols'] = columnWidths;

    const fileName = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Calcula la cantidad total de unidades de todos los productos en la tabla.
   * @returns Número total de productos.
   */
  getTotalProducts(): number {
    return this._products.reduce((total, product) => total + (product.quantity || 0), 0);
  }

  /**
   * Calcula el área total sumada de todos los productos en la tabla.
   * @returns Área total en la unidad base (ej. m²).
   */
  getTotalArea(): number {
    return this._products.reduce((total, product) => total + (product.totalArea || 0), 0);
  }

  /**
   * Calcula el presupuesto total sumado de todos los productos en la tabla.
   * @returns Presupuesto total.
   */
  getTotalBudget(): number {
    return this._products.reduce((total, product) => total + (product.budget || 0), 0);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MÉTODOS DE SELECCIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Comprueba si todos los productos filtrados están seleccionados.
   * @returns True si todos los productos visibles están seleccionados, false en caso contrario.
   */
  isAllSelected(): boolean {
    const numSelected = this.selectedProductIds.size;
    const numRows = this.productsDataSource.data.length; // Consider only filtered data
    return numSelected === numRows && numRows > 0;
  }

  /**
   * Selecciona o deselecciona todos los productos filtrados.
   * Si todos están seleccionados, los deselecciona. Si no, los selecciona todos.
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.productsDataSource.data.forEach(row => this.selectedProductIds.delete(row.id));
    } else {
      this.productsDataSource.data.forEach(row => this.selectedProductIds.add(row.id));
    }
  }

  /**
   * Comprueba si un producto específico está seleccionado.
   * @param product El producto a comprobar.
   * @returns True si el producto está seleccionado, false en caso contrario.
   */
  isRowSelected(product: Product3): boolean {
    return this.selectedProductIds.has(product.id);
  }

  /**
   * Maneja el cambio de estado de un checkbox de fila.
   * Agrega o elimina el ID del producto del conjunto de seleccionados.
   * @param event El evento de cambio del checkbox.
   * @param product El producto asociado a la fila.
   */
  onRowCheckboxChange(event: MatCheckboxChange, product: Product3): void {
    // event.stopPropagation(); // This was causing an error, stopPropagation is handled in the template
    if (event.checked) {
      this.selectedProductIds.add(product.id);
    } else {
      this.selectedProductIds.delete(product.id);
    }
  }
  
  /**
   * Limpia la selección actual de productos.
   */
  clearSelection(): void {
    if (this.selectedProductIds.size > 0) {
      this.selectedProductIds.clear();
    }
  }

  /**
   * Escucha los clics en el documento para deseleccionar filas si el clic es fuera de la tabla.
   * @param event El evento del mouse.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInsideTable = this.elementRef.nativeElement.contains(event.target as Node);
    // Check if the click target is part of a mat-menu, to avoid closing on menu item click
    const clickedOnMenu = (event.target as HTMLElement).closest('mat-menu-item, .mat-mdc-menu-item');
    if (!clickedInsideTable && !clickedOnMenu) {
      this.clearSelection();
    }
  }
  
  // Manejador para clics dentro del contenedor de la tabla, para evitar deselección no deseada.
  onTableClick(event: MouseEvent): void {
    // No es necesario hacer nada aquí si la lógica de deselección está en onDocumentClick
    // y los stopPropagation están en los elementos interactivos (checkboxes, botones).
    // Este método puede ser útil si se necesita una lógica más compleja para clics dentro de la tabla
    // que no deben deseleccionar, pero por ahora, el HostListener y stopPropagation son suficientes.
  }

  // Manejador para clics en una fila.
  onRowClick(product: Product3): void {
    // Alternar selección de la fila si no se hizo clic en un checkbox o botón de acción
    // (ya que esos tienen stopPropagation)
    if (this.selectedProductIds.has(product.id)) {
      this.selectedProductIds.delete(product.id);
    } else {
      this.selectedProductIds.add(product.id);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MANEJADORES DE EVENTOS DE ACCIONES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Emite el evento \`editProduct\` cuando el usuario hace clic en el botón de editar
   * para un producto específico.
   * @param product El producto que se va a editar.
   * @param event El evento del mouse para detener la propagación.
   */
  onEdit(product: Product3, event?: MouseEvent): void { // Added optional event
    event?.stopPropagation();
    this.editProduct.emit(product);
  }

  /**
   * Emite el evento \`deleteProduct\` cuando el usuario hace clic en el botón de eliminar
   * para un producto específico.
   * @param product El producto que se va a eliminar.
   * @param event El evento del mouse para detener la propagación.
   */
  onDelete(product: Product3, event?: MouseEvent): void { // Added optional event
    event?.stopPropagation();
    this.deleteProduct.emit(product);
  }
  
  /**
   * Maneja la acción de fijar/desfijar un producto.
   * @param product El producto a fijar/desfijar.
   * @param event El evento del mouse para detener la propagación.
   */
  onPin(product: Product3, event: MouseEvent): void {
    event.stopPropagation(); 
    if (this.pinnedProductIds.has(product.id)) {
      this.pinnedProductIds.delete(product.id);
    } else {
      this.pinnedProductIds.add(product.id);
    }
    this.applyFilters(); 
  }

  /**
   * Duplica un producto.
   * @param product El producto a duplicar.
   * @param event El evento del mouse para detener la propagación.
   */
  onDuplicate(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Duplicar producto:', product.id);
    // Lógica de duplicación (ej. emitir evento al componente padre)
  }

  /**
   * Repite una fila de producto.
   * @param product El producto a repetir.
   * @param event El evento del mouse para detener la propagación.
   */
  onRepeat(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Repetir producto:', product.id);
    // Lógica de repetición (ej. emitir evento al componente padre)
  }

  /**
   * Copia la información de un producto (ej. al portapapeles).
   * @param product El producto a copiar.
   * @param event El evento del mouse para detener la propagación.
   */
  onCopy(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Copiar producto:', product.id);
    const productDetails = `ID: ${product.id}, Código: ${product.productCode}, Tipo: ${product.type}`; // Corrected backticks
    navigator.clipboard.writeText(productDetails).then(() => {
      console.log('Detalles del producto copiados al portapapeles');
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
    });
  }
  
  /**
   * Aplica los filtros del formulario a la tabla de productos.
   * Filtra por texto, tipo, material, cantidad y presupuesto.
   * También ordena los productos para mostrar los fijados primero.
   */
  applyFilters(): void {
    const {
      search, type, material, minQuantity, maxQuantity, minBudget, maxBudget
    } = this.filterForm.value;
    let filteredData = [...this._products];

    // Filtro de texto general (en código, descripción, tipo, material)
    if (search) {
      const s = search.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.productCode?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.type?.toLowerCase().includes(s) ||
        p.material?.type?.toLowerCase().includes(s)
      );
    }
    // Filtro por tipo
    if (type) {
      filteredData = filteredData.filter(p => p.type === type);
    }
    // Filtro por material
    if (material) {
      filteredData = filteredData.filter(p => p.material?.type === material);
    }
    // Filtro por cantidad
    if (minQuantity) {
      filteredData = filteredData.filter(p => (p.quantity || 0) >= +minQuantity);
    }
    if (maxQuantity) {
      filteredData = filteredData.filter(p => (p.quantity || 0) <= +maxQuantity);
    }
    // Filtro por presupuesto
    if (minBudget) {
      filteredData = filteredData.filter(p => (p.budget || 0) >= +minBudget);
    }
    if (maxBudget) {
      filteredData = filteredData.filter(p => (p.budget || 0) <= +maxBudget);
    }

    // Ordenar: productos fijados primero, luego el resto
    filteredData.sort((a, b) => {
      const aIsPinned = this.pinnedProductIds.has(a.id);
      const bIsPinned = this.pinnedProductIds.has(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      // Criterio de ordenación secundario (opcional, ej. por productCode)
      // return a.productCode.localeCompare(b.productCode);
      return 0;
    });

    this.productsDataSource.data = filteredData;
  }

  /**
   * Actualiza las listas de tipos y materiales únicos para los filtros selectores.
   * Llamar después de cargar productos.
   */
  updateFilterOptions(): void {
    const types = new Set<string>();
    const materials = new Set<string>();
    this._products.forEach(product => {
      if (product.type) {
        types.add(product.type);
      }
      if (product.material?.type) {
        materials.add(product.material.type);
      }
    });
    this.productTypes = Array.from(types);
    this.productMaterials = Array.from(materials);
  }
}
