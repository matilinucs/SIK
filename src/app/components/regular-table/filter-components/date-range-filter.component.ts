import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  NG_VALUE_ACCESSOR, 
  ControlValueAccessor
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

/**
 * Interface para los valores del filtro de fecha
 */
export interface DateRangeFilterValue {
  start: Date | null;
  end: Date | null;
}

/**
 * Componente para filtros de rango de fechas
 * Este componente permite seleccionar un rango de fechas con fecha de inicio y fin
 */
@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeFilterComponent),
      multi: true
    }
  ],
  template: `
    <div class="date-range-filter-container">
      <form [formGroup]="dateForm" class="date-form">
        <!-- Fecha de inicio -->
        <mat-form-field appearance="outline" class="start-field">
          <mat-label>{{ startLabel }}</mat-label>
          <input 
            matInput 
            [matDatepicker]="startPicker" 
            formControlName="start"
            placeholder="{{ startPlaceholder }}">
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
          <button 
            *ngIf="clearable && dateForm.get('start')?.value" 
            matSuffix 
            mat-icon-button 
            type="button"
            aria-label="Limpiar" 
            (click)="clearStart($event)">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <!-- Fecha de fin -->
        <mat-form-field appearance="outline" class="end-field">
          <mat-label>{{ endLabel }}</mat-label>
          <input 
            matInput 
            [matDatepicker]="endPicker" 
            formControlName="end"
            placeholder="{{ endPlaceholder }}">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          <button 
            *ngIf="clearable && dateForm.get('end')?.value" 
            matSuffix 
            mat-icon-button 
            type="button"
            aria-label="Limpiar" 
            (click)="clearEnd($event)">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>
      </form>

      <button 
        *ngIf="clearable && (dateForm.get('start')?.value || dateForm.get('end')?.value)" 
        mat-icon-button 
        color="warn"
        class="clear-all-button"
        matTooltip="Limpiar rango de fechas"
        (click)="clearAll()">
        <mat-icon>clear</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .date-range-filter-container {
      width: 100%;
      position: relative;
    }

    .date-form {
      display: flex;
      gap: 16px;
      width: 100%;
    }

    .start-field, .end-field {
      flex: 1;
    }

    .clear-all-button {
      position: absolute;
      top: -12px;
      right: -12px;
      z-index: 1;
    }

    @media (max-width: 600px) {
      .date-form {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class DateRangeFilterComponent implements ControlValueAccessor, OnInit {
  /**
   * Etiquetas para los campos de fecha
   */
  @Input() startLabel: string = 'Fecha inicial';
  @Input() endLabel: string = 'Fecha final';
  @Input() startPlaceholder: string = 'Seleccione fecha inicial';
  @Input() endPlaceholder: string = 'Seleccione fecha final';

  /**
   * Si es posible limpiar las fechas
   */
  @Input() clearable: boolean = true;

  /**
   * Fecha mínima permitida
   */
  @Input() minDate?: Date;

  /**
   * Fecha máxima permitida
   */
  @Input() maxDate?: Date;
  
  /**
   * Evento emitido cuando se limpia la fecha de inicio
   */
  @Output() startCleared = new EventEmitter<void>();

  /**
   * Evento emitido cuando se limpia la fecha de fin
   */
  @Output() endCleared = new EventEmitter<void>();

  /**
   * Evento emitido cuando se limpian ambas fechas
   */
  @Output() allCleared = new EventEmitter<void>();

  /**
   * Formulario para el rango de fechas
   */
  dateForm: FormGroup;

  // Métodos para ControlValueAccessor
  private onChange: (value: DateRangeFilterValue) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Constructor del componente
   */
  constructor(private fb: FormBuilder) {
    this.dateForm = this.fb.group({
      start: [null],
      end: [null]
    });
  }

  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.dateForm.valueChanges.subscribe((value: DateRangeFilterValue) => {
      this.onChange(value);
      this.onTouched();
    });
  }

  /**
   * Implementación de ControlValueAccessor
   */
  writeValue(value: DateRangeFilterValue | null): void {
    if (value) {
      this.dateForm.patchValue({
        start: value.start,
        end: value.end
      }, { emitEvent: false });
    } else {
      this.dateForm.reset(null, { emitEvent: false });
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
      this.dateForm.disable();
    } else {
      this.dateForm.enable();
    }
  }

  /**
   * Limpia la fecha de inicio
   */
  clearStart(event: Event): void {
    event.stopPropagation();
    this.dateForm.get('start')?.setValue(null);
    this.startCleared.emit();
  }

  /**
   * Limpia la fecha de fin
   */
  clearEnd(event: Event): void {
    event.stopPropagation();
    this.dateForm.get('end')?.setValue(null);
    this.endCleared.emit();
  }

  /**
   * Limpia ambas fechas
   */
  clearAll(): void {
    this.dateForm.reset();
    this.allCleared.emit();
  }
}
