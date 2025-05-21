import { Component, Input, Output, EventEmitter, forwardRef, OnInit, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NgControl
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './custom-input.component.html',
  styleUrl: './custom-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true
    }
  ]
})
export class CustomInputComponent implements ControlValueAccessor, OnInit {
  /**
   * Tipo de input. Valores posibles:
   * - text: Texto normal
   * - number: Numérico
   * - email: Correo electrónico
   * - password: Contraseña
   * - tel: Número de teléfono
   * - date: Selector de fecha
   * - select: Selector desplegable
   * - textarea: Área de texto
   */
  @Input() type: 'text' | 'number' | 'email' | 'password' | 'tel' | 'date' | 'select' | 'textarea' = 'text';
  
  /**
   * Etiqueta del input
   */
  @Input() label: string = '';
  
  /**
   * Placeholder del input
   */
  @Input() placeholder: string = '';
  
  /**
   * Mensaje de ayuda bajo el input
   */
  @Input() hint: string = '';
  
  /**
   * Icono a mostrar al inicio del input
   */
  @Input() prefixIcon: string = '';
  
  /**
   * Icono a mostrar al final del input
   */
  @Input() suffixIcon: string = '';
  
  /**
   * Tooltip para el icono prefijo
   */
  @Input() prefixTooltip: string = '';
  
  /**
   * Tooltip para el icono sufijo
   */
  @Input() suffixTooltip: string = '';
  
  /**
   * Determina si el campo es requerido
   */
  @Input() required: boolean = false;
  
  /**
   * Determina si el campo está deshabilitado
   */
  @Input() disabled: boolean = false;
  
  /**
   * Número máximo de caracteres permitidos
   */
  @Input() maxLength?: number;
  
  /**
   * Número mínimo de caracteres requeridos
   */
  @Input() minLength?: number;
  
  /**
   * Valor máximo para el tipo number
   */
  @Input() max?: number;
  
  /**
   * Valor mínimo para el tipo number
   */
  @Input() min?: number;
  
  /**
   * Opciones para el tipo select
   */
  @Input() options: { value: any; viewValue: string }[] = [];
  
  /**
   * Determina si el campo debe ocupar todo el ancho disponible
   */
  @Input() fullWidth: boolean = true;
  
  /**
   * Clase CSS personalizada para el contenedor
   */
  @Input() customClass: string = '';
  
  /**
   * Apariencia del campo de Material Design
   */
  @Input() appearance: 'outline' | 'fill' = 'outline';
  
  /**
   * Patrón de validación para el campo
   */
  @Input() pattern?: string;
  
  /**
   * Evento emitido cuando se hace clic en el icono prefijo
   */
  @Output() prefixIconClick = new EventEmitter<void>();
  
  /**
   * Evento emitido cuando se hace clic en el icono sufijo
   */
  @Output() suffixIconClick = new EventEmitter<void>();
  
  /**
   * Control del formulario
   */
  inputControl = new FormControl();
  
  /**
   * Mensajes de error
   */
  @Input() errorMessages: { [key: string]: string } = {
    required: 'Este campo es requerido',
    email: 'Ingrese un correo electrónico válido',
    minlength: 'Longitud mínima no alcanzada',
    maxlength: 'Longitud máxima excedida',
    min: 'Valor mínimo no alcanzado',
    max: 'Valor máximo excedido',
    pattern: 'Formato no válido'
  };
  
  /**
   * Estado interno del campo
   */
  private _value: any = '';
  
  /**
   * Determina si se está mostrando la contraseña (para tipo password)
   */
  showPassword: boolean = false;
  
  constructor(@Optional() @Self() public ngControl: NgControl) {
    // Conectar este componente con el control de formulario padre
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }
  
  ngOnInit(): void {
    // Configurar validadores según las entradas
    if (this.ngControl && this.ngControl.control) {
      // Sincronizar estado de validación
      this.inputControl = this.ngControl.control as FormControl;
    }
    
    // Ajustar opciones específicas para ciertos tipos de input
    if (this.type === 'password' && !this.suffixIcon) {
      this.suffixIcon = 'visibility';
    }
  }
  
  /**
   * Devuelve si el campo tiene errores y ha sido tocado
   */
  get hasError(): boolean {
    return this.inputControl && this.inputControl.invalid && (this.inputControl.dirty || this.inputControl.touched);
  }
  
  /**
   * Obtiene el mensaje de error actual
   */
  getErrorMessage(): string {
    if (!this.inputControl || !this.inputControl.errors) return '';
    
    const errorKeys = Object.keys(this.inputControl.errors);
    if (errorKeys.length === 0) return '';
    
    const errorKey = errorKeys[0];
    return this.errorMessages[errorKey] || 'Campo no válido';
  }
  
  /**
   * Maneja el clic en el icono prefijo
   */
  onPrefixIconClick(event: Event): void {
    event.stopPropagation();
    this.prefixIconClick.emit();
  }
  
  /**
   * Maneja el clic en el icono sufijo
   */
  onSuffixIconClick(event: Event): void {
    event.stopPropagation();
    
    if (this.type === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.suffixIconClick.emit();
    }
  }
  
  /**
   * Obtiene el tipo de input para passwords (alterna entre password y text)
   */
  getPasswordInputType(): string {
    return this.showPassword ? 'text' : 'password';
  }
  
  /**
   * Obtiene el icono para la visibilidad de la contraseña
   */
  getPasswordVisibilityIcon(): string {
    return this.showPassword ? 'visibility_off' : 'visibility';
  }
  
  // Implementación de ControlValueAccessor
  
  writeValue(value: any): void {
    this._value = value;
    this.inputControl.setValue(value, { emitEvent: false });
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.inputControl.valueChanges.subscribe(fn);
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.inputControl.disable();
    } else {
      this.inputControl.enable();
    }
  }
  
  // Funciones de callback
  onChange = (_: any) => {};
  onTouched = () => {};
}
