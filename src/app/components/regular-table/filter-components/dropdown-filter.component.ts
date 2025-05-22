import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

/**
 * Interface para las opciones del filtro dropdown
 */
export interface DropdownOption {
  value: any;
  viewValue: string;
}

/**
 * Componente para filtrar datos mediante un menú desplegable
 * Este componente permite seleccionar una opción de una lista desplegable
 * y emite eventos cuando cambia la selección o se limpia
 */
@Component({
  selector: 'app-dropdown-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownFilterComponent),
      multi: true
    }
  ],
  template: `
    <div class="dropdown-filter-container">
      <mat-form-field appearance="outline" class="dropdown-field">
        <mat-label>{{ label }}</mat-label>
        <mat-select [formControl]="selectControl" [placeholder]="placeholder">
          <mat-option *ngFor="let option of options" [value]="option.value">
            {{ option.viewValue }}
          </mat-option>
        </mat-select>
        <button 
          *ngIf="clearable && selectControl.value" 
          matSuffix 
          mat-icon-button 
          type="button"
          aria-label="Clear" 
          (click)="clear($event)">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .dropdown-filter-container {
      width: 100%;
    }

    .dropdown-field {
      width: 100%;
    }
  `]
})
export class DropdownFilterComponent implements ControlValueAccessor {
  /**
   * Etiqueta del selector
   */
  @Input() label: string = '';

  /**
   * Texto de placeholder cuando no hay selección
   */
  @Input() placeholder: string = '';

  /**
   * Opciones para el selector
   */
  @Input() options: DropdownOption[] = [];

  /**
   * Si es posible limpiar la selección
   */
  @Input() clearable: boolean = true;

  /**
   * Evento emitido cuando se limpia la selección
   */
  @Output() cleared = new EventEmitter<void>();

  /**
   * Control de formulario para el select
   */
  selectControl = new FormControl();

  // Métodos para ControlValueAccessor
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Constructor del componente
   */
  constructor() {
    this.selectControl.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  /**
   * Implementación de ControlValueAccessor
   */
  writeValue(value: any): void {
    this.selectControl.setValue(value, { emitEvent: false });
  }

  /**
   * Registro de la función onChange
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registro de la función onTouched
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Configuración del estado deshabilitado
   */
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectControl.disable();
    } else {
      this.selectControl.enable();
    }
  }

  /**
   * Función para limpiar la selección
   */
  clear(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectControl.setValue(null);
    this.cleared.emit();
  }
}
