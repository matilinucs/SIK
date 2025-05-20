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
import { calculateTotalArea, handleImageSelection } from '../../utils/shared-functions';

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
  @Input() isUnifyMode: boolean = false; // Indica si el formulario está en modo unificación
  @Input() selectedProductsCount: number = 0; // Número de productos seleccionados para unificar
  @Input() showSubmitButton: boolean = true; // <-- NUEVA LÍNEA
  @Output() saveProduct = new EventEmitter<Product3>(); // Renombrado de 'productSaved' a 'saveProduct'
  @Output() cancelEdit = new EventEmitter<void>(); // Nuevo EventEmitter
  @Output() saveUnifiedChanges = new EventEmitter<{[key: string]: any}>(); // Para guardar cambios en modo unificación

  productForm!: FormGroup;
  imagePreview: string | null = null;
  planPreview: string | null = null;
  totalCost: number = 0;
  modifiedFields: {[key: string]: boolean} = {}; // Registra qué campos han sido modificados

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
  
  productTypes = [
    'Ventana Corrediza',
    'Ventana Batiente',
    'Ventana Oscilobatiente',
    'Puerta Corrediza',
    'Puerta Abatible',
    'Paño Fijo',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar ) {}
  ngOnInit(): void {
    this.createForm();
    if (this.initialProduct) {
      this.editProduct(this.initialProduct);
    }
    // No llamar a applyValidators y setupSubscriptions aquí si se hace en createForm con setTimeout
    
    if (this.isUnifyMode) {
      this.prepareForUnification();
    }
  }

  private createForm(): void {
    this.productForm = this.fb.nonNullable.group({      id: [null as string | null],
      generalData: this.fb.group({
        productType: ['ventana'], // Valor inicial, sin validadores
        productCode: [''], // Sin validadores
        quantity: [1], // Sin validadores
        dimensions: this.fb.group({
          width: [0], // Sin validadores
          height: [0], // Sin validadores
          length: [0], // Sin validadores
          unit: ['mm'] // Sin validadores
        }),
        locations: this.fb.group({
          roomType: [''], // Sin validadores
          housingType: [''], // Sin validadores
          customName: [''] // Sin validadores
        }),
        productImage: [''], // Sin validadores
        description: [''] // Movido aquí dentro de generalData
      }),
      
      technicalSpecs: this.fb.group({
        material: this.fb.group({
          type: [''], // Sin validadores
          profile: [''], // Sin validadores
          color: [''], // Sin validadores
          customColor: [''] // Sin validadores
        }),
        glass: this.fb.group({
          type: [''], // Sin validadores
          thickness: [''], // Sin validadores
          protection: [''] // Sin validadores
        }),
        opening: this.fb.group({
          system: [''], // Sin validadores
          handle: [''] // Sin validadores
        }),
        installation: this.fb.group({
          climateResistance: [''], // Sin validadores
          regulation: [''] // Sin validadores
        }),
        additionalFeatures: this.fb.array([]) // Sin validadores para el array en sí
      }),
      
      costs: this.fb.group({
        unitPrice: [0], // Sin validadores
        currency: ['USD'], // Sin validadores
        tax: [0.16], // Sin validadores
        totalArea: [0] // Sin validadores, se calcula dinámicamente
      }),
      description: [''], // Sin validadores
      plans: this.fb.group({
        technicalPlan: [''], // Sin validadores
        clientApproved: [false] // Sin validadores
      })
    });

    // Ya no es necesario llamar a removeValidators aquí si no se añaden en la creación
    // this.removeValidators(this.productForm); 

    setTimeout(() => {
      this.setupValueChangesSubscriptions();
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

  // Reemplazar el método onImageSelected con la función compartida
  onImageSelected(event: Event): void {
    handleImageSelection(event, (preview) => {
      this.imagePreview = preview;
    });
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
    const maxSize = 100 * 1024 * 1024; // 100MB
    return (validTypes.includes(file.type) || file.name.endsWith('.dwg')) && file.size <= maxSize;
  }

  addFeature(): void {
    const featuresArray = this.productForm.get('technicalSpecs.additionalFeatures') as FormArray;
    const featureGroup = this.fb.group({
      name: [''], // SIN VALIDADORES
      value: [''] // SIN VALIDADORES
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
    
    // Habilitar todos los campos para el modo "Agregar Producto"
    this.productForm.enable();
    
    // Reiniciar el modo del formulario y sus campos
    this.isUnifyMode = false;
    this.modifiedFields = {};
  }/**
   * Prepara el formulario para el modo de unificación
   * Resetea valores y elimina validadores para facilitar la modificación compartida
   */  prepareForUnification(): void {
    console.log("Preparando formulario para unificación");
    
    // No resetear todo el formulario, solo limpiar valores
    this.productForm.reset({
      generalData: { 
        productType: '', 
        quantity: null,
        dimensions: { unit: 'mm' }
      },
      costs: { 
        currency: 'USD',
        tax: 0.16 
      }
    });
    
    // Eliminar validadores y habilitar el formulario
    this.removeValidators(this.productForm);
    this.productForm.enable();
    
    // Asegurarse que isUnifyMode está establecido
    this.isUnifyMode = true;
    
    // Corregir posición de menús desplegables
    this.fixDropdownsInModal();
    
    // Suscribirse a cambios en el formulario para registrar campos modificados
    // Retrasar ligeramente para asegurar que el formulario está listo
    setTimeout(() => {
      this.trackFormChanges();
      console.log("Rastreadores de cambios configurados");
    }, 50);
  }
  
  /**
   * Corrige el comportamiento de los menús desplegables dentro de modales
   * Añade listeners para ajustar la posición de los paneles de mat-select
   */
  private fixDropdownsInModal(): void {
    // Solo hacer esto en modo unificación y con un pequeño retraso para asegurar que todo está listo
    if (!this.isUnifyMode) return;
    
    setTimeout(() => {
      // Obtener todos los selectores mat-select
      const selectElements = document.querySelectorAll('mat-select');
      
      // Para cada select, registrar un callback que se ejecutará al abrir el panel
      selectElements.forEach(select => {
        // Usar atributo personalizado para evitar duplicar listeners
        if (!select.hasAttribute('dropdown-fixed')) {
          select.setAttribute('dropdown-fixed', 'true');
          
          // Añadir un listener al clic para asegurarse que el panel aparece correctamente
          select.addEventListener('click', () => {
            // Dar tiempo a que el panel se abra
            setTimeout(() => {
              const panels = document.querySelectorAll('.mat-mdc-select-panel');
              panels.forEach(panel => {
                // Asegurar que el panel tiene z-index correcto
                if (panel instanceof HTMLElement) {
                  panel.style.zIndex = '1100';
                }
              });
            }, 10);
          });
        }
      });
      
      console.log('Corrección de dropdowns aplicada');
    }, 200);
  }
  
  /**
   * Elimina todos los validadores de un formGroup y sus controles hijos
   */
  private removeValidators(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup) {
        this.removeValidators(control);
      } else if (control) {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });
  }
  
  /**
   * Configura la suscripción para seguir los cambios en cada campo del formulario
   */
  private trackFormChanges(): void {
    this.trackControlChanges(this.productForm, '');
  }
    /**
   * Configura recursivamente suscripciones para controles y grupos
   */  private trackControlChanges(formGroup: FormGroup, path: string): void {
    Object.keys(formGroup.controls).forEach(controlName => {
      const control = formGroup.get(controlName);
      const currentPath = path ? `${path}.${controlName}` : controlName;
      
      if (control instanceof FormGroup) {
        this.trackControlChanges(control, currentPath);
      } else if (control) {
        // Limpiar cualquier suscripción anterior
        control.valueChanges.subscribe(value => {
          if (this.isUnifyMode) {
            console.log(`Campo modificado en unificación: ${currentPath} => ${value}`);
            // En modo unificación, registramos cualquier cambio explícito
            this.modifiedFields[currentPath] = true;
          } else {
            console.log(`Campo modificado normal: ${currentPath} => ${value}`);
          }
        });
      }
    });
  }
    /**
   * Obtiene un objeto con todos los campos que han sido modificados
   * y sus valores actuales, para usar en el modo unificación
   */
  getModifiedFieldsValues(): {[key: string]: any} {
    const formValue = this.productForm.getRawValue();
    const modifiedValues: {[key: string]: any} = {};

    console.log('Campos modificados registrados:', this.modifiedFields);
    console.log('Valores del formulario:', formValue);

    Object.keys(this.modifiedFields).forEach(path => {
      if (this.modifiedFields[path]) {
        const pathParts = path.split('.');
        let currentValue: any = formValue;
        
        // Navegar por el objeto anidado siguiendo la ruta
        for (const part of pathParts) {
          if (currentValue === undefined || currentValue === null) {
            console.log(`Valor indefinido en parte de la ruta: ${part} para ruta completa: ${path}`);
            break;
          }
          currentValue = currentValue[part];
        }
        
        // Incluir el valor aunque sea 0, cadena vacía, false, etc.
        if (currentValue !== undefined) {
          modifiedValues[path] = currentValue;
          console.log(`Valor extraído para ${path}: ${JSON.stringify(currentValue)}`);
        }
      }
    });

    console.log('Valores modificados finales:', modifiedValues);
    return modifiedValues;
  }
  /**
   * Sobrescribe onSubmit para manejar tanto guardar normal como unificación
   */  onSubmit(): void {
    console.log("[ProductFormComponent] onSubmit triggered");
    console.log("[ProductFormComponent] Form raw value:", this.productForm.getRawValue());
    console.log("[ProductFormComponent] Is Unify Mode:", this.isUnifyMode);
    
    // Comprobar explícitamente el modo unificación
    const isUnifyMode = this.isUnifyMode === true;    if (isUnifyMode) {
      console.log("[ProductFormComponent] Procesando cambios en modo unificación");
      
      // Obtener campos modificados sin filtrar campos vacíos
      const modifiedFieldsValues = this.getModifiedFieldsValues();
      const hasModifications = Object.keys(modifiedFieldsValues).length > 0;
      
      if (!hasModifications) {
        this.snackBar.open('No se han realizado cambios para aplicar', 'Cerrar', { duration: 3000 });
        return;
      }

      console.log("[ProductFormComponent] Emitting unified changes:", modifiedFieldsValues);
      this.saveUnifiedChanges.emit(modifiedFieldsValues);
      
      // Limpiar campos modificados después de emitir cambios
      this.modifiedFields = {};
    } else {
      const formValue = this.productForm.getRawValue();
      
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
        id: formValue.id || `prod-${new Date().getTime().toString()}`,
        productCode: formValue.generalData.productCode || '-',
        type: formValue.generalData.productType || '-',
        quantity: formValue.generalData.quantity ?? 0,
        totalArea: calculatedArea, // Usar el área calculada
        budget: (formValue.costs.unitPrice ?? 0) * (formValue.generalData.quantity ?? 1),
        description: formValue.description || '-',
        dimensions: {
          width: formValue.generalData.dimensions.width ?? 0,
          height: formValue.generalData.dimensions.height ?? 0,
          length: formValue.generalData.dimensions.length ?? 0,
          unit: formValue.generalData.dimensions.unit || 'mm'
        },
        material: {
          type: formValue.technicalSpecs.material.type || '-',
          profile: formValue.technicalSpecs.material.profile || '-',
          color: formValue.technicalSpecs.material.color || '-',
          customColor: formValue.technicalSpecs.material.customColor || null,
        },
        glass: {
          type: formValue.technicalSpecs.glass.type || '-',
          thickness: formValue.technicalSpecs.glass.thickness || '-',
          protection: formValue.technicalSpecs.glass.protection || '-',
        },
        opening: {
            system: formValue.technicalSpecs.opening?.system || '-',
            handle: formValue.technicalSpecs.opening?.handle || '-',
        },
        installation: {
            climateResistance: formValue.technicalSpecs.installation?.climateResistance || '-',
            regulation: formValue.technicalSpecs.installation?.regulation || '-',
        },
        additionalFeatures: formValue.technicalSpecs.additionalFeatures?.map((feature: any) => ({
            name: feature.name || '-',
            value: feature.value || '-',
        })) || [],
        plans: {
            technicalPlan: formValue.plans?.technicalPlan || null, // Podría ser string vacío o null
            clientApproved: formValue.plans?.clientApproved || false,
        },
        productImage: this.imagePreview || null,
        creationDate: this.initialProduct?.creationDate || new Date(),
        lastModified: new Date(),
        status: this.initialProduct?.status || 'En cotización',
        version: this.initialProduct?.version || 1,
        project: this.initialProduct?.project || null,
        supplier: this.initialProduct?.supplier || null,
        category: this.initialProduct?.category || '-',
        tags: this.initialProduct?.tags || [],
        notes: this.initialProduct?.notes || null,
        attachments: this.initialProduct?.attachments || [],
        relatedProducts: this.initialProduct?.relatedProducts || [],
        purchaseHistory: this.initialProduct?.purchaseHistory || [],
        stock: this.initialProduct?.stock || { quantity: 0, location: '-' },
        leadTime: this.initialProduct?.leadTime || 0,
        priority: this.initialProduct?.priority || 'Media',
        assignedTo: this.initialProduct?.assignedTo || null,
        client: this.initialProduct?.client || null,
        currency: formValue.costs.currency || 'USD', 
        tax: formValue.costs.tax ?? 0.16, 
        discount: this.initialProduct?.discount || 0,
        shippingCost: this.initialProduct?.shippingCost || 0,
        finalPrice: 0, // Se calculará después
        paymentTerms: this.initialProduct?.paymentTerms || '-',
        warranty: this.initialProduct?.warranty || '-',
        certifications: this.initialProduct?.certifications || [],
        environmentalImpact: this.initialProduct?.environmentalImpact || null,
        assemblyInstructions: this.initialProduct?.assemblyInstructions || null,
        maintenanceGuide: this.initialProduct?.maintenanceGuide || null,
        customFields: this.initialProduct?.customFields || {},
        location: {
          roomType: formValue.generalData.locations?.roomType || '-',
          housingType: formValue.generalData.locations?.housingType || '-',
          customName: formValue.generalData.locations?.customName || '-',
        }
      };
      
      // Calcular finalPrice (ejemplo básico, ajustar según lógica de negocio)
      let subtotal = productToSave.budget;
      let taxAmount = 0;
      if (typeof productToSave.tax === 'number') {
        taxAmount = subtotal * productToSave.tax;
      } else if (typeof productToSave.tax === 'object' && productToSave.tax !== null && 'rate' in productToSave.tax && typeof productToSave.tax.rate === 'number') {
        taxAmount = subtotal * productToSave.tax.rate;
      }
      
      let discountAmount = 0;
      if (typeof productToSave.discount === 'number') {
          discountAmount = subtotal * (productToSave.discount / 100); // Asume que el número es un porcentaje
      } else if (typeof productToSave.discount === 'object' && productToSave.discount !== null) {
          if ('percentage' in productToSave.discount && typeof productToSave.discount.percentage === 'number') {
            // @ts-ignore
            discountAmount = subtotal * (productToSave.discount.percentage / 100);
          } else if ('amount' in productToSave.discount && typeof productToSave.discount.amount === 'number') {
            // @ts-ignore
            discountAmount = productToSave.discount.amount;
          }
      }

      productToSave.finalPrice = subtotal + taxAmount - discountAmount + (productToSave.shippingCost || 0);

      console.log("[ProductFormComponent] Product to save:", productToSave);
      this.saveProduct.emit(productToSave);
    }
  }

  onCancel(): void {
    this.cancelEdit.emit();
    // this.resetForm(); // El componente padre decidirá si resetear o no
  }
  
  // Asegúrate de que el método showErrorNotification exista o impleméntalo
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar'] // Puedes definir estilos para 'error-snackbar'
    });
  }

  /**
   * Retorna el color del botón según el modo del formulario
   * - Unificar: morado
   * - Editar: verde
   * - Agregar: azul (primario)
   */
  getButtonColor(): string {
    if (this.isUnifyMode) {
      return ''; // Usará la clase CSS personalizada para el color morado
    } else if (this.initialProduct) {
      return 'accent'; // Verde para editar
    } else {
      return 'primary'; // Azul para agregar
    }
  }

  /**
   * Retorna el icono del botón según el modo del formulario
   * - Unificar: merge_type
   * - Editar: edit
   * - Agregar: save
   */
  getButtonIcon(): string {
    if (this.isUnifyMode) {
      return 'merge_type';
    } else if (this.initialProduct) {
      return 'edit';
    } else {
      return 'save';
    }
  }

  /**
   * Retorna el texto del botón según el modo del formulario
   * - Unificar: Unificar Productos
   * - Editar: Editar Producto
   * - Agregar: Guardar Producto
   */
  getButtonText(): string {
    if (this.isUnifyMode) {
      return 'Unificar Productos';
    } else if (this.initialProduct) {
      return 'Editar Producto';
    } else {
      return 'Guardar Producto';
    }
  }

  logUnifyButtonClick() {
    if (this.isUnifyMode) {
      console.log('[UNIFY] Botón "Unificar productos" clickeado en ProductFormComponent', {
        selectedProductsCount: this.selectedProductsCount,
        formValues: this.productForm.value
      });
    }
  }

  logUnifyCancelClick() {
    if (this.isUnifyMode) {
      console.log('[UNIFY] Botón "Salir de unificación (X)" clickeado en ProductFormComponent');
    }
  }
}
