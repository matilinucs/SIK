import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Importar componentes de filtro personalizados
import { 
  DropdownFilterComponent,
  NumberRangeFilterComponent,
  DateRangeFilterComponent,
  TextInputFilterComponent
} from '../filter-components';

// Ya no necesitamos CustomInputComponent porque usamos nuestros componentes especializados

/**
 * Interfaces para los datos del diálogo de filtro
 */
export interface FilterOption {
  value: any;
  viewValue: string;
}

export interface ColumnFilter {
  type: 'text' | 'number' | 'date' | 'select';
  value: any;
  min?: number;
  max?: number;
  startDate?: Date;
  endDate?: Date;
  options?: FilterOption[];
}

export interface FilterDialogData {
  columns: string[];
  columnTypes?: { [key: string]: 'text' | 'number' | 'date' | 'select' };
  filterValues?: { [key: string]: ColumnFilter };
  selectOptions?: { [key: string]: FilterOption[] };
}

/**
 * Componente para el diálogo de filtro
 * Este componente muestra un diálogo con filtros configurados según el tipo de columna
 */
@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    DropdownFilterComponent,
    NumberRangeFilterComponent,
    DateRangeFilterComponent,
    TextInputFilterComponent
  ],
  template: `
    <h2 mat-dialog-title>Filtrar tabla</h2>
    <mat-dialog-content class="filter-dialog-content">
      <form [formGroup]="filterForm">
        <div class="filters-container">
          <div *ngFor="let column of columns" class="filter-row">
            <h3 class="column-name">{{ column }}</h3>
              <!-- Filtro de texto -->
            <div *ngIf="getFilterType(column) === 'text'" class="filter-field">
              <app-text-input-filter
                [label]="'Filtrar por ' + column"
                [placeholder]="'Escriba para filtrar'"
                [formControlName]="column"
                [clearable]="true"
                [showCharCount]="true"
                [maxLength]="100"
                (cleared)="clearFilter(column)">
              </app-text-input-filter>
            </div>
            
            <!-- Filtro de selección (dropdown) -->
            <div *ngIf="getFilterType(column) === 'select'" class="filter-field">
              <app-dropdown-filter
                [label]="'Seleccionar ' + column"
                [placeholder]="'Seleccione una opción'"
                [options]="getSelectOptions(column)"
                [clearable]="true"
                [formControlName]="column"
                (cleared)="clearFilter(column)">
              </app-dropdown-filter>
            </div>
            
            <!-- Filtro de rango numérico -->
            <div *ngIf="getFilterType(column) === 'number'" class="filter-field">
              <app-number-range-filter
                [minLabel]="'Valor mínimo'"
                [maxLabel]="'Valor máximo'"
                [formControlName]="column + '_range'"
                (minCleared)="clearNumberFilter(column, 'min')"
                (maxCleared)="clearNumberFilter(column, 'max')"
                (allCleared)="clearAllFiltersForColumn(column)">
              </app-number-range-filter>
            </div>
            
            <!-- Filtro de rango de fechas -->
            <div *ngIf="getFilterType(column) === 'date'" class="filter-field">
              <app-date-range-filter
                [startLabel]="'Desde'"
                [endLabel]="'Hasta'"
                [formControlName]="column + '_date_range'"
                (startCleared)="clearDateFilter(column, 'start')"
                (endCleared)="clearDateFilter(column, 'end')"
                (allCleared)="clearAllFiltersForColumn(column)">
              </app-date-range-filter>
            </div>
            
            <button 
              mat-icon-button 
              color="warn" 
              class="clear-filter-button"
              matTooltip="Limpiar filtro"
              (click)="clearAllFiltersForColumn(column)">
              <mat-icon>clear</mat-icon>
            </button>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="clearAllFilters()">Limpiar todos los filtros</button>
      <button mat-button (click)="onCancelClick()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onApplyClick()">Aplicar filtros</button>
    </mat-dialog-actions>
  `,  styles: [`
    .filter-dialog-content {
      max-height: 60vh;
      min-width: auto;
      overflow-y: auto;
      padding: 16px;
    }
      .filters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
      .filter-row {
      display: flex;
      flex-direction: column;
      padding: 12px;
      border-radius: 8px;
      background-color: #f8f9fa;
      position: relative;
    }
      .column-name {
      margin-top: 0;
      margin-bottom: 12px;
      color: #1976d2;
      font-weight: 500;
      font-size: 14px;
    }
    
    .filter-field {
      width: 100%;
    }
    
    .clear-filter-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    
    @media (max-width: 768px) {
      .filter-dialog-content {
        min-width: unset;
      }
    }
  `]
})
export class FilterDialogComponent implements OnInit {
  /**
   * Formulario para los filtros
   */
  filterForm: FormGroup;

  /**
   * Columnas disponibles para filtrar
   */
  columns: string[] = [];

