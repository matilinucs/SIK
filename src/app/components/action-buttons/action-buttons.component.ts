import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Interfaz para definir un botón de acción
 */
export interface ActionButton {
  /** Tipo de acción: 'view', 'edit', 'delete', 'custom' */
  action: string;
  /** Texto mostrado en el tooltip */
  tooltip: string;
  /** Nombre del icono de Material Design */
  icon: string;
  /** Color del botón (primary, accent, warn) */
  color?: string;
  /** Clase CSS adicional específica para este botón */
  class?: string;
  /** Deshabilitar el botón */
  disabled?: boolean;
  /** Datos personalizados que se pasarán en el evento cuando se haga clic */
  customData?: any;
}

/**
 * Componente para mostrar botones de acción de manera responsiva
 * En pantallas pequeñas, los botones se convierten en un menú desplegable
 */
@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss']
})
export class ActionButtonsComponent {
  /**
   * Configuración de los botones que se mostrarán
   */
  @Input() buttons: ActionButton[] = [];
  
  /**
   * Datos del elemento para el que se muestran los botones
   */
  @Input() data: any;
  
  /**
   * Color de fondo para el botón de menú (solo en modo móvil)
   */
  @Input() menuButtonColor: string = 'primary';
  
  /**
   * Tamaño de los botones: 'default', 'small', 'mini'
   */
  @Input() size: 'default' | 'small' | 'mini' = 'mini';
  
  /**
   * Ancho mínimo de pantalla en píxeles para mostrar todos los botones (menor que esto, se muestra menú)
   */
  @Input() responsiveBreakpoint: number = 768;
  
  /**
   * Evento emitido cuando se hace clic en un botón
   */
  @Output() action = new EventEmitter<{action: string, data: any, customData?: any}>();
  
  /**
   * Verifica si la pantalla está en modo móvil (debajo del breakpoint)
   */
  get isMobile(): boolean {
    return window.innerWidth < this.responsiveBreakpoint;
  }
  
  /**
   * Maneja el evento de clic en un botón
   */
  handleAction(actionType: string, event: MouseEvent, customData?: any): void {
    // Detener la propagación del evento para que no afecte a elementos padre
    event.stopPropagation();
    
    // Emitir el evento con el tipo de acción y los datos
    this.action.emit({
      action: actionType,
      data: this.data,
      customData
    });
  }
  
  /**
   * Obtiene el color del botón según el tipo de acción
   */
  getButtonColor(button: ActionButton): string {
    if (button.color) return button.color;
    
    // Colores predeterminados según el tipo de acción
    switch (button.action) {
      case 'view':
        return 'primary';
      case 'edit':
        return 'accent';
      case 'delete':
        return 'warn';
      default:
        return 'primary';
    }
  }
  
  /**
   * Obtiene la clase CSS del botón según el tipo de acción
   */
  getButtonClass(button: ActionButton): string {
    let classes = ['action-button'];
    
    if (button.action) {
      classes.push(`action-${button.action}`);
    }
    
    if (button.class) {
      classes.push(button.class);
    }
    
    return classes.join(' ');
  }
}
