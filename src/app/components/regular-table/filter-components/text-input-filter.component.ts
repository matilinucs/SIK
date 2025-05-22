import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Componente para filtrar datos mediante un campo de texto
 * Este componente permite al usuario ingresar texto libre para búsquedas
 * y emite eventos cuando cambia el valor o se limpia el campo
 */
@Component({
  selector: 'app-text-input-filter',
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
      useExisting: forwardRef(() => TextInputFilterComponent),
      multi: true
    }
  ],
  template: `
    <div class="text-filter-container">
      <mat-form-field appearance="outline" class="text-field">
        <mat-label>{{ label }}</mat-label>
        <input 
          matInput 
          type="text" 
          [formControl]="textControl"
          [placeholder]="placeholder"
          [attr.maxlength]="maxLength">
        <button 
          *ngIf="clearable && textControl.value" 
          matSuffix 
          mat-icon-button 
          type="button"
          aria-label="Limpiar" 
          (click)="clear($event)">
          <mat-icon>close</mat-icon>
        </button>
        <mat-hint *ngIf="showCharCount && maxLength">
          {{textControl.value?.length || 0}}/{{maxLength}}
        </mat-hint>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .text-filter-container {
      width: 100%;
    }

    .text-field {
      width: 100%;
    }
  `]
})
export class TextInputFilterComponent implements ControlValueAccessor {
  /**
   * Etiqueta del campo de texto
   */
  @Input() label: string = '';

  /**
   * Texto de placeholder cuando el campo está vacío
   */
  @Input() placeholder: string = '';

  /**
   * Si es posible limpiar el campo
   */
  @Input() clearable: boolean = true;

  /**
   * Longitud máxima del texto
   */
  @Input() maxLength?: number;

  /**
   * Si se debe mostrar el contador de caracteres
   */
  @Input() showCharCount: boolean = false;

  /**
   * Evento emitido cuando se limpia el campo
   */
  @Output() cleared = new EventEmitter<void>();

  /**
   * Control de formulario para el campo de texto
   */
  textControl = new FormControl('');

  // Métodos para ControlValueAccessor
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Constructor del componente
   */
  constructor() {
    this.textControl.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  /**
   * Implementación de ControlValueAccessor
   */
  writeValue(value: any): void {
    this.textControl.setValue(value, { emitEvent: false });
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
      this.textControl.disable();
    } else {
      this.textControl.enable();
    }
  }

  /**
   * Función para limpiar el campo
   */
  clear(event: Event): void {
    event.stopPropagation();
    this.textControl.setValue('');
    this.cleared.emit();
  }
}
