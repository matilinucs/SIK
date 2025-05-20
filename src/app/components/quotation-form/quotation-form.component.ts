import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * Interfaz para los datos del formulario de cotización
 */
export interface QuotationFormData {
  clientId: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  marginPercent: number;
}

/**
 * Interfaz para cliente
 */
interface Client {
  id: string;
  name: string;
}

/**
 * Interfaz para proyecto
 */
interface Project {
  id: string;
  name: string;
}

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './quotation-form.component.html',
  styleUrl: './quotation-form.component.scss'
})
export class QuotationFormComponent implements OnInit {
  /**
   * Formulario reactivo para la cotización
   */
  quotationForm: FormGroup;

  /**
   * Lista de clientes (simulada para demostración)
   */
  clients: Client[] = [
    { id: 'c1', name: 'Empresa Constructora S.A.' },
    { id: 'c2', name: 'Inmobiliaria Los Pinos' },
    { id: 'c3', name: 'Constructora Norte' },
    { id: 'c4', name: 'Desarrollo Urbano S.A.' }
  ];

  /**
   * Lista de proyectos (simulada para demostración)
   */
  projects: Project[] = [
    { id: 'p1', name: 'Edificio Céntrico' },
    { id: 'p2', name: 'Conjunto Residencial Las Flores' },
    { id: 'p3', name: 'Centro Comercial Plaza Norte' },
    { id: 'p4', name: 'Torres El Mirador' }
  ];
  
  /**
   * Constructor del componente
   * @param dialogRef Referencia al diálogo para controlarlo
   * @param data Datos iniciales para el formulario (opcional)
   * @param fb Constructor de formularios
   */
  constructor(
    public dialogRef: MatDialogRef<QuotationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuotationFormData | null,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario
    this.quotationForm = this.fb.group({
      // Pestaña de información general
      generalInfo: this.fb.group({
        clientId: ['', Validators.required],
        projectId: ['', Validators.required],
        startDate: [new Date(), Validators.required],
        endDate: [new Date(), Validators.required],
        status: ['en_proceso', Validators.required]
      }),
      // Pestaña de costos
      costs: this.fb.group({
        marginPercent: [25, [Validators.required, Validators.min(0), Validators.max(100)]]
      })
    });
  }
  
  /**
   * Ciclo de vida: inicialización
   * Carga datos iniciales si se proporcionan
   */
  ngOnInit(): void {
    // Si se proporcionan datos iniciales, cargar en el formulario
    if (this.data) {
      this.quotationForm.patchValue({
        generalInfo: {
          clientId: this.data.clientId,
          projectId: this.data.projectId,
          startDate: this.data.startDate,
          endDate: this.data.endDate,
          status: this.data.status
        },
        costs: {
          marginPercent: this.data.marginPercent
        }
      });
    }

    // Bloquear el campo de estado
    this.quotationForm.get('generalInfo.status')?.disable();
  }
  
  /**
   * Valida el formulario y devuelve los datos si es válido
   */  onSubmit(): void {
    if (this.quotationForm.valid) {
      // Extraer valores del formulario
      const formValue = this.quotationForm.value;
      
      // Crear objeto con los datos a devolver
      const result: QuotationFormData = {
        clientId: formValue.generalInfo.clientId,
        projectId: formValue.generalInfo.projectId,
        startDate: formValue.generalInfo.startDate,
        endDate: formValue.generalInfo.endDate,
        status: formValue.generalInfo.status,
        marginPercent: formValue.costs.marginPercent
      };
      
      // Cerrar el diálogo devolviendo los datos
      this.dialogRef.close(result);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.quotationForm.markAllAsTouched();
    }
  }
  
  /**
   * Cierra el diálogo sin guardar cambios
   */
  onCancel(): void {
    this.dialogRef.close();
  }
  
  /**
   * Verifica si un campo específico tiene errores
   * @param formGroupName Nombre del grupo de formulario
   * @param controlName Nombre del control a verificar
   * @returns Verdadero si el campo tiene errores y ha sido tocado
   */
  hasError(formGroupName: string, controlName: string): boolean {
    const control = this.quotationForm.get(`${formGroupName}.${controlName}`);
    return !!(control && control.touched && control.invalid);
  }
  
  /**
   * Obtiene el mensaje de error para un campo específico
   * @param formGroupName Nombre del grupo de formulario
   * @param controlName Nombre del control a verificar
   * @returns Mensaje de error apropiado
   */
  getErrorMessage(formGroupName: string, controlName: string): string {
    const control = this.quotationForm.get(`${formGroupName}.${controlName}`);
    
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control.hasError('min')) {
      return `El valor debe ser mayor o igual a ${control.errors?.['min'].min}`;
    }
    
    if (control.hasError('max')) {
      return `El valor debe ser menor o igual a ${control.errors?.['max'].max}`;
    }
    
    return 'Campo inválido';
  }
}
