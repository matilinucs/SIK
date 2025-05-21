/**
 * Componente para listar y gestionar proyectos
 * Implementa tabla interactiva con filtros y acciones rápidas
 * @author Sistema SIK
 * @lastModified 2025-05-20
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { AlertDialogComponent } from '../../components/alert-dialog/alert-dialog.component';

/**
 * Estructura de datos para una cubicación asociada al proyecto
 */
interface ProjectQuotation {
  id: number;
  quoteNumber: string;
  status: 'en_proceso' | 'aprobada' | 'rechazada';
  creationDate: Date;
  totalAmount: number;
}

/**
 * Estructura de datos para un proyecto
 */
interface Project {
  /** Identificador único del proyecto */
  id: number;
  /** Código único del proyecto (formato P-XXX) */
  projectCode: string;
  /** Nombre del proyecto */
  name: string;
  /** Cliente asociado al proyecto */
  clientName: string;
  /** Ubicación del proyecto */
  location: string;
  /** Estado del proyecto */
  status: 'activo' | 'finalizado' | 'pausado' | 'cancelado';
  /** Fecha de inicio del proyecto */
  startDate: Date;
  /** Fecha estimada de finalización */
  endDate: Date | null;
  /** Presupuesto total asignado */
  budget: number;
  /** Cantidad de cubicaciones asociadas */
  quotationsCount: number;
  /** Lista de cubicaciones asociadas al proyecto */
  quotations: ProjectQuotation[];
}

/**
 * Opciones para los filtros desplegables
 */
interface FilterOptions {
  clients: string[];
  statuses: string[];
  locations: string[];
}

@Component({
  selector: 'app-list-project',
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
    MatDialogModule
  ],
  templateUrl: './list-project.component.html',
  styleUrl: './list-project.component.scss'
})
export class ListProjectComponent implements OnInit, AfterViewInit {
  /**
   * Referencia al paginador de la tabla
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  /**
   * Referencia al ordenador de la tabla
   */
  @ViewChild(MatSort) sort!: MatSort;
  
  /**
   * Columnas a mostrar en la tabla de proyectos
   */
  displayedColumns: string[] = [
    'projectCode',   // Código del proyecto
    'name',         // Nombre del proyecto
    'clientName',   // Cliente asociado
    'location',     // Ubicación
    'status',       // Estado
    'startDate',    // Fecha de inicio
    'budget',       // Presupuesto
    'quotationsCount', // Cantidad de cubicaciones
    'actions'       // Botones de acción
  ];
  
  /**
   * Origen de datos para la tabla 
   */
  dataSource = new MatTableDataSource<Project>([]);
  
  /**
   * Opciones disponibles para los filtros
   */
  filterOptions: FilterOptions = {
    clients: [],
    statuses: ['activo', 'finalizado', 'pausado', 'cancelado'],
    locations: []
  };
  
