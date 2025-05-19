import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';

import { Product3 } from '../../models/product.model';
// Importar SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
    MatCardModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  @Input() initialProduct: Product3 | null = null; // Renombrado de 'product' a 'initialProduct'
  @Output() saveProduct = new EventEmitter<Product3>(); // Renombrado de 'productSaved' a 'saveProduct'
  @Output() cancelEdit = new EventEmitter<void>(); // Nuevo EventEmitter

  productForm!: FormGroup;
  imagePreview: string | null = null;
  planPreview: string | null = null;
  totalCost: number = 0;

  // Unidades de medida
  measurementUnits = [
    { value: 'mm', label: 'mm', factor: 1 },
    { value: 'cm', label: 'cm', factor: 10 },
    { value: 'm', label: 'm', factor: 1000 }
  ];
  selectedUnit = 'mm';
  
  // Lista de habitaciones y viviendas añadidas
  roomsList: { id: number, name: string, type: string }[] = [];
  roomTypes = ['Habitación', 'Sala', 'Cocina', 'Baño', 'Comedor', 'Oficina', 'Otro'];
  housingTypes = ['Casa unifamiliar', 'Edificio', 'Departamento', 'Local comercial', 'Oficina', 'Otro'];
  nextRoomId = 1;
  
  // Opciones para los selectores
  currencyOptions = ['USD', 'MXN', 'EUR'];
  taxOptions = [
    { value: 0.16, label: '16%' },
    { value: 0, label: '0%' },
    { value: 'exempt', label: 'Exento' }
  ];
  
  // Opciones para los campos técnicos
  materialTypes = ['PVC', 'Aluminio'];
  profileTypes = ['SUPLE 25X75', '2 PROFILE 40x80', 'TRACK 60x30', 'FRAME 80x40'];
  colorOptions = ['WHITE', 'BLACK', 'SILVER', 'BRONZE', 'CUSTOM'];
  
  glassTypes = ['TEMPERED', 'LAMINATED', 'DOUBLE', 'LOW-E', 'TINTED'];
  glassThickness = ['5+12+5', '3+0,38+3', '4+16+4', '6mm', '8mm', '10mm'];
  protectionOptions = ['Film 2 caras', 'UV Protection', 'Seguridad', 'Ninguno'];
  
  openingSystems = ['FIX+SLIDING', 'CASEMENT DOOR', 'SLIDING WINDOW', 'TILT & TURN', 'FOLDING'];
  handleOptions = ['Estándar', 'Premium', 'Minimalista', 'Oculta'];
  
  climateOptions = ['Humedad', 'Frío extremo', 'Calor extremo', 'Zona costera', 'Estándar'];
  regulationOptions = ['ISO 9001', 'Norma Europea', 'ASTM', 'Local'];
  
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar ) {}
    ngOnInit(): void {
    this.createForm();
    if (this.initialProduct) {
      this.editProduct(this.initialProduct);
    }
    // No llamar a applyValidators y setupSubscriptions aquí si se hace en createForm con setTimeout
  }

  private createForm(): void {
    this.productForm = this.fb.nonNullable.group({
      id: [null as string | null], // Añadir ID al formulario para manejar ediciones
      generalData: this.fb.group({
        productType: ['ventana'],
        productCode: [''],
        quantity: [1, [Validators.required, Validators.min(1)]],  // Removidos validadores iniciales
        dimensions: this.fb.group({
          width: [0, [Validators.required, Validators.min(0.001)]],
          height: [0, [Validators.required, Validators.min(0.001)]],
          length: [0], // Length puede no ser siempre requerido o ser 0
          unit: ['mm']
        }),
        locations: this.fb.group({
          roomType: [''],
          housingType: [''],
          customName: ['']
        }),
        productImage: ['']
      }),
      
      technicalSpecs: this.fb.group({
        material: this.fb.group({
          type: [''],
          profile: [''],
          color: [''],
          customColor: ['']
        }),
        glass: this.fb.group({
          type: [''],
          thickness: [''],
          protection: ['']
        }),
        opening: this.fb.group({
          system: [''],
          handle: ['']
        }),
        installation: this.fb.group({
          climateResistance: [''],
          regulation: ['']
        }),
        additionalFeatures: this.fb.array([])
      }),
      
      costs: this.fb.group({
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        currency: ['USD'],
        tax: [0.16],
        totalArea: [0] // Campo para mostrar el área calculada (opcional en el form)
      }),
      description: [''], // Campo de descripción que estaba en el modelo Product3
      plans: this.fb.group({
        technicalPlan: [''],
        clientApproved: [false]
      })
    });

    // Retrasar la aplicación de validadores y suscripciones
    // para asegurar que el DOM esté listo si es necesario.
    setTimeout(() => {
      // this.applyValidators(); // applyValidators ya no es necesario si se definen en la creación
      this.setupValueChangesSubscriptions(); // Renombrado para claridad
    }, 0);
  }

  /**
   * Configura las suscripciones a los cambios de valor en el formulario,
   * por ejemplo, para calcular automáticamente el área total.
   */
  private setupValueChangesSubscriptions(): void {
    const dimensions = this.productForm.get('generalData.dimensions');
    const unitControl = dimensions?.get('unit');
    const widthControl = dimensions?.get('width');
    const heightControl = dimensions?.get('height');

    if (unitControl) {
      unitControl.valueChanges.subscribe((newUnit: string) => {
        if (newUnit !== this.selectedUnit) {
          // Asegurarse que los valores de width/height sean números antes de convertir
          const currentWidth = Number(widthControl?.value);
          const currentHeight = Number(heightControl?.value);
          this.convertDimensions(this.selectedUnit, newUnit, currentWidth, currentHeight);
          this.selectedUnit = newUnit;
          this.calculateAndSetTotalArea();
        }
      });
    }

    if (widthControl && heightControl) {
      widthControl.valueChanges.subscribe(() => this.calculateAndSetTotalArea());
      heightControl.valueChanges.subscribe(() => this.calculateAndSetTotalArea());
    }
  }

  /**
   * Convierte las dimensiones (ancho y alto) de una unidad a otra y actualiza el formulario.
   * @param oldUnit Unidad actual de las dimensiones.
   * @param newUnit Nueva unidad a la que se convertirán las dimensiones.
   * @param currentWidth Valor actual del ancho.
   * @param currentHeight Valor actual del alto.
   */
  private convertDimensions(oldUnit: string, newUnit: string, currentWidth: number, currentHeight: number): void {
    const oldUnitData = this.measurementUnits.find(u => u.value === oldUnit);
    const newUnitData = this.measurementUnits.find(u => u.value === newUnit);

    if (!oldUnitData || !newUnitData || !this.productForm) {
      return;
    }

    const dimensionsGroup = this.productForm.get('generalData.dimensions');
    if (!dimensionsGroup) return;

    const widthControl = dimensionsGroup.get('width');
    const heightControl = dimensionsGroup.get('height');

    if (widthControl && !isNaN(currentWidth)) {
      const widthInMm = currentWidth * oldUnitData.factor;
      widthControl.setValue(parseFloat((widthInMm / newUnitData.factor).toFixed(3)), { emitEvent: false });
    }

    if (heightControl && !isNaN(currentHeight)) {
      const heightInMm = currentHeight * oldUnitData.factor;
      heightControl.setValue(parseFloat((heightInMm / newUnitData.factor).toFixed(3)), { emitEvent: false });
    }
    // No es necesario convertir 'length' aquí a menos que se especifique.
  }
  
  /**
   * Calcula el área total basándose en las dimensiones (ancho y alto)
   * y actualiza el campo totalArea en el formulario.
   * Asume que el área es width * height.
   * La conversión a m² se maneja si las unidades no son metros.
   */
  private calculateAndSetTotalArea(): void {
    const dimensions = this.productForm.get('generalData.dimensions')?.value;
    if (dimensions && typeof dimensions.width === 'number' && typeof dimensions.height === 'number') {
      let widthInMeters = dimensions.width;
      let heightInMeters = dimensions.height;
      const unitFactor = this.measurementUnits.find(u => u.value === dimensions.unit)?.factor || 1;

      // Convertir a metros si la unidad no es 'm'
      if (dimensions.unit === 'mm') {
        widthInMeters /= 1000;
        heightInMeters /= 1000;
      } else if (dimensions.unit === 'cm') {
        widthInMeters /= 100;
        heightInMeters /= 100;
      }
      // Si ya está en 'm', no se necesita conversión.

      const area = widthInMeters * heightInMeters;
      
      // Actualiza el campo totalArea en el grupo 'costs' del formulario.
      // Esto es si quieres que el campo 'totalArea' sea parte del modelo del formulario.
      // this.productForm.get('costs.totalArea')?.setValue(parseFloat(area.toFixed(3)), { emitEvent: false });
      
      // Si 'totalArea' es solo para visualización o para el modelo Product3,
      // puedes almacenarlo en una propiedad del componente o directamente en el objeto
      // que se emitirá. Por ahora, lo dejaremos sin setear en el form group 'costs'
      // ya que el modelo Product3 tiene su propio campo totalArea.
      // El valor se asignará al objeto Product3 antes de emitirlo en onSubmit.
    }
  }

  incrementQuantity(): void {
    const quantityControl = this.productForm.get('generalData.quantity');
    if (quantityControl) {
      quantityControl.setValue(+quantityControl.value + 1);
    }
  }

  decrementQuantity(): void {
    const quantityControl = this.productForm.get('generalData.quantity');
    if (quantityControl && quantityControl.value > 1) {
      quantityControl.setValue(+quantityControl.value - 1);
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidImageFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.productForm.get('generalData.productImage')?.setValue(file);
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Por favor seleccione una imagen válida (JPG/PNG, máx. 5MB)', 'Cerrar', {
        duration: 5000
      });
    }
  }

  onPlanSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidPlanFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        this.planPreview = reader.result as string;
        this.productForm.get('plans.technicalPlan')?.setValue(file);
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBar.open('Por favor seleccione un archivo válido (PDF/DWG/JPEG, máx. 10MB)', 'Cerrar', {
        duration: 5000
      });
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  isValidPlanFile(file: File): boolean {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/dwg', 'application/octet-stream'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return (validTypes.includes(file.type) || file.name.endsWith('.dwg')) && file.size <= maxSize;
  }

  addFeature(): void {
    const featuresArray = this.productForm.get('technicalSpecs.additionalFeatures') as FormArray;
    const featureGroup = this.fb.group({
      name: ['', Validators.required],
      value: ['', Validators.required]
    });
    featuresArray.push(featureGroup);
  }

  removeFeature(index: number): void {
    const featuresArray = this.productForm.get('technicalSpecs.additionalFeatures') as FormArray;
    featuresArray.removeAt(index);
  }

  get additionalFeatures(): FormArray {
    return this.productForm.get('technicalSpecs.additionalFeatures') as FormArray;
  }

  getFeatureFormGroup(index: number): FormGroup {
    return (this.additionalFeatures.at(index) as FormGroup);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  editProduct(product: Product3): void {
    this.initialProduct = product;
    this.productForm.reset(); // Limpia el formulario antes de establecer nuevos valores

    // Mapeo cuidadoso del producto al formulario, incluyendo el ID
    this.productForm.patchValue({
      id: product.id, // Establecer el ID
      generalData: {
        productType: product.type, // Asumiendo que 'type' en Product3 mapea a 'productType'
        productCode: product.productCode,
        quantity: product.quantity,
        dimensions: {
          width: product.dimensions?.width,
          height: product.dimensions?.height,
          length: product.dimensions?.length,
          unit: product.dimensions?.unit,
        },
        // locations: { ... } // Mapear si es necesario
        // productImage: product.image // Mapear si es necesario
      },
      technicalSpecs: {
        material: product.material,
        glass: product.glass,
        // opening: { ... }
        // installation: { ... }
        // additionalFeatures: product.features // Mapear si es necesario
      },
      costs: {
        unitPrice: product.budget / (product.quantity || 1), // Calcular precio unitario si no está directo
        currency: 'USD', // Asumir o mapear
        tax: 0.16, // Asumir o mapear
        totalArea: product.totalArea // Establecer el área total del producto existente
      },
      description: product.description,
      // plans: { ... } // Mapear si es necesario
    });
    this.productForm.enable(); // Habilita el formulario para edición
    // this.calculateAndSetTotalArea(); // Calcular y mostrar área al editar
  }

  resetForm(): void {
    this.initialProduct = null;
    this.productForm.reset({
      generalData: { productType: 'ventana', quantity: 1, dimensions: { unit: 'mm' } },
      costs: { currency: 'USD', tax: 0.16 }
      // Establecer otros valores por defecto si es necesario
    });
    this.imagePreview = null;
    this.planPreview = null;
    this.productForm.disable(); // Opcional: deshabilitar hasta que se pulse "Añadir" explícitamente
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.snackBar.open('Por favor, complete todos los campos requeridos.', 'Cerrar', { duration: 3000 });
      // Marcar todos los campos como tocados para mostrar errores
      Object.values(this.productForm.controls).forEach(control => {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(innerControl => {
            innerControl.markAsTouched();
          });
        }
      });
      return;
    }

    const formValue = this.productForm.getRawValue();
    
    // Calcular área aquí antes de construir el objeto producto, si no se actualiza en 'costs.totalArea'
    let calculatedArea = 0;
    const dims = formValue.generalData.dimensions;
    if (dims && typeof dims.width === 'number' && typeof dims.height === 'number') {
      let wM = dims.width;
      let hM = dims.height;
      if (dims.unit === 'mm') { wM /= 1000; hM /= 1000; }
      else if (dims.unit === 'cm') { wM /= 100; hM /= 100; }
      calculatedArea = parseFloat((wM * hM).toFixed(3));
    }

    const productToSave: Product3 = {
      id: formValue.id || 'prod-' + new Date().getTime().toString(), // Generar ID si es nuevo
      productCode: formValue.generalData.productCode,
      type: formValue.generalData.productType,
      quantity: formValue.generalData.quantity,
      totalArea: calculatedArea, // Usar el área calculada
      budget: (formValue.costs.unitPrice || 0) * (formValue.generalData.quantity || 1), // Calcular presupuesto total
      description: formValue.description,
      dimensions: {
        width: formValue.generalData.dimensions.width,
        height: formValue.generalData.dimensions.height,
        length: formValue.generalData.dimensions.length,
        unit: formValue.generalData.dimensions.unit,
      },
      material: {
        type: formValue.technicalSpecs.material.type,
        profile: formValue.technicalSpecs.material.profile,
        color: formValue.technicalSpecs.material.color,
        // customColor: formValue.technicalSpecs.material.customColor, // Si existe
      },
      glass: {
        type: formValue.technicalSpecs.glass.type,
        thickness: formValue.technicalSpecs.glass.thickness,
        protection: formValue.technicalSpecs.glass.protection,
      },
      // Añadir otras propiedades mapeadas desde technicalSpecs, plans, etc.
    };

    this.saveProduct.emit(productToSave);
    // No resetear el formulario aquí si se hace en el componente padre (CreateProductComponent)
    // o si es un modal que se cierra.
  }

  onCancel(): void {
    this.cancelEdit.emit();
    // this.resetForm(); // El componente padre decidirá si resetear o no
  }
  
  // Función auxiliar para calcular el área (ejemplo, ajústala a tu lógica)
  private calculateTotalArea(dimensions: any): number {
    if (dimensions && dimensions.width && dimensions.height) {
      // Considerar la unidad para la conversión si es necesario antes de calcular
      const widthInMeters = this.convertToMeters(dimensions.width, dimensions.unit);
      const heightInMeters = this.convertToMeters(dimensions.height, dimensions.unit);
      return widthInMeters * heightInMeters;
    }
    return 0;
  }

  private convertToMeters(value: number, unit: string): number {
    switch (unit) {
      case 'mm': return value / 1000;
      case 'cm': return value / 100;
      case 'm': return value;
      default: return value; // O manejar error
    }
  }
  
  // Asegúrate de que el método showErrorNotification exista o impleméntalo
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar'] // Puedes definir estilos para 'error-snackbar'
    });
  }
}