  /**
   * Constructor del componente
   */
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FilterDialogData
  ) {
    this.columns = data.columns || [];
    this.filterForm = this.fb.group({});
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Inicializa el formulario con los valores existentes
   */
  initForm(): void {
    const existingFilters = this.data.filterValues || {};
    
    // Crear controles para cada columna
    this.columns.forEach(column => {
      const columnType = this.getFilterType(column);
      const columnFilter = existingFilters[column] || { type: columnType, value: null };
      
      switch (columnType) {
        case 'text':
        case 'select':
          this.filterForm.addControl(column, this.fb.control(columnFilter.value));
          break;
        case 'number':
          this.filterForm.addControl(`${column}_range`, this.fb.control({
            min: columnFilter.min || null,
            max: columnFilter.max || null
          }));
          break;
        case 'date':
          this.filterForm.addControl(`${column}_date_range`, this.fb.control({
            start: columnFilter.startDate || null,
            end: columnFilter.endDate || null
          }));
          break;
      }
    });
  }

  /**
   * Determina el tipo de filtro para una columna
   */
  getFilterType(column: string): 'text' | 'number' | 'date' | 'select' {
    if (this.data.columnTypes && this.data.columnTypes[column]) {
      return this.data.columnTypes[column];
    }
    
    // Valores por defecto basados en nombres comunes
    if (column.toLowerCase().includes('fecha') || column.toLowerCase().includes('date')) {
      return 'date';
    } else if (column.toLowerCase().includes('precio') || 
               column.toLowerCase().includes('monto') || 
               column.toLowerCase().includes('total') ||
               column.toLowerCase().includes('cantidad') ||
               column.toLowerCase().includes('numero') ||
               column.toLowerCase().includes('number')) {
      return 'number';
    } else if (column.toLowerCase().includes('estado') || 
               column.toLowerCase().includes('status') ||
               column.toLowerCase().includes('tipo')) {
      return 'select';
    }
    
    return 'text';
  }

  /**
   * Obtiene las opciones para un selector
   */
  getSelectOptions(column: string): FilterOption[] {
    if (this.data.selectOptions && this.data.selectOptions[column]) {
      return this.data.selectOptions[column];
    }
    return [];
  }

  /**
   * Maneja el clic en el botón cancelar
   */
  onCancelClick(): void {
    this.dialogRef.close();
  }

  /**
   * Maneja el clic en el botón aplicar
   */
  onApplyClick(): void {
    const result: { [key: string]: ColumnFilter } = {};
    
    this.columns.forEach(column => {
      const columnType = this.getFilterType(column);
      
      switch (columnType) {
        case 'text':
        case 'select':
          const value = this.filterForm.get(column)?.value;
          if (value !== null && value !== undefined && value !== '') {
            result[column] = {
              type: columnType,
              value: value
            };
          }
          break;
        case 'number':
          const rangeValue = this.filterForm.get(`${column}_range`)?.value;
          if (rangeValue && (rangeValue.min !== null || rangeValue.max !== null)) {
            result[column] = {
              type: 'number',
              value: null,
              min: rangeValue.min,
              max: rangeValue.max
            };
          }
          break;
        case 'date':
          const dateRange = this.filterForm.get(`${column}_date_range`)?.value;
          if (dateRange && (dateRange.start || dateRange.end)) {
            result[column] = {
              type: 'date',
              value: null,
              startDate: dateRange.start,
              endDate: dateRange.end
            };
          }
          break;
      }
    });
    
    this.dialogRef.close(result);
  }

  /**
   * Limpia un filtro de texto o selección
   */
  clearFilter(column: string): void {
    const control = this.filterForm.get(column);
    if (control) {
      control.setValue(null);
    }
  }

  /**
   * Limpia un filtro de fecha
   */
  clearDateFilter(column: string, type: 'start' | 'end'): void {
    const control = this.filterForm.get(`${column}_date_range`);
    if (control) {
      const currentValue = control.value || {};
      if (type === 'start') {
        currentValue.start = null;
      } else {
        currentValue.end = null;
      }
      control.setValue(currentValue);
    }
  }

  /**
   * Limpia un filtro numérico
   */
  clearNumberFilter(column: string, type: 'min' | 'max'): void {
    const control = this.filterForm.get(`${column}_range`);
    if (control) {
      const currentValue = control.value || {};
      if (type === 'min') {
        currentValue.min = null;
      } else {
        currentValue.max = null;
      }
      control.setValue(currentValue);
    }
  }

  /**
   * Limpia todos los filtros para una columna
   */
  clearAllFiltersForColumn(column: string): void {
    const columnType = this.getFilterType(column);
    
    switch (columnType) {
      case 'text':
      case 'select':
        this.clearFilter(column);
        break;
      case 'number':
        const numberControl = this.filterForm.get(`${column}_range`);
        if (numberControl) {
          numberControl.setValue({ min: null, max: null });
        }
        break;
      case 'date':
        const dateControl = this.filterForm.get(`${column}_date_range`);
        if (dateControl) {
          dateControl.setValue({ start: null, end: null });
        }
        break;
    }
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters(): void {
    this.filterForm.reset();
  }
}