  /**
   * Formulario reactivo para los controles de filtro
   */
  filterForm = new FormGroup({
    status: new FormControl<string>(''),
    client: new FormControl<string>(''),
    location: new FormControl<string>(''),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null)
    })
  });
  
  /**
   * Constructor del componente
   * @param router Servicio de enrutamiento para navegación
   * @param dialog Servicio de diálogo de Material
   */
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }
  
  /**
   * Ciclo de vida: inicialización del componente
   */
  ngOnInit(): void {
    this.loadProjects();
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
  loadProjects(): void {
    const projects: Project[] = [
      {
        id: 1,
        projectCode: 'P-001',
        name: 'Edificio Torres del Parque',
        clientName: 'Constructora Bolivar',
        location: 'Bogotá, Colombia',
        status: 'activo',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2026-02-15'),
        budget: 500000,
        quotationsCount: 3,
        quotations: [
          {
            id: 1,
            quoteNumber: 'CUB-001',
            status: 'aprobada',
            creationDate: new Date('2025-03-15'),
            totalAmount: 120000
          },
          {
            id: 2,
            quoteNumber: 'CUB-007',
            status: 'en_proceso',
            creationDate: new Date('2025-04-10'),
            totalAmount: 85000
          },
          {
            id: 3,
            quoteNumber: 'CUB-012',
            status: 'en_proceso',
            creationDate: new Date('2025-05-05'),
            totalAmount: 75000
          }
        ]
      },
      {
        id: 2,
        projectCode: 'P-002',
        name: 'Residencial Las Palmas',
        clientName: 'Grupo Inmobiliario XYZ',
        location: 'Santa Marta, Colombia',
        status: 'activo',
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-12-20'),
        budget: 350000,
        quotationsCount: 2,
        quotations: [
          {
            id: 4,
            quoteNumber: 'CUB-005',
            status: 'aprobada',
            creationDate: new Date('2025-02-01'),
            totalAmount: 170000
          },
          {
            id: 5,
            quoteNumber: 'CUB-009',
            status: 'rechazada',
            creationDate: new Date('2025-03-05'),
            totalAmount: 45000
          }
        ]
      },
      {
        id: 3,
        projectCode: 'P-003',
        name: 'Centro Comercial El Dorado',
        clientName: 'Inversiones El Dorado',
        location: 'Medellín, Colombia',
        status: 'pausado',
        startDate: new Date('2025-02-15'),
        endDate: null,
        budget: 800000,
        quotationsCount: 1,
        quotations: [
          {
            id: 6,
            quoteNumber: 'CUB-010',
            status: 'en_proceso',
            creationDate: new Date('2025-02-20'),
            totalAmount: 320000
          }
        ]
      },
      {
        id: 4,
        projectCode: 'P-004',
        name: 'Hospital Central',
        clientName: 'Ministerio de Salud',
        location: 'Cali, Colombia',
        status: 'finalizado',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-04-30'),
        budget: 1200000,
        quotationsCount: 5,
        quotations: [
          {
            id: 7,
            quoteNumber: 'CUB-002',
            status: 'aprobada',
            creationDate: new Date('2024-10-15'),
            totalAmount: 280000
          },
          {
            id: 8,
            quoteNumber: 'CUB-003',
            status: 'aprobada',
            creationDate: new Date('2024-11-10'),
            totalAmount: 220000
          }
          // Otras cubicaciones no se muestran por brevedad
        ]
      },
      {
        id: 5,
        projectCode: 'P-005',
        name: 'Complejo Hotelero Playa Blanca',
        clientName: 'Hoteles Premium',
        location: 'Cartagena, Colombia',
        status: 'cancelado',
        startDate: new Date('2025-01-05'),
        endDate: new Date('2025-02-10'),
        budget: 650000,
        quotationsCount: 1,
        quotations: [
          {
            id: 9,
            quoteNumber: 'CUB-015',
            status: 'rechazada',
            creationDate: new Date('2025-01-10'),
            totalAmount: 180000
          }
        ]
      }
    ];
    
    // Generar más datos de ejemplo para probar paginación
    for (let i = 6; i <= 20; i++) {
      const quotationsCount = Math.floor(Math.random() * 5) + 1;
      const quotations: ProjectQuotation[] = [];
      
      for (let j = 0; j < quotationsCount; j++) {
        quotations.push({
          id: i * 10 + j,
          quoteNumber: `CUB-${(i * 10 + j).toString().padStart(3, '0')}`,
          status: ['en_proceso', 'aprobada', 'rechazada'][Math.floor(Math.random() * 3)] as any,
          creationDate: new Date(2025, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1),
          totalAmount: Math.floor(Math.random() * 200000) + 50000
        });
      }
      
      projects.push({
        id: i,
        projectCode: `P-${i.toString().padStart(3, '0')}`,
        name: `Proyecto Ejemplo ${i}`,
        clientName: `Cliente ${['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]}`,
        location: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'][Math.floor(Math.random() * 5)],
        status: ['activo', 'finalizado', 'pausado', 'cancelado'][Math.floor(Math.random() * 4)] as any,
        startDate: new Date(2025, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1),
        endDate: Math.random() > 0.3 ? new Date(2025, Math.floor(Math.random() * 5) + 6, Math.floor(Math.random() * 28) + 1) : null,
        budget: Math.floor(Math.random() * 1000000) + 200000,
        quotationsCount: quotationsCount,
        quotations: quotations
      });
    }
    
    this.dataSource.data = projects;
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
    this.filterForm.get('location')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('dateRange')?.valueChanges.subscribe(() => this.applyFilters());
  }
  
  /**
   * Aplica todos los filtros a la tabla
   */
  applyFilters(): void {
    // Obtener valores actuales de los filtros
    const filterValues = {
      status: this.filterForm.get('status')?.value || '',
      client: this.filterForm.get('client')?.value || '',
      location: this.filterForm.get('location')?.value || '',
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
  createFilterPredicate(): (data: Project, filter: string) => boolean {
    return (data: Project, filter: string): boolean => {
      const filterValues = JSON.parse(filter);
      
      // Filtrar por estado
      if (filterValues.status && data.status !== filterValues.status) {
        return false;
      }
      
      // Filtrar por cliente (búsqueda parcial, case insensitive)
      if (filterValues.client && !data.clientName.toLowerCase().includes(filterValues.client.toLowerCase())) {
        return false;
      }
      
      // Filtrar por ubicación
      if (filterValues.location && data.location !== filterValues.location) {
        return false;
      }
      
      // Filtrar por rango de fechas (fecha de inicio del proyecto)
      if (filterValues.dateStart && filterValues.dateEnd) {
        const start = new Date(filterValues.dateStart);
        const end = new Date(filterValues.dateEnd);
        const date = new Date(data.startDate);
        
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
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    };
    
    return new Date(date).toLocaleDateString('es-ES', options);
  }
  
  /**
   * Extrae las opciones únicas de cliente y ubicación de los proyectos cargados
   * para usarlas en los filtros desplegables.
   */
  extractFilterOptions(): void {
    const clients = new Set<string>();
    const locations = new Set<string>();
    
    this.dataSource.data.forEach(project => {
      clients.add(project.clientName);
      locations.add(project.location);
    });
    
    this.filterOptions = {
      clients: Array.from(clients).sort(),
      statuses: ['activo', 'finalizado', 'pausado', 'cancelado'],
      locations: Array.from(locations).sort()
    };
  }
  
  /**
   * Abre el formulario para crear un nuevo proyecto
   */
  createNewProject(): void {
    this.router.navigate(['/proyectos/nuevo']);
  }
  
  /**
   * Navega a la vista detallada de un proyecto
   * @param project El proyecto a visualizar
   */
  viewProject(project: Project): void {
    console.log('Ver proyecto:', project);
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: `Detalles del Proyecto ${project.projectCode}`,
        message: `Nombre: ${project.name}\\nCliente: ${project.clientName}\\nUbicación: ${project.location}\\nEstado: ${project.status}\\nInicio: ${this.formatDate(project.startDate)}\\nFin: ${this.formatDate(project.endDate)}\\nPresupuesto: $${project.budget.toLocaleString()}`,
        icon: 'visibility',
        iconColor: 'blue'
      }
    });
  }
  
  /**
   * Navega a la página para editar un proyecto
   * @param project El proyecto a editar
   */
  editProject(project: Project): void {
    this.router.navigate(['/proyectos/editar', project.id]);
  }
  
  /**
   * Navega a la página para gestionar las cubicaciones de un proyecto
   * @param project El proyecto del cual gestionar cubicaciones
   */
  manageQuotations(project: Project): void {
    console.log('Gestionar cubicaciones del proyecto:', project);
    // this.router.navigate(['/proyectos/cubicaciones', project.id]);
    
    // Mostrar las cubicaciones en un diálogo
    let quotationsText = '';
    project.quotations.forEach(q => {
      quotationsText += `${q.quoteNumber} - ${q.status} - ${this.formatDate(q.creationDate)} - $${q.totalAmount.toLocaleString()}\\n`;
    });
    
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: `Cubicaciones del Proyecto ${project.projectCode}`,
        message: quotationsText || 'No hay cubicaciones asociadas a este proyecto.',
        icon: 'assignment',
        iconColor: 'blue'
      }
    });
  }
  
  /**
   * Elimina un proyecto después de confirmación
   * @param project El proyecto a eliminar
   */
  deleteProject(project: Project): void {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar el proyecto ${project.projectCode} (${project.name})? Esta acción no se puede deshacer.`,
        icon: 'warning',
        iconColor: 'red',
        showCancelButton: true
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dataSource.data = this.dataSource.data.filter(p => p.id !== project.id);
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Proyecto Eliminado',
            message: `El proyecto ${project.projectCode} ha sido eliminado.`,
            icon: 'delete_forever',
            iconColor: 'red'
          }
        });
        this.extractFilterOptions(); // Actualizar filtros
      }
    });
  }

  /**
   * Formatea un valor monetario para mostrar en la tabla
   * @param value Valor a formatear
   * @returns Cadena formateada con separadores de miles
   */
  formatCurrency(value: number): string {
    return `$${value.toLocaleString()}`;
  }
  /**
   * Obtiene la clase CSS para el badge de estado
   * @param status Estado del proyecto
   * @returns Nombre de la clase CSS
   */
  getStatusClass(status: string): string {
    switch(status) {
      case 'activo': return 'status-active';
      case 'finalizado': return 'status-finished';
      case 'pausado': return 'status-paused';
      case 'cancelado': return 'status-cancelled';
      default: return '';
    }
  }
}
