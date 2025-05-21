import { Component, Input, Output, EventEmitter, ViewChild, ContentChild, TemplateRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Clase personalizada para los textos del paginador en español
 */
export class SpanishPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Filas por página:';
  override nextPageLabel = 'Siguiente';
  override previousPageLabel = 'Anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  
  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) {
      return 'Página 1 de 1';
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Página ${page + 1} de ${amountPages}`;
  };
}

/**
 * Función para crear una instancia de SpanishPaginatorIntl
 */
export function createSpanishPaginatorIntl() {
  return new SpanishPaginatorIntl();
}

/**
 * Componente reusable para tablas en la aplicación
 * Implementa estilos y funcionalidades comunes como paginación,
 * ordenamiento y línea vertical azul.
 */
@Component({
  selector: 'app-regular-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: createSpanishPaginatorIntl }
  ],
  templateUrl: './regular-table.component.html',
  styleUrl: './regular-table.component.scss'
})
export class RegularTableComponent<T> implements AfterViewInit {
  
  /**
   * Columnas a mostrar en la tabla
   */
  @Input() displayedColumns: string[] = [];

  /**
   * Mensaje a mostrar cuando no hay datos
   */
  @Input() noDataMessage: string = 'No hay datos disponibles.';

  /**
   * Fuente de datos para la tabla
   */
  @Input() dataSource = new MatTableDataSource<T>([]);

  /**
   * Opciones de tamaño de página para la paginación
   */
  @Input() pageSizeOptions: number[] = [5, 10, 20];

  /**
   * Evento emitido cuando se hace clic en una fila
   */
  @Output() rowClick = new EventEmitter<T>();

  /**
   * Referencia al paginador de la tabla
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /**
   * Referencia al ordenador de la tabla
   */
  @ViewChild(MatSort) sort!: MatSort;

  /**
   * Plantilla personalizada para las celdas
   */
  @ContentChild('cellTemplate') cellTemplate!: TemplateRef<any>;
  /**
   * Plantilla personalizada para las acciones
   */
  @ContentChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  
  /**
   * Plantilla personalizada para el encabezado de la primera columna
   */
  @ContentChild('headerLabel') headerLabel?: TemplateRef<any>;

  /**
   * Indica si se proporciona un encabezado personalizado
   */
  get hasCustomHeader(): boolean {
    return !!this.headerLabel;
  }
  
  /**
   * Configura el paginador y el ordenador después de la inicialización de la vista
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Maneja el evento de clic en una fila
   * @param row Fila en la que se hizo clic
   */
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
