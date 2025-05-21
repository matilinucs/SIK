/**
 * Componente para listar y filtrar cubicaciones
 * Implementa tabla interactiva con filtros avanzados y acciones rápidas
 * @author Sistema SIK
 * @lastModified 2025-05-16
 */
import { Component, OnInit, ViewChild, AfterViewInit, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { RegularTableComponent } from '../../components/regular-table/regular-table.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { QuotationFormComponent, QuotationFormData } from '../../components/quotation-form/quotation-form.component';
import { AlertDialogComponent } from '../../components/alert-dialog/alert-dialog.component';

/**
 * Estructura de datos para un producto en la cubicación
 */
interface QuotationProduct {
  /** Código único del producto */
  code: string;
  /** Tipo de ventana */
  windowType: string;
  /** Cantidad de unidades */
  quantity: number;
  /** Superficie total del producto en m² */
  totalArea: number;
  /** Presupuesto total del producto */
  budget: number;
}

/**
 * Estructura de datos para una cubicación
 */
interface Quotation {
  /** Identificador único de la cubicación */
  id: number;
  /** Nombre del proyecto asociado */
  projectName: string;
  /** Nombre del cliente */
  clientName: string;
  /** Fecha de creación de la cubicación */
  creationDate: Date;
  /** Estado actual de la cubicación */
  status: 'en_proceso' | 'aprobada' | 'rechazada';
  /** Cantidad de productos incluidos */
  productsCount: number;
  /** Monto total en USD */
  totalAmount: number;
  /** Lista de productos en la cubicación */
  products: QuotationProduct[];
}

/**
 * Opciones para los filtros desplegables
 */
interface FilterOptions {
  /** Lista de proyectos disponibles */
  projects: string[];
  /** Lista de clientes disponibles */
  clients: string[];
}

@Component({
  selector: 'app-list-quotation',
  standalone: true,
  imports: [
    // Módulos Angular
    CommonModule,
    ReactiveFormsModule,
    
    // Componentes Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    
    // Componentes personalizados
    RegularTableComponent
  ],
  templateUrl: './list-quotation.component.html',
  styleUrl: './list-quotation.component.scss'
})
export class ListQuotationComponent implements OnInit, AfterViewInit {
  /**
   * Referencia al paginador de la tabla
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  /**
   * Referencia al ordenador de la tabla
   */
  @ViewChild(MatSort) sort!: MatSort;
  
  /**
   * Columnas a mostrar en la tabla de cubicaciones
   */
  displayedColumns: string[] = [
    'quoteNumber',   // Número de cubicación (formato CUB-XXX)
    'projectName',   // Nombre del proyecto
    'clientName',    // Nombre del cliente
    'creationDate',  // Fecha de creación
    'status',        // Estado de la cubicación
    'productsCount', // Cantidad de productos
    'totalAmount',   // Monto total
    'actions'        // Botones de acción
  ];
  
  /**
   * Origen de datos para la tabla 
   */
  dataSource = new MatTableDataSource<Quotation>([]);
  
  /**
   * Opciones disponibles para los filtros
   */
  filterOptions: FilterOptions = {
    projects: [],
    clients: []
  };
  
  /**
   * Formulario reactivo para los controles de filtro
   */
  filterForm = new FormGroup({
    status: new FormControl<string>(''),
    project: new FormControl<string>(''),
    client: new FormControl<string>(''),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null)
    })
  });
    /**
   * Constructor del componente
   * @param router Servicio de enrutamiento para navegación
   * @param dialog Servicio de diálogo de Material
   * @param injector Inyector para servicios
   */
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private injector: Injector
  ) { }
  
  /**
   * Ciclo de vida: inicialización del componente
   */
  ngOnInit(): void {
    this.loadQuotations();
    this.extractFilterOptions();
    this.setupFilterListeners();
  }
  
  /**
   * Ciclo de vida: después de inicializar la vista
   * Configura paginación, ordenamiento y filtros personalizados
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.createFilterPredicate();
  }
  
  /**
   * Carga los datos de ejemplo para la tabla
   * En una implementación real, obtendría datos de un servicio
   */
  loadQuotations(): void {
    const quotations: Quotation[] = [
      {
        id: 1,
        projectName: 'Proyecto Torería',
        clientName: 'Juan Pérez',
        creationDate: new Date('2025-05-16'),
        status: 'en_proceso',
        productsCount: 2,
        totalAmount: 1066,
        products: [
          {
            code: 'VDR-001',
            windowType: 'Ventana Deslizante',
            quantity: 3,
            totalArea: 4.5,
            budget: 450
          },
          {
            code: 'VBT-002',
            windowType: 'Ventana Batiente',
            quantity: 2,
            totalArea: 6.2,
            budget: 616
          }
        ]
      },
      {
        id: 2,
        projectName: 'Proyecto Torería',
        clientName: 'María Gómez',
        creationDate: new Date('2025-05-16'),
        status: 'aprobada',
        productsCount: 20,
        totalAmount: 11023,
        products: [
          {
            code: 'VCR-003',
            windowType: 'Ventana Corrediza',
            quantity: 5,
            totalArea: 12.5,
            budget: 1250
          }
        ]
      },
      {
        id: 3,
        projectName: 'Remodelación Oficinas',
        clientName: 'Constructora ABC',
        creationDate: new Date('2025-05-15'),
        status: 'rechazada',
        productsCount: 5,
        totalAmount: 3500,
        products: [
          {
            code: 'P005',
            windowType: 'Tipo B',
            quantity: 2,
            totalArea: 7,
            budget: 1400
          },
          {
            code: 'P006',
            windowType: 'Tipo C',
            quantity: 3,
            totalArea: 15,
            budget: 2100
          }
        ]
      },
      {
        id: 4,
        projectName: 'Edificio Residencial',
        clientName: 'Inmobiliaria Los Robles',
        creationDate: new Date('2025-05-14'),
        status: 'aprobada',
        productsCount: 35,
        totalAmount: 28750,
        products: [
          {
            code: 'P007',
            windowType: 'Tipo A',
            quantity: 20,
            totalArea: 50,
            budget: 10000
          },
          {
            code: 'P008',
            windowType: 'Tipo B',
            quantity: 15,
            totalArea: 45,
            budget: 18750
          }
        ]
      },
      {
        id: 5,
        projectName: 'Centro Comercial',
        clientName: 'Inversiones Globales',
        creationDate: new Date('2025-05-10'),
        status: 'en_proceso',
        productsCount: 18,
        totalAmount: 15200,
        products: [
          {
            code: 'P009',
            windowType: 'Tipo C',
            quantity: 10,
            totalArea: 30,
            budget: 6000
          },
          {
            code: 'P010',
            windowType: 'Tipo A',
            quantity: 8,
            totalArea: 24,
            budget: 9200
          }
        ]
      }
    ];
    
    // Generar más datos de ejemplo para probar paginación
    for (let i = 6; i <= 30; i++) {
      quotations.push({
        id: i,
        projectName: `Proyecto #${i}`,
        clientName: `Cliente ${i}`,
        creationDate: new Date(2025, 4, Math.floor(Math.random() * 30) + 1),
        status: ['en_proceso', 'aprobada', 'rechazada'][Math.floor(Math.random() * 3)] as any,
        productsCount: Math.floor(Math.random() * 50) + 1,
        totalAmount: Math.floor(Math.random() * 50000) + 500,
        products: [
          {
            code: `P00${i}`,
            windowType: 'Tipo A',
            quantity: Math.floor(Math.random() * 10) + 1,
            totalArea: (Math.floor(Math.random() * 100) + 1) / 10,
            budget: Math.floor(Math.random() * 10000) + 1000
          }
        ]
      });
    }
    
    this.dataSource.data = quotations;
  }
  
 
  
  /**
   * Configura listeners reactivos para los controles de filtro
   */
  setupFilterListeners(): void {
    // Aplicar filtro con debounce para el campo de cliente
    this.filterForm.get('client')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
    
    // Aplicar filtros inmediatamente para los demás controles
    this.filterForm.get('status')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('project')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('dateRange')?.valueChanges.subscribe(() => this.applyFilters());
  }
  
  /**
   * Aplica todos los filtros a la tabla
   */
  applyFilters(): void {
    // Obtener valores actuales de los filtros
    const filterValues = {
      status: this.filterForm.get('status')?.value || '',
      project: this.filterForm.get('project')?.value || '',
      client: this.filterForm.get('client')?.value || '',
      dateStart: this.filterForm.get('dateRange.start')?.value,
      dateEnd: this.filterForm.get('dateRange.end')?.value
    };
    
    // Aplicar filtros utilizando el objeto como string para el filtro predicate
    this.dataSource.filter = JSON.stringify(filterValues);
    
    // Resetear la paginación
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Crea una función personalizada de filtrado para la tabla
   * @returns Función que determina si un elemento cumple con los filtros
   */
  createFilterPredicate(): (data: Quotation, filter: string) => boolean {
    return (data: Quotation, filter: string): boolean => {
      const filterValues = JSON.parse(filter);
      
      // Filtrar por estado
      if (filterValues.status && data.status !== filterValues.status) {
        return false;
      }
      
      // Filtrar por proyecto
      if (filterValues.project && data.projectName !== filterValues.project) {
        return false;
      }
      
      // Filtrar por cliente (búsqueda parcial, case insensitive)
      if (filterValues.client && !data.clientName.toLowerCase().includes(filterValues.client.toLowerCase())) {
        return false;
      }
      
      // Filtrar por rango de fechas
      if (filterValues.dateStart && filterValues.dateEnd) {
        const start = new Date(filterValues.dateStart);
        const end = new Date(filterValues.dateEnd);
        const date = new Date(data.creationDate);
        
        if (date < start || date > end) {
          return false;
        }
      }
      
      return true;
    };
  }
  
  /**
   * Limpia todos los filtros aplicados
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Formatea una fecha al formato DD-MMM-AAAA
   * @param date Fecha a formatear
   * @returns Cadena formateada
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    };
    
    return new Date(date).toLocaleDateString('es-ES', options);
  }
    /**
   * Formatea el ID de la cubicación al formato CUB-XXX
   * @param id ID numérico de la cubicación
   * @returns Código de cubicación formateado (ej: CUB-001)
   */  formatQuoteNumber(id: number): string {
    return `CUB-${id.toString().padStart(3, '0')}`;
  }
    
  /**
   * Obtiene el nombre del cliente a partir de su ID
   * En una implementación real, esto se obtendría de una base de datos
   * @param clientId ID del cliente
   * @returns Nombre del cliente
   */
  private getClientNameById(clientId: string): string {
    // Simulación: en una app real, esto obtendría el nombre desde un servicio
    const clientMap: Record<string, string> = {
      'c1': 'Empresa Constructora S.A.',
      'c2': 'Inmobiliaria Los Pinos',
      'c3': 'Constructora Norte',
      'c4': 'Desarrollo Urbano S.A.'
    };
    
    return clientMap[clientId] || 'Cliente Desconocido';
  }
  
  /**
   * Obtiene el nombre del proyecto a partir de su ID
   * En una implementación real, esto se obtendría de una base de datos
   * @param projectId ID del proyecto
   * @returns Nombre del proyecto
   */
  private getProjectNameById(projectId: string): string {
    // Simulación: en una app real, esto obtendría el nombre desde un servicio
    const projectMap: Record<string, string> = {
      'p1': 'Edificio Céntrico',
      'p2': 'Conjunto Residencial Las Flores',
      'p3': 'Centro Comercial Plaza Norte',
      'p4': 'Torres El Mirador'
    };
    
    return projectMap[projectId] || 'Proyecto Desconocido';
  }
  
  /**
   * Navega a la vista detallada de una cubicación
   * @param id ID de la cubicación a visualizar
   */

    /**
   * Navega a la página para agregar productos a una cubicación
   * @param id ID de la cubicación a modificar
   */
  addProductToQuotation(id: number): void {
    console.log(`Agregar productos a cubicación ${id}`);
    // Implementación futura: this.router.navigate(['/cubicaciones/agregar-productos', id]);
  }
  /**
   * Abre el formulario para crear una nueva cubicación.
   * Utiliza el QuotationFormComponent en un diálogo.
   */
  createNewQuotation(): void {
    const dialogRef = this.dialog.open(QuotationFormComponent, {
      width: '700px', // Ancho del diálogo
      disableClose: true, // Evitar cierre al hacer clic fuera
      data: null // No se pasan datos porque es una nueva cubicación
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processNewQuotation(result);
      }
    });
  }

  /**
   * Procesa los datos de una nueva cubicación creada.
   * @param formData Datos del formulario de la nueva cubicación.
   */
  processNewQuotation(formData: QuotationFormData): void {
    const newQuotation: Quotation = {
      id: this.dataSource.data.length + 1, 
      projectName: this.getProjectNameById(formData.projectId),
      clientName: this.getClientNameById(formData.clientId),
      creationDate: formData.startDate, 
      status: 'en_proceso', 
      productsCount: 0, 
      totalAmount: 0, 
      products: []
    };

    this.dataSource.data = [...this.dataSource.data, newQuotation];
    this.extractFilterOptions(); 

    this.dialog.open(AlertDialogComponent, {
      data: {
        title: 'Cubicación Agregada',
        message: `La cubicación CUB-${this.formatQuoteNumber(newQuotation.id)} ha sido creada exitosamente.`,
        icon: 'check_circle',
        iconColor: 'green'
      }
    });
  }

  /**
   * Muestra los detalles de una cubicación.
   * @param quotation La cubicación a visualizar.
   */
  viewQuotation(quotation: Quotation): void {
    console.log('Ver cubicación:', quotation);    
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: `Detalles de Cubicación CUB-${this.formatQuoteNumber(quotation.id)}`,
        message: `Proyecto: ${quotation.projectName}\\nCliente: ${quotation.clientName}\\nEstado: ${quotation.status}\\nProductos: ${quotation.productsCount}\\nTotal: ${quotation.totalAmount}`,
        icon: 'visibility',
        iconColor: 'blue'
      }
    });
  }

  /**
   * Abre el formulario para editar una cubicación existente.
   * @param quotation La cubicación a editar.
   */
  editQuotation(quotation: Quotation): void {
    // Para mapear de nombre a ID, necesitaríamos la lógica inversa o almacenar IDs en la tabla.
    // Por ahora, asumimos que QuotationFormData puede manejar nombres o que tienes un mapeo.
    // Si los IDs de cliente/proyecto son diferentes a los nombres, esto necesitará ajuste.
    const quotationDataForForm: QuotationFormData = {
      clientId: quotation.clientName, // Esto debería ser el ID del cliente si es diferente al nombre
      projectId: quotation.projectName, // Esto debería ser el ID del proyecto si es diferente al nombre
      startDate: quotation.creationDate,
      endDate: new Date(), // Debería ser la fecha de fin real si existe en `quotation`
      status: quotation.status,
      // Asumimos un margen por defecto o necesitarías obtenerlo de `quotation` si está disponible
      marginPercent: quotation.products[0]?.budget ? 20 : 20 // Ejemplo, ajustar según lógica real
    };

    const dialogRef = this.dialog.open(QuotationFormComponent, {
      width: '700px',
      disableClose: true,
      data: quotationDataForForm
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processEditedQuotation(quotation, result);
      }
    });
  }

  /**
   * Procesa los datos de una cubicación editada.
   * @param originalQuotation La cubicación original antes de la edición.
   * @param formData Los nuevos datos del formulario.
   */
  processEditedQuotation(originalQuotation: Quotation, formData: QuotationFormData): void {
    const index = this.dataSource.data.findIndex(q => q.id === originalQuotation.id);
    if (index > -1) {
      const updatedQuotation: Quotation = {
        ...this.dataSource.data[index],
        projectName: this.getProjectNameById(formData.projectId), // Mapear ID a nombre si es necesario
        clientName: this.getClientNameById(formData.clientId),   // Mapear ID a nombre si es necesario
        creationDate: formData.startDate,
        status: formData.status as 'en_proceso' | 'aprobada' | 'rechazada',
        // productsCount y totalAmount deberían recalcularse si los productos o costos cambian.
      };
      
      const currentData = this.dataSource.data;
      currentData[index] = updatedQuotation;
      this.dataSource.data = [...currentData];
      this.extractFilterOptions(); // Actualizar filtros por si cambian nombres de proyecto/cliente

      this.dialog.open(AlertDialogComponent, {
        data: {
          title: 'Cubicación Actualizada',
          message: `La cubicación CUB-${this.formatQuoteNumber(updatedQuotation.id)} ha sido actualizada.`,
          icon: 'check_circle',
          iconColor: 'green'
        }
      });
    }
  }

  /**
   * Elimina una cubicación después de confirmación.
   * @param quotation La cubicación a eliminar.
   */
  deleteQuotation(quotation: Quotation): void {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar la cubicación CUB-${this.formatQuoteNumber(quotation.id)} (${quotation.projectName})? Esta acción no se puede deshacer.`,
        icon: 'warning',
        iconColor: 'red',
        showCancelButton: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dataSource.data = this.dataSource.data.filter(q => q.id !== quotation.id);
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Cubicación Eliminada',
            message: `La cubicación CUB-${this.formatQuoteNumber(quotation.id)} ha sido eliminada.`,
            icon: 'delete_forever',
            iconColor: 'red'
          }
        });
        this.extractFilterOptions(); 
      }
    });
  }

  /**
   * Extrae las opciones únicas de proyecto y cliente de las cubicaciones cargadas
   * para usarlas en los filtros desplegables.
   */
  extractFilterOptions(): void {
    const projects = new Set<string>();
    const clients = new Set<string>();
    this.dataSource.data.forEach(q => {
      projects.add(q.projectName);
      clients.add(q.clientName);
    });
    this.filterOptions = {
      projects: Array.from(projects).sort(),
      clients: Array.from(clients).sort()
    };
  }
}
