import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

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
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class ProductsTableComponent {
  // Almacenamiento interno de productos
  private _products: Product3[] = [];
  
  // Gestión de selección multiple para unificación
  selectedProducts: Product3[] = [];
  
  // OutputEvents
  @Output() unifyProducts = new EventEmitter<Product3[]>(); // Evento para unificar productos seleccionados
  
  /**
   * Constructor del componente.
   */
  constructor(private fb: FormBuilder, private elementRef: ElementRef) {
    // Inicializar el formulario de filtros
    this.filterForm = this.fb.group({
      search: [''],
      type: [null],
      materialType: [null],
      minQuantity: [null],
      maxQuantity: [null],
      minBudget: [null],
      maxBudget: [null],
      minArea: [null],
      maxArea: [null]
    });

    // Suscribirse a los cambios en el formulario
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters(); // Asegúrate de que applyFilters se llama aquí
    });
    
    // Inicializar historial de acciones
    this.undoHistory = [];
    this.historyIndex = -1;
  }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROPIEDADES DE ENTRADA (INPUTS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Lista de productos a mostrar en la tabla.
   * Cuando se actualiza, también se actualiza el MatTableDataSource.
   * @param value Array de objetos Product3.
   */  
  @Input() set products(value: Product3[] | null | undefined) { // Allow null or undefined
    this._products = value ? [...value] : []; // Ensure _products is always an array and take a copy
    this.productsDataSource.data = this._products; // Actualizar directamente los datos de la tabla
    this.updateFilterOptions(); // Update options based on the new set of products
    this.applyFilters(); // Apply filters now that products are available or cleared
    
    // Guardar el estado inicial solo si es la primera vez que se cargan productos
    if (value && value.length > 0 && this.undoHistory.length === 0) {
      this.saveStateToHistory('Estado inicial');
    }
  }
  get products(): Product3[] {
    return this._products;
  }
  
  /**
   * Indica si la tabla se está mostrando en modo de pantalla completa.
   * Esto puede usarse para ajustar el comportamiento o la apariencia de la tabla.
   */
  @Input() isFullScreenMode: boolean = false;

  /**
   * Activa o desactiva el modo de unificación.
   * En modo de unificación, solo se muestran las filas de productos seleccionados.
   */
  private originalProducts: Product3[] = [];

  @Input() set unifyModeActive(value: boolean) {
    if (value) {
      // Guardar la lista original solo la primera vez
      if (!this.originalProducts.length) {
        this.originalProducts = [...this._products];
      }
      // Filtrar solo los seleccionados
      this._products = this._products.filter(p => this.selectedProductIds.has(p.id));
    } else {
      // Restaurar la lista original
      if (this.originalProducts.length) {
        this._products = [...this.originalProducts];
        this.originalProducts = [];
      }
    }
  }

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
   * Controla la visibilidad del mensaje de notificación cuando se copian filas.
   */
  showCopyNotification: boolean = false;

  /**
   * Mensaje de notificación para mostrar al copiar filas.
   */
  copyNotificationMessage: string = '';

  /**
   * Temporizador para ocultar automáticamente la notificación.
   */
  private notificationTimeout: any;

  /**
   * Historial de estados para la funcionalidad de deshacer/rehacer.
   * Almacena snapshots de los productos en diferentes momentos.
   */
  private undoHistory: Product3[][] = [];

  /**
   * Posición actual en el historial para deshacer/rehacer.
   */
  private historyIndex: number = -1;

  /**
   * Fuente de datos para MatTable. Se inicializa con un array vacío.
   */
  productsDataSource = new MatTableDataSource<Product3>([]);
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
   */  onDelete(product: Product3, event?: MouseEvent): void { // Added optional event
    event?.stopPropagation();
    // Guardar estado actual antes de eliminar
    this.saveStateToHistory('Eliminar producto');
    this.deleteProduct.emit(product);
  }
  
  /**
   * Maneja la acción de fijar/desfijar un producto.
   * @param product El producto a fijar/desfijar.
   * @param event El evento del mouse para detener la propagación.
   */  onPin(product: Product3, event: MouseEvent): void {
    event.stopPropagation(); 
    // Guardar estado actual antes de fijar/desfijar
    this.saveStateToHistory(this.pinnedProductIds.has(product.id) ? 'Desfijar producto' : 'Fijar producto');
    
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
   */  onDuplicate(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Duplicar producto:', product.id);
    
    // Guardar estado actual antes de duplicar
    this.saveStateToHistory('Duplicar producto');
    
    // Crear una copia del producto con un nuevo ID
    const duplicatedProduct: Product3 = {
      ...JSON.parse(JSON.stringify(product)),
      id: 'dup-' + Date.now(),
      productCode: product.productCode + '-copia'
    };
    
    // Añadir el producto duplicado a la lista
    this._products = [...this._products, duplicatedProduct];
    this.productsDataSource.data = this._products;
    this.updateFilterOptions();
    this.applyFilters();
    
    // Mostrar notificación
    this.showNotification('Producto duplicado correctamente');
  }

  /**
   * Repite una fila de producto.
   * @param product El producto a repetir.
   * @param event El evento del mouse para detener la propagación.
   */
  onRepeat(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Repetir producto:', product.id);
    
    // Guardar estado actual antes de repetir
    this.saveStateToHistory('Repetir producto');
    
    // Crear una copia del producto con un nuevo ID y incrementar la cantidad
    const repeatedProduct: Product3 = {
      ...JSON.parse(JSON.stringify(product)),
      id: 'rep-' + Date.now(),
      quantity: (product.quantity || 1) + 1,
      totalArea: ((product.totalArea || 0) / (product.quantity || 1)) * ((product.quantity || 1) + 1),
      budget: ((product.budget || 0) / (product.quantity || 1)) * ((product.quantity || 1) + 1)
    };
    
    // Añadir el producto repetido a la lista
    this._products = [...this._products, repeatedProduct];
    this.productsDataSource.data = this._products;
    this.updateFilterOptions();
    this.applyFilters();
    
    // Mostrar notificación
    this.showNotification('Producto repetido correctamente');
  }

  /**
   * Copia la información de un producto (ej. al portapapeles).
   * Activado desde el menú de acciones de la fila.
   * @param product El producto a copiar.
   * @param event El evento del mouse para detener la propagación.
   */
  onCopy(product: Product3, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Copiar fila de producto:', product.id);

    const rowData = [
      product.productCode,
      product.type,
      product.quantity,
      product.totalArea,
      product.budget,
      product.description,
      product.material?.type || '',
      product.material?.profile || '',
      product.material?.color || '',
      product.dimensions?.width || '',
      product.dimensions?.height || '',
      product.dimensions?.length || ''
    ].join('\t');

    navigator.clipboard.writeText(rowData).then(() => {
      this.showNotification(`Fila '${product.productCode}' copiada al portapapeles`);
    }).catch(err => {
      console.error('Error al copiar la fila al portapapeles:', err);
      this.showNotification('Error al copiar la fila');
    });
  }
  
  /**
   * Limpia todos los campos del formulario de filtros y reaplica los filtros.
   */
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      type: null,
      materialType: null,
      minQuantity: null,
      maxQuantity: null,
      minBudget: null,
      maxBudget: null,
      minArea: null,
      maxArea: null
    });
    // applyFilters() se llamará automáticamente debido a la suscripción valueChanges
  }

  /**
   * Actualiza las opciones de los filtros basándose en los productos disponibles
   */
  private updateFilterOptions(): void {
    if (this._products) {
      // Extraer tipos y materiales únicos de los productos
      const types = new Set<string>();
      const materials = new Set<string>();

      this._products.forEach(product => {
        if (product.type) types.add(product.type);
        if (product.material?.type) materials.add(product.material.type);
      });

      this.productTypes = Array.from(types).sort();
      this.productMaterials = Array.from(materials).sort();
    }
  }

  /**
   * Aplica los filtros actuales a la tabla
   */
  private applyFilters(): void {
    if (!this.productsDataSource) return;

    const filterValues = this.filterForm.value;

    this.productsDataSource.filterPredicate = (product: Product3, _: string) => {
      // Búsqueda general
      if (filterValues.search) {
        const searchStr = filterValues.search.toLowerCase();
        const matchSearch = 
          product.productCode?.toLowerCase().includes(searchStr) ||
          product.type?.toLowerCase().includes(searchStr) ||
          product.material?.type?.toLowerCase().includes(searchStr) ||
          product.description?.toLowerCase().includes(searchStr);
        
        if (!matchSearch) return false;
      }

      // Filtro por tipo
      if (filterValues.type && product.type !== filterValues.type) {
        return false;
      }

      // Filtro por tipo de material
      if (filterValues.materialType && product.material?.type !== filterValues.materialType) {
        return false;
      }

      // Filtros de rango numérico
      if (filterValues.minQuantity !== null && product.quantity < filterValues.minQuantity) {
        return false;
      }
      if (filterValues.maxQuantity !== null && product.quantity > filterValues.maxQuantity) {
        return false;
      }

      if (filterValues.minBudget !== null && product.budget < filterValues.minBudget) {
        return false;
      }
      if (filterValues.maxBudget !== null && product.budget > filterValues.maxBudget) {
        return false;
      }

      if (filterValues.minArea !== null && product.totalArea < filterValues.minArea) {
        return false;
      }
      if (filterValues.maxArea !== null && product.totalArea > filterValues.maxArea) {
        return false;
      }

      return true;
    };    // Primero actualizamos los datos base con todos los productos
    this.productsDataSource.data = this._products.slice();
    
    // Luego aplicamos el filtro
    this.productsDataSource.filter = Date.now().toString();

    // Finalmente ordenamos los productos fijados al principio
    const sortedData = this.productsDataSource.filteredData.slice();
    sortedData.sort((a, b) => {
      const isPinnedA = this.pinnedProductIds.has(a.id);
      const isPinnedB = this.pinnedProductIds.has(b.id);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      return 0;
    });
    this.productsDataSource.data = sortedData;
  }  /**
   * Manejador de eventos de teclado para capturar Ctrl+C, Ctrl+V, Ctrl+Z, y Ctrl+Y
   * También maneja Command+Z y Command+Shift+Z para usuarios de MacOS
   * Cuando se detecta el atajo correspondiente, ejecuta la acción asociada
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Control+C o Command+C (Copiar)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      this.copySelectedRows();
    } 
    // Control+V o Command+V (Pegar)
    else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      this.pasteFromClipboard();
    }
    // Control+Z o Command+Z (Deshacer)
    else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      this.undoLastAction();
    }
    // Control+Y o Command+Shift+Z (Rehacer)
    else if (((event.ctrlKey && event.key === 'y') || 
              (event.metaKey && event.shiftKey && event.key === 'z'))) {
      event.preventDefault();
      this.redoLastAction();
    }
  }  /**
   * Copia las filas de productos seleccionadas al portapapeles
   * Las formatea en un formato de tabla con separadores de tabulación
   * Muestra una notificación al usuario cuando se completa la operación
   */
  copySelectedRows(): void {
    // Ya hemos verificado que hay elementos seleccionados en copySelectedRowsButton

    // Filtrar los productos seleccionados
    const selectedProducts = this._products.filter(product => this.selectedProductIds.has(product.id));

    // Crear encabezados de columna
    const headers = [
      'Código', 
      'Tipo', 
      'Cantidad', 
      'Área Total', 
      'Presupuesto', 
      'Descripción',
      'Material',
      'Perfil',
      'Color',
      'Ancho',
      'Alto',
      'Profundidad'
    ].join('\t');

    // Mapear los productos a un formato de texto tabulado
    const rows = selectedProducts.map(product => {
      return [
        product.productCode,
        product.type,
        product.quantity,
        product.totalArea,
        product.budget,
        product.description,
        product.material?.type || '',
        product.material?.profile || '',
        product.material?.color || '',
        product.dimensions?.width || '',
        product.dimensions?.height || '',
        product.dimensions?.length || ''
      ].join('\t');
    });

    // Unir los encabezados y filas con saltos de línea
    const textToCopy = [headers, ...rows].join('\n');

    // Copiar al portapapeles
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Mostrar notificación
      this.showNotification(`${this.selectedProductIds.size} producto(s) copiado(s) al portapapeles`);
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      this.showNotification('Error al copiar al portapapeles');
    });
  }
  /**
   * Intenta pegar datos desde el portapapeles y los añade a la tabla
   * Si el formato es compatible (tabulaciones como separador), crea nuevas filas de producto
   * Muestra una notificación al usuario cuando se completa la operación
   */
  pasteFromClipboard(): void {
    navigator.clipboard.readText().then(clipboardText => {
      if (!clipboardText) {
        return; // No hay contenido en el portapapeles
      }
      
      try {
        // Dividir el texto pegado en líneas
        const lines = clipboardText.trim().split('\n');
        if (lines.length === 0) {
          throw new Error('No se encontraron datos para pegar');
        }
        
        // La primera línea puede ser un encabezado
        const isFirstRowHeader = this.detectIfFirstRowIsHeader(lines[0]);
        const dataStartIndex = isFirstRowHeader ? 1 : 0;
        
        // Verificar que hay datos para procesar
        if (lines.length <= dataStartIndex) {
          throw new Error('No se encontraron datos para pegar');
        }
        
        // Convertir las líneas restantes en productos
        const newProducts = this.convertLinesToProducts(lines.slice(dataStartIndex));
        if (newProducts.length === 0) {
          throw new Error('No se pudieron crear productos con los datos pegados');
        }
        
        // Agregar los nuevos productos a la lista existente
        const updatedProducts = [...this._products, ...newProducts];
        
        // Actualizar la tabla con los nuevos productos
        this._products = updatedProducts;
        this.productsDataSource.data = this._products;
        this.updateFilterOptions();
        this.applyFilters();
        
        // Mostrar notificación de éxito
        this.showNotification(`${newProducts.length} producto(s) agregado(s) desde el portapapeles`);
        
        // Guardar estado en el historial para deshacer
        this.saveStateToHistory('Pegar productos desde el portapapeles');
      } catch (error) {
        console.error('Error al procesar datos pegados:', error);
        
        // Mostrar notificación de error
        this.showNotification('Error al procesar el contenido pegado');
      }
    }).catch(err => {
      console.error('Error al acceder al portapapeles:', err);
      
      // Mostrar notificación de error
      this.showNotification('Error al acceder al portapapeles');
    });
  }

  /**
   * Determina si la primera fila es un encabezado basado en el contenido
   * @param firstLine La primera línea del texto pegado
   * @returns true si parece ser un encabezado
   */
  private detectIfFirstRowIsHeader(firstLine: string): boolean {
    const columnsLower = firstLine.toLowerCase().split('\t');
    const headerKeywords = ['código', 'type', 'tipo', 'cantidad', 'area', 'área', 'presupuesto'];
    
    // Si alguna columna contiene palabras clave de encabezados, asumimos que es un encabezado
    return headerKeywords.some(keyword => 
      columnsLower.some(col => col.includes(keyword))
    );
  }

  /**
   * Convierte líneas de texto en objetos Product3
   * @param lines Líneas de texto (sin encabezados) con valores separados por tabulaciones
   * @returns Array de productos creados
   */
  private convertLinesToProducts(lines: string[]): Product3[] {
    return lines.map((line, index) => {
      const columns = line.split('\t');
      if (columns.length < 2) return null; // Mínimo necesitamos código y tipo
      
      // Crear un objeto producto con los datos de la línea
      return {
        id: `paste-${Date.now()}-${index}`,
        productCode: columns[0] || `NP-${Math.floor(Math.random() * 1000)}`,
        type: columns[1] || 'Sin tipo',
        quantity: columns.length > 2 ? Number(columns[2]) || 1 : 1,
        totalArea: columns.length > 3 ? Number(columns[3]) || 0 : 0,
        budget: columns.length > 4 ? Number(columns[4]) || 0 : 0,
        description: columns.length > 5 ? columns[5] || '' : '',
        material: {
          type: columns.length > 6 ? columns[6] || 'No especificado' : 'No especificado',
          profile: columns.length > 7 ? columns[7] || '' : '',
          color: columns.length > 8 ? columns[8] || '' : ''
        },
        dimensions: {
          width: columns.length > 9 ? Number(columns[9]) || 0 : 0,
          height: columns.length > 10 ? Number(columns[10]) || 0 : 0,
          length: columns.length > 11 ? Number(columns[11]) || 0 : 0,
          unit: 'cm'
        }
      };
    }).filter(Boolean) as Product3[];
  }
  
  /**
   * Añade el estado actual al historial para poder deshacerlo
   * @param action Descripción de la acción realizada para mostrar en notificaciones
   */
  private saveStateToHistory(action: string): void {
    // Truncar el historial si estamos en una posición anterior
    if (this.historyIndex < this.undoHistory.length - 1) {
      this.undoHistory = this.undoHistory.slice(0, this.historyIndex + 1);
    }
    
    // Guardar copia profunda de los productos actuales
    const productsCopy = JSON.parse(JSON.stringify(this._products));
    this.undoHistory.push(productsCopy);
    this.historyIndex = this.undoHistory.length - 1;
    
    console.log(`Acción registrada: ${action} - Historial: ${this.historyIndex + 1}/${this.undoHistory.length}`);
  }

  /**
   * Deshace la última acción realizada en la tabla
   */
  undoLastAction(): void {
    if (this.historyIndex <= 0) {
      this.showNotification('No hay acciones para deshacer');
      return;
    }

    this.historyIndex--;
    this._products = JSON.parse(JSON.stringify(this.undoHistory[this.historyIndex]));
    this.productsDataSource.data = this._products;
    this.updateFilterOptions();
    this.applyFilters();
    
    this.showNotification('Acción deshecha');
  }

  /**
   * Rehace la última acción deshecha en la tabla
   */
  redoLastAction(): void {
    if (this.historyIndex >= this.undoHistory.length - 1) {
      this.showNotification('No hay acciones para rehacer');
      return;
    }

    this.historyIndex++;
    this._products = JSON.parse(JSON.stringify(this.undoHistory[this.historyIndex]));
    this.productsDataSource.data = this._products;
    this.updateFilterOptions();
    this.applyFilters();
    
    this.showNotification('Acción rehecha');
  }

  /**
   * Muestra una notificación al usuario
   * @param message El mensaje a mostrar
   */
  private showNotification(message: string): void {
    this.showCopyNotification = true;
    this.copyNotificationMessage = message;
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.showCopyNotification = false;
    }, 3000);
  }
  /**
   * Maneja el clic en el botón de copiar
   */
  copySelectedRowsButton(): void {
    if (this.selectedProductIds.size === 0) {
      this.showNotification('No se seleccionó ningún elemento');
      return;
    }
    this.copySelectedRows();
  }
  /**
   * Maneja el clic en el botón de pegar
   */
  pasteFromClipboardButton(): void {
    this.saveStateToHistory('Pegar desde el portapapeles');
    this.pasteFromClipboard();  
  }

  /**
   * Maneja el clic en el botón de unificar productos
   * Emite el evento unifyProducts con los productos seleccionados
   */  onUnifyButtonClick(): void {
    console.log('[UNIFY] Botón "Unificar en formulario" clickeado en ProductsTableComponent', {
      selectedProductIds: Array.from(this.selectedProductIds),
      selectedProducts: this._products.filter(product => this.selectedProductIds.has(product.id))
    });
    if (this.selectedProductIds.size < 2) {
      this.showNotification('No se seleccionaron elementos suficientes');
      return;
    }
    
    // Filtrar los productos seleccionados
    const selectedProducts = this._products.filter(product => this.selectedProductIds.has(product.id));
    
    // Emitir el evento unifyProducts con los productos seleccionados
    this.unifyProducts.emit(selectedProducts);
    
    // Mostrar notificación
    this.showNotification(`${selectedProducts.length} productos seleccionados para unificar`);
  }

  /**
   * Maneja el clic en el botón de importar productos desde Excel
   * Abre un diálogo para seleccionar el archivo de Excel y lo procesa
   */
  onImport(): void {
    const excelLogo = '/excel.png';
    const fileIcon = '/black_excel.png';
    Swal.fire({
      title: 'Importar Archivo Excel',
      html: `
        <style>
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-18px); }
          }
          .excel-logo-anim {
            width: 110px;
            height: 110px;
            margin-bottom: 10px;
            animation: bounce 1.2s infinite;
            transition: filter 0.3s;
            filter: drop-shadow(0 4px 16px #1976d255);
          }
          .drag-file-visual {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 8px;
          }
          .drag-file-visual img {
            width: 48px;
            height: 48px;
            margin-bottom: 4px;
            opacity: 0.7;
          }
          .custom-file-upload {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 18px;
            font-size: 1rem;
            font-weight: 500;
            background: #f5f5f5;
            color: #333;
            border: 1px solid #b0b0b0;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            transition: background 0.2s, border 0.2s;
          }
          .custom-file-upload:hover {
            background: #e3e3e3;
            border-color: #1976d2;
            color: #1976d2;
          }
          .custom-file-upload .file-icon {
            width: 22px;
            height: 22px;
            opacity: 0.8;
          }
        </style>
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${excelLogo}" alt="Excel Logo" class="excel-logo-anim">
        </div>
        <div style="border: 2px solid #b0b0b0; padding: 20px; border-radius: 10px; margin: 20px 0; background: #fafbfc;">
          <div class="drag-file-visual">
            <img src="${fileIcon}" alt="Arrastra archivo">
            <span style="font-size: 1.08em; color: #666;">Arrastra tu archivo Excel aquí</span>
          </div>
          <p style="color: #999; font-size: 0.9em; margin: 10px 0 0 0;">o</p>
          <label for="file-upload" class="custom-file-upload">
            <span style="font-size: 1.3em; line-height: 1;">📁</span>
            <span>Explorar archivos</span>
          </label>
          <input id="file-upload" type="file" accept=".xlsx, .xls" 
                 style="display: none;"
                 onchange="window.handleFileSelect(event)">
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'drop-zone-container'
      },
      didOpen: () => {
        const dropZone = Swal.getHtmlContainer();
        const fileInput = dropZone?.querySelector('#file-upload') as HTMLInputElement;

        // Configurar el manejador de archivos en window
        (window as any).handleFileSelect = (event: Event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            this.handleExcelFile(file);
            Swal.close();
          }
        };

        // Prevenir comportamiento por defecto
        dropZone?.addEventListener('dragover', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          target.style.backgroundColor = '#f3f9ff';
        });

        dropZone?.addEventListener('dragleave', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          target.style.backgroundColor = 'transparent';
        });

        // Manejar el drop
        dropZone?.addEventListener('drop', (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          target.style.backgroundColor = 'transparent';
          
          const file = e.dataTransfer?.files[0];
          if (file) {
            this.handleExcelFile(file);
            Swal.close();
          }
        });
      }
    });
  }

  private handleExcelFile(file: File): void {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      this.showNotification('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Procesar los datos
        if (jsonData.length > 0) {
          this.saveStateToHistory('Importar productos desde Excel');
          // TODO: Implementar la lógica para procesar los datos del Excel
          this.showNotification('Archivo importado correctamente');
        } else {
          this.showNotification('El archivo está vacío');
        }
      } catch (error) {
        console.error('Error al procesar el archivo Excel:', error);
        this.showNotification('Error al procesar el archivo');
      }
    };
    
    reader.readAsBinaryString(file);
  }
}
