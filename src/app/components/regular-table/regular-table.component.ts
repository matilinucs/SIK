import { Component, Input, Output, EventEmitter, ViewChild, ContentChild, TemplateRef, AfterViewInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomInputComponent } from '../custom-input/custom-input.component';

// Importar los componentes de filtro y diálogo
import { FilterDialogComponent, FilterOption, ColumnFilter, FilterDialogData } from './filter-dialog/filter-dialog.component';
import { 
  DropdownFilterComponent,
  NumberRangeFilterComponent,
  DateRangeFilterComponent
} from './filter-components';

/**
 * Interface para los datos del diálogo selector de columnas
 */
export interface ColumnSelectorDialogData {
  columns: string[];
  selectedColumns: string[];
}

/**
 * Componente para el diálogo selector de columnas
 */
@Component({
  selector: 'app-column-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Seleccionar columnas</h2>
    <mat-dialog-content class="column-selector-content">
      <div class="column-options">
        <div *ngFor="let column of data.columns; let i = index" class="column-option">
          <mat-checkbox 
            [checked]="isSelected(column)"
            [disabled]="isFirstColumn(column) || column === 'actions'"
            (change)="toggleColumn($event, column)">
            {{ column }}
            <span *ngIf="isFirstColumn(column)" class="required-badge">Requerido</span>
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-divider></mat-divider>
    <mat-dialog-actions align="end">
      <div class="select-actions">
        <button mat-button (click)="selectAll()">Seleccionar todo</button>
        <button mat-button (click)="deselectAll()">Deseleccionar todo</button>
      </div>
      <button mat-button (click)="onCancelClick()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onApplyClick()">Aplicar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .column-selector-content {
      max-height: 60vh;
      min-width: 300px;
      overflow-y: auto;
      padding: 16px;
    }
    
    .column-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .column-option {
      display: flex;
      align-items: center;
    }
    
    .required-badge {
      margin-left: 8px;
      font-size: 12px;
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .select-actions {
      flex: 1;
      display: flex;
      gap: 8px;
    }
    
    mat-dialog-actions {
      padding: 16px;
    }
    
    @media (max-width: 500px) {
      .select-actions {
        flex-direction: column;
      }
      
      mat-dialog-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
    }
  `]
})
export class ColumnSelectorDialogComponent {
  selectedColumns: string[] = [];
  
  constructor(
    public dialogRef: MatDialogRef<ColumnSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnSelectorDialogData
  ) {
    this.selectedColumns = [...data.selectedColumns];
  }
  
  isSelected(column: string): boolean {
    return this.selectedColumns.includes(column);
  }
  
  isFirstColumn(column: string): boolean {
    return this.data.columns.indexOf(column) === 0;
  }
  
  toggleColumn(event: MatCheckboxChange, column: string): void {
    if (event.checked) {
      // Añadir columna si no existe
      if (!this.selectedColumns.includes(column)) {
        // Mantener orden original
        const newSelectedColumns: string[] = [];
        this.data.columns.forEach(col => {
          if (col === column || this.selectedColumns.includes(col)) {
            newSelectedColumns.push(col);
          }
        });
        this.selectedColumns = newSelectedColumns;
      }
    } else {
      // Remover columna si no es la primera
      if (!this.isFirstColumn(column)) {
        this.selectedColumns = this.selectedColumns.filter(col => col !== column);
      }
    }
  }
  
  selectAll(): void {
    this.selectedColumns = [...this.data.columns];
  }
  
  deselectAll(): void {
    // Mantener solo la primera columna y 'actions' si existe
    this.selectedColumns = this.data.columns.filter(
      (column, index) => index === 0 || column === 'actions'
    );
  }
  
  onCancelClick(): void {
    this.dialogRef.close();
  }
  
  onApplyClick(): void {
    this.dialogRef.close(this.selectedColumns);
  }
}

/**
 * Clase personalizada para los textos del paginador en español
 */
export class SpanishPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Elementos por página:';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) {
      return '0 de ' + length;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? 
      Math.min(startIndex + pageSize, length) : 
      startIndex + pageSize;
    return startIndex + 1 + ' - ' + endIndex + ' de ' + length;
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
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FilterDialogComponent,
    ColumnSelectorDialogComponent,
    DropdownFilterComponent,
    NumberRangeFilterComponent,
    DateRangeFilterComponent
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
   * Servicio de diálogos
   */
  private dialog = inject(MatDialog);
  
  /**
   * Valores de filtro actuales
   */
  private currentFilters: { [key: string]: ColumnFilter } = {};
  
  /**
   * Tipos de columna para filtrado
   */
  private columnTypes: { [key: string]: 'text' | 'number' | 'date' | 'select' } = {};
  
  /**
   * Opciones para selectores
   */
  private selectOptions: { [key: string]: FilterOption[] } = {};

  /**
   * Configura el paginador y el ordenador después de la inicialización de la vista
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Inicializar tipos de columna
    this.initColumnTypes();
  }
  
  /**
   * Inicializa los tipos de columna basados en los nombres
   */
  private initColumnTypes(): void {
    this.displayedColumns.forEach(column => {
      if (column === 'actions') return;
      
      if (column.toLowerCase().includes('fecha') || column.toLowerCase().includes('date')) {
        this.columnTypes[column] = 'date';
      } else if (column.toLowerCase().includes('precio') || 
                column.toLowerCase().includes('monto') || 
                column.toLowerCase().includes('total') ||
                column.toLowerCase().includes('cantidad') ||
                column.toLowerCase().includes('numero') ||
                column.toLowerCase().includes('number')) {
        this.columnTypes[column] = 'number';
      } else if (column.toLowerCase().includes('estado') || 
                column.toLowerCase().includes('status') ||
                column.toLowerCase().includes('tipo')) {
        this.columnTypes[column] = 'select';
      } else {
        this.columnTypes[column] = 'text';
      }
    });
  }
  
  /**
   * Establece las opciones para un selector
   */
  setSelectOptions(column: string, options: FilterOption[]): void {
    this.selectOptions[column] = options;
  }

  /**
   * Maneja el evento de clic en una fila
   * @param row Fila en la que se hizo clic
   */
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
  
  /**
   * Abre el diálogo de filtro
   */  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        columns: this.displayedColumns.filter(col => col !== 'actions'),
        columnTypes: this.columnTypes,
        filterValues: this.currentFilters,
        selectOptions: this.selectOptions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.currentFilters = result;
        console.log('Filtros aplicados:', result);
        
        // Implementar la lógica de filtrado
        this.applyFilters();
      }
    });
  }
  
  /**
   * Aplica los filtros a los datos de la tabla
   */
  private applyFilters(): void {
    this.dataSource.filterPredicate = (data: T, filter: string) => {
      // Si no hay filtros, mostrar todas las filas
      if (Object.keys(this.currentFilters).length === 0) {
        return true;
      }
      
      // Verificar cada filtro
      for (const column of Object.keys(this.currentFilters)) {
        const filterConfig = this.currentFilters[column];
        const value = (data as any)[column];
        
        if (value === undefined || value === null) {
          return false;
        }
        
        switch (filterConfig.type) {
          case 'text':
            if (!value.toString().toLowerCase().includes(filterConfig.value.toString().toLowerCase())) {
              return false;
            }
            break;
          case 'select':
            if (value.toString() !== filterConfig.value.toString()) {
              return false;
            }
            break;
          case 'number':
            const numValue = Number(value);
            if (
              (filterConfig.min !== null && filterConfig.min !== undefined && numValue < filterConfig.min) || 
              (filterConfig.max !== null && filterConfig.max !== undefined && numValue > filterConfig.max)
            ) {
              return false;
            }
            break;
          case 'date':
            const dateValue = value instanceof Date ? value : new Date(value);
            const startDate = filterConfig.startDate ? new Date(filterConfig.startDate) : null;
            const endDate = filterConfig.endDate ? new Date(filterConfig.endDate) : null;
            
            if (startDate) {
              startDate.setHours(0, 0, 0, 0);
              if (dateValue < startDate) {
                return false;
              }
            }
            
            if (endDate) {
              endDate.setHours(23, 59, 59, 999);
              if (dateValue > endDate) {
                return false;
              }
            }
            break;
        }
      }
      
      return true;
    };
    
    // Aplicar el filtro (puede ser cualquier string ya que la lógica está en filterPredicate)
    this.dataSource.filter = Date.now().toString();
  }
  
  /**
   * Abre el diálogo selector de columnas
   */
  openColumnSelectorDialog(): void {
    const dialogRef = this.dialog.open(ColumnSelectorDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        columns: this.displayedColumns,
        selectedColumns: [...this.displayedColumns]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && Array.isArray(result)) {
        // Actualizar columnas mostradas
        this.displayedColumns = result;
      }
    });
  }
}
