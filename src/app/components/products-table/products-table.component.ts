import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
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
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule
  // Importa el servicio de generación de PDF
  ]
})
export class ProductsTableComponent {
  /**
   * Constructor del componente.
   */
  constructor() {}
  
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
  displayedColumns: string[] = ['productCode', 'type', 'quantity', 'totalArea', 'budget', 'actions'];
  
  /**
   * Fuente de datos para MatTable. Se inicializa con un array vacío.
   */
  productsDataSource = new MatTableDataSource<Product3>([]);
  
  /**
   * Almacenamiento interno de la lista de productos.
   */
  private _products: Product3[] = [];

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
  // MANEJADORES DE EVENTOS DE ACCIONES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Emite el evento `editProduct` cuando el usuario hace clic en el botón de editar
   * para un producto específico.
   * @param product El producto que se va a editar.
   */
  onEdit(product: Product3): void {
    this.editProduct.emit(product);
  }

  /**
   * Emite el evento `deleteProduct` cuando el usuario hace clic en el botón de eliminar
   * para un producto específico.
   * @param product El producto que se va a eliminar.
   */
  onDelete(product: Product3): void {
    this.deleteProduct.emit(product);
  }

  /**
   * Emite el evento `addProduct` cuando el usuario hace clic en el botón de agregar
   * nuevo producto.
   */
  onAdd(): void {
    this.addProduct.emit();
  }
}
