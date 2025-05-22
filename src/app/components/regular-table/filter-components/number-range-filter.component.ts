import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ControlValueAccessor, 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Interface para los valores del filtro numérico
 */
export interface NumberRangeFilterValue {
  min: number | null;
  max: number | null;
}

/**
 * Componente para filtros de rango numérico
 * Este componente permite seleccionar un rango numérico con valores mínimo y máximo
 */
@Component({
  selector: 'app-number-range-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberRangeFilterComponent),
      multi: true
    }
  ],
  template: `
    <div class="number-range-filter-container">
      <form [formGroup]="rangeForm" class="range-form">
        <!-- Campo mínimo -->
        <mat-form-field appearance="outline" class="min-field">
          <mat-label>{{ minLabel }}</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="min"
            [attr.min]="absoluteMin"
            [attr.max]="absoluteMax"
            placeholder="{{ minPlaceholder }}">
          <button 
            *ngIf="clearable && rangeForm.get('min')?.value !== null" 
            matSuffix 
            mat-icon-button 
            type="button"
            aria-label="Limpiar" 
            (click)="clearMin($event)">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <!-- Campo máximo -->
        <mat-form-field appearance="outline" class="max-field">
          <mat-label>{{ maxLabel }}</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="max"
            [attr.min]="absoluteMin"
            [attr.max]="absoluteMax"
            placeholder="{{ maxPlaceholder }}">
          <button 
            *ngIf="clearable && rangeForm.get('max')?.value !== null" 
            matSuffix 
            mat-icon-button 
            type="button"
            aria-label="Limpiar" 
            (click)="clearMax($event)">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>
      </form>

      <button 
        *ngIf="clearable && (rangeForm.get('min')?.value !== null || rangeForm.get('max')?.value !== null)" 
        mat-icon-button 
        color="warn"
        class="clear-all-button"
        matTooltip="Limpiar todos los filtros"
        (click)="clearAll()">
        <mat-icon>clear</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .number-range-filter-container {
      width: 100%;
      position: relative;
    }

    .range-form {
      display: flex;
      gap: 16px;
      width: 100%;
    }

    .min-field, .max-field {
      flex: 1;
    }

    .clear-all-button {
      position: absolute;
      top: -12px;
      right: -12px;
      z-index: 1;
    }

    @media (max-width: 600px) {
      .range-form {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class NumberRangeFilterComponent implements ControlValueAccessor, OnInit {
  /**
   * Etiquetas para los campos
   */
  @Input() minLabel: string = 'Mínimo';
  @Input() maxLabel: string = 'Máximo';
  @Input() minPlaceholder: string = 'Valor mínimo';
  @Input() maxPlaceholder: string = 'Valor máximo';

  /**
   * Valores absolutos para el rango
   */
  @Input() absoluteMin?: number;
  @Input() absoluteMax?: number;

  /**
   * Si se pueden limpiar los campos
   */
  @Input() clearable: boolean = true;

  /**
   * Evento emitido cuando se limpia el campo mínimo
   */
  @Output() minCleared = new EventEmitter<void>();

  /**
   * Evento emitido cuando se limpia el campo máximo
   */
  @Output() maxCleared = new EventEmitter<void>();

  /**
   * Evento emitido cuando se limpian ambos campos
   */
  @Output() allCleared = new EventEmitter<void>();

  /**
   * Formulario para el rango
   */
  rangeForm: FormGroup;

  // Métodos para ControlValueAccessor
  private onChange: (value: NumberRangeFilterValue) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Constructor del componente
   */
  constructor(private fb: FormBuilder) {
    this.rangeForm = this.fb.group({
      min: [null],
      max: [null]
    });
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.rangeForm.valueChanges.subscribe((value: NumberRangeFilterValue) => {
      this.onChange(value);
      this.onTouched();
    });
  }

  /**
   * Implementación de ControlValueAccessor
   */
  writeValue(value: NumberRangeFilterValue | null): void {
    if (value) {
      this.rangeForm.patchValue(value, { emitEvent: false });
    } else {
      this.rangeForm.reset(null, { emitEvent: false });
    }
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
      this.rangeForm.disable();
    } else {
      this.rangeForm.enable();
    }
  }

  /**
   * Limpia el campo mínimo
   */
  clearMin(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.rangeForm.get('min')?.setValue(null);
    this.minCleared.emit();
  }

  /**
   * Limpia el campo máximo
   */
  clearMax(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.rangeForm.get('max')?.setValue(null);
    this.maxCleared.emit();
  }

  /**
   * Limpia ambos campos
   */
  clearAll(): void {
    this.rangeForm.reset();
    this.allCleared.emit();
  }
}
