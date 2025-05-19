/**
 * Componente para listar y filtrar cubicaciones
 * Implementa tabla interactiva con filtros avanzados y acciones rápidas
 * @author Sistema SIK
 * @lastModified 2025-05-16
 */
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs/operators';

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
    MatTooltipModule
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
   */
  constructor(private router: Router) { }
  
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
   * Extrae opciones únicas para los filtros desplegables
   */
  extractFilterOptions(): void {
    // Obtener proyectos únicos
    this.filterOptions.projects = Array.from(
      new Set(this.dataSource.data.map(item => item.projectName))
    );
    
    // Obtener clientes únicos
    this.filterOptions.clients = Array.from(
      new Set(this.dataSource.data.map(item => item.clientName))
    );
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
   */
  formatQuoteNumber(id: number): string {
    return `CUB-${id.toString().padStart(3, '0')}`;
  }
    /**
   * Navega a la vista detallada de una cubicación
   * @param id ID de la cubicación a visualizar
   */
  viewQuotation(id: number): void {
    console.log(`Ver cubicación ${id}`);
    // Implementación futura: this.router.navigate(['/cubicaciones/detalle', id]);
  }
    /**
   * Navega a la página para agregar productos a una cubicación
   * @param id ID de la cubicación a modificar
   */
  addProductToQuotation(id: number): void {
    console.log(`Agregar productos a cubicación ${id}`);
    // Implementación futura: this.router.navigate(['/cubicaciones/agregar-productos', id]);
  }
  
  /**
   * Navega a la página para crear una nueva cubicación
   */
  createNewQuotation(): void {
    this.router.navigate(['/cubicaciones/crear']);
  }
}
