/**
 * Componente para listar y gestionar clientes
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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { AlertDialogComponent } from '../../components/alert-dialog/alert-dialog.component';

/**
 * Estructura de datos para un proyecto asociado al cliente
 */
interface CustomerProject {
  id: number;
  projectCode: string;
  name: string;
  status: 'activo' | 'finalizado' | 'pausado' | 'cancelado';
}

/**
 * Estructura de datos para una cubicación asociada al cliente
 */
interface CustomerQuotation {
  id: number;
  quoteNumber: string;
  projectName: string;
  date: Date;
  total: number;
}

/**
 * Estructura de datos para un cliente
 */
interface Customer {
  /** Identificador único del cliente */
  id: number;
  /** RUT o identificación fiscal */
  rut: string;
  /** Tipo de persona: natural o empresa */
  personType: 'natural' | 'empresa';
  /** Nombre del cliente (persona) o razón social (empresa) */
  name: string;
  /** Teléfono de contacto */
  phone: string;
  /** Correo electrónico */
  email: string;
  /** Dirección */
  address: string;
  /** Ciudad */
  city: string;
  /** Región */
  region: string;
  /** Fecha de registro */
  registrationDate: Date;
  /** Lista de proyectos asociados */
  projects: CustomerProject[];
  /** Lista de cubicaciones asociadas */
  quotations: CustomerQuotation[];
  /** Número total de proyectos */
  projectsCount: number;
  /** Número total de cubicaciones */
  quotationsCount: number;
}

/**
 * Opciones para los filtros desplegables
 */
interface FilterOptions {
  personTypes: string[];
  cities: string[];
  regions: string[];
}

@Component({
  selector: 'app-list-customer',
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
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './list-customer.component.html',
  styleUrl: './list-customer.component.scss'
})
export class ListCustomerComponent implements OnInit, AfterViewInit {
  /**
   * Referencia al paginador de la tabla
   */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  /**
   * Referencia al ordenador de la tabla
   */
  @ViewChild(MatSort) sort!: MatSort;
  
  /**
   * Columnas a mostrar en la tabla de clientes
   */
  displayedColumns: string[] = [
    'rut',          // RUT o identificación fiscal
    'personType',   // Tipo de persona
    'name',         // Nombre o razón social
    'phone',        // Teléfono
    'email',        // Correo electrónico
    'city',         // Ciudad
    'projectsCount', // Cantidad de proyectos
    'quotationsCount', // Cantidad de cubicaciones
    'actions'       // Botones de acción
  ];
  
  /**
   * Origen de datos para la tabla 
   */
  dataSource = new MatTableDataSource<Customer>([]);
  
  /**
   * Opciones disponibles para los filtros
   */
  filterOptions: FilterOptions = {
    personTypes: ['natural', 'empresa'],
    cities: [],
    regions: []
  };
  
  /**
   * Formulario reactivo para los controles de filtro
   */
  filterForm = new FormGroup({
    personType: new FormControl<string>(''),
    name: new FormControl<string>(''),
    city: new FormControl<string>(''),
    region: new FormControl<string>('')
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
    this.loadCustomers();
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
  loadCustomers(): void {
    const customers: Customer[] = [
      {
        id: 1,
        rut: '76.123.456-7',
        personType: 'empresa',
        name: 'Constructora Bolívar S.A.',
        phone: '+57 601 2345678',
        email: 'contacto@constructorabolivar.com',
        address: 'Calle 100 #15-82',
        city: 'Bogotá',
        region: 'Cundinamarca',
        registrationDate: new Date('2024-05-10'),
        projects: [
          {
            id: 1,
            projectCode: 'P-001',
            name: 'Edificio Torres del Parque',
            status: 'activo'
          },
          {
            id: 3,
            projectCode: 'P-003',
            name: 'Centro Comercial El Dorado',
            status: 'pausado'
          }
        ],
        quotations: [
          {
            id: 1,
            quoteNumber: 'CUB-001',
            projectName: 'Edificio Torres del Parque',
            date: new Date('2025-03-15'),
            total: 120000
          }
        ],
        projectsCount: 2,
        quotationsCount: 1
      },
      {
        id: 2,
        rut: '12.345.678-9',
        personType: 'natural',
        name: 'Juan Carlos Rodríguez',
        phone: '+57 310 5678901',
        email: 'juanrodriguez@gmail.com',
        address: 'Carrera 7 #45-12',
        city: 'Medellín',
        region: 'Antioquia',
        registrationDate: new Date('2024-08-22'),
        projects: [
          {
            id: 2,
            projectCode: 'P-002',
            name: 'Residencial Las Palmas',
            status: 'activo'
          }
        ],
        quotations: [],
        projectsCount: 1,
        quotationsCount: 0
      },
      {
        id: 3,
        rut: '900.123.456-1',
        personType: 'empresa',
        name: 'Inversiones El Dorado Ltda.',
        phone: '+57 602 5671234',
        email: 'contacto@inversioneseldorado.co',
        address: 'Av. El Dorado #70-32',
        city: 'Medellín',
        region: 'Antioquia',
        registrationDate: new Date('2025-01-05'),
        projects: [],
        quotations: [
          {
            id: 6,
            quoteNumber: 'CUB-010',
            projectName: 'Centro Comercial El Dorado',
            date: new Date('2025-02-20'),
            total: 320000
          }
        ],
        projectsCount: 0,
        quotationsCount: 1
      },
      {
        id: 4,
        rut: '800.987.654-3',
        personType: 'empresa',
        name: 'Ministerio de Salud',
        phone: '+57 601 3456789',
        email: 'proyectos@minsalud.gov.co',
        address: 'Calle 75 #23-45',
        city: 'Bogotá',
        region: 'Cundinamarca',
        registrationDate: new Date('2024-09-15'),
        projects: [
          {
            id: 4,
            projectCode: 'P-004',
            name: 'Hospital Central',
            status: 'finalizado'
          }
        ],
        quotations: [
          {
            id: 7,
            quoteNumber: 'CUB-002',
            projectName: 'Hospital Central',
            date: new Date('2024-10-15'),
            total: 280000
          },
          {
            id: 8,
            quoteNumber: 'CUB-003',
            projectName: 'Hospital Central',
            date: new Date('2024-11-10'),
            total: 220000
          }
        ],
        projectsCount: 1,
        quotationsCount: 2
      },
      {
        id: 5,
        rut: '23.456.789-0',
        personType: 'natural',
        name: 'María Fernanda López',
        phone: '+57 315 2345678',
        email: 'marialopez@outlook.com',
        address: 'Calle 12 #34-56',
        city: 'Cali',
        region: 'Valle del Cauca',
        registrationDate: new Date('2025-03-10'),
        projects: [
          {
            id: 5,
            projectCode: 'P-005',
            name: 'Complejo Hotelero Playa Blanca',
            status: 'cancelado'
          }
        ],
        quotations: [],
        projectsCount: 1,
        quotationsCount: 0
      }
    ];
    
    // Generar más datos de ejemplo para probar paginación
    const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Santa Marta'];
    const regions = ['Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Bolívar', 'Santander', 'Magdalena'];
    
    for (let i = 6; i <= 50; i++) {
      const personType = Math.random() > 0.5 ? 'natural' : 'empresa';
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const regionIndex = cities.indexOf(randomCity);
      const regionName = regions[regionIndex >= 0 ? regionIndex : Math.floor(Math.random() * regions.length)];
      
      const projectsCount = Math.floor(Math.random() * 3);
      const quotationsCount = Math.floor(Math.random() * 5);
      
      const projects: CustomerProject[] = [];
      for (let j = 0; j < projectsCount; j++) {
        projects.push({
          id: i * 10 + j,
          projectCode: `P-${(i * 10 + j).toString().padStart(3, '0')}`,
          name: `Proyecto ${i * 10 + j}`,
          status: ['activo', 'finalizado', 'pausado', 'cancelado'][Math.floor(Math.random() * 4)] as any
        });
      }
      
      const quotations: CustomerQuotation[] = [];
      for (let j = 0; j < quotationsCount; j++) {
        quotations.push({
          id: i * 10 + j,
          quoteNumber: `CUB-${(i * 10 + j).toString().padStart(3, '0')}`,
          projectName: `Proyecto ${Math.floor(Math.random() * 100) + 1}`,
          date: new Date(2025, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1),
          total: Math.floor(Math.random() * 200000) + 10000
        });
      }
      
      customers.push({
        id: i,
        rut: personType === 'natural' 
          ? `${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}` 
          : `${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}`,
        personType: personType,
        name: personType === 'natural' 
          ? `Cliente ${i} ${['Pérez', 'Gómez', 'Rodríguez', 'López', 'Martínez'][Math.floor(Math.random() * 5)]}` 
          : `Empresa ${i} ${['S.A.', 'Ltda.', 'S.A.S.', 'E.U.', 'Inc.'][Math.floor(Math.random() * 5)]}`,
        phone: `+57 ${Math.floor(Math.random() * 100) + 300} ${Math.floor(Math.random() * 10000000)}`,
        email: personType === 'natural' 
          ? `cliente${i}@${['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'][Math.floor(Math.random() * 4)]}` 
          : `contacto@empresa${i}.${['com', 'co', 'com.co', 'org'][Math.floor(Math.random() * 4)]}`,
        address: `${['Calle', 'Carrera', 'Avenida', 'Diagonal', 'Transversal'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 100) + 1} #${Math.floor(Math.random() * 100) + 1}-${Math.floor(Math.random() * 100) + 1}`,
        city: randomCity,
        region: regionName,
        registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        projects: projects,
        quotations: quotations,
        projectsCount: projectsCount,
        quotationsCount: quotationsCount
      });
    }
    
    this.dataSource.data = customers;
  }
  
  /**
   * Configura listeners reactivos para los controles de filtro
   */
  setupFilterListeners(): void {
    // Aplicar filtro con debounce para el campo de nombre
    this.filterForm.get('name')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
    
    // Aplicar filtros inmediatamente para los demás controles
    this.filterForm.get('personType')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('city')?.valueChanges.subscribe(() => this.applyFilters());
    this.filterForm.get('region')?.valueChanges.subscribe(() => this.applyFilters());
  }
  
  /**
   * Aplica todos los filtros a la tabla
   */
  applyFilters(): void {
    // Obtener valores actuales de los filtros
    const filterValues = {
      personType: this.filterForm.get('personType')?.value || '',
      name: this.filterForm.get('name')?.value || '',
      city: this.filterForm.get('city')?.value || '',
      region: this.filterForm.get('region')?.value || ''
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
  createFilterPredicate(): (data: Customer, filter: string) => boolean {
    return (data: Customer, filter: string): boolean => {
      const filterValues = JSON.parse(filter);
      
      // Filtrar por tipo de persona
      if (filterValues.personType && data.personType !== filterValues.personType) {
        return false;
      }
      
      // Filtrar por nombre (búsqueda parcial, case insensitive)
      if (filterValues.name && !data.name.toLowerCase().includes(filterValues.name.toLowerCase())) {
        return false;
      }
      
      // Filtrar por ciudad
      if (filterValues.city && data.city !== filterValues.city) {
        return false;
      }
      
      // Filtrar por región
      if (filterValues.region && data.region !== filterValues.region) {
        return false;
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
   * Extrae las opciones únicas de ciudades y regiones de los clientes cargados
   * para usarlas en los filtros desplegables.
   */
  extractFilterOptions(): void {
    const cities = new Set<string>();
    const regions = new Set<string>();
    
    this.dataSource.data.forEach(customer => {
      cities.add(customer.city);
      regions.add(customer.region);
    });
    
    this.filterOptions = {
      personTypes: ['natural', 'empresa'],
      cities: Array.from(cities).sort(),
      regions: Array.from(regions).sort()
    };
  }
  
  /**
   * Abre el formulario para crear un nuevo cliente
   */
  createNewCustomer(): void {
    this.router.navigate(['/clientes/nuevo']);
  }
  
  /**
   * Navega a la vista detallada de un cliente
   * @param customer El cliente a visualizar
   */
  viewCustomer(customer: Customer): void {
    console.log('Ver cliente:', customer);
    
    let projectsText = '';
    customer.projects.forEach(p => {
      projectsText += `${p.projectCode} - ${p.name} (${p.status})\\n`;
    });
    
    let quotationsText = '';
    customer.quotations.forEach(q => {
      quotationsText += `${q.quoteNumber} - ${q.projectName} - ${this.formatDate(q.date)} - $${q.total.toLocaleString()}\\n`;
    });
    
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: `Detalles del Cliente: ${customer.name}`,
        message: `RUT: ${customer.rut}\\nTipo: ${customer.personType === 'natural' ? 'Persona Natural' : 'Empresa'}\\nTeléfono: ${customer.phone}\\nEmail: ${customer.email}\\nDirección: ${customer.address}\\nCiudad: ${customer.city}, ${customer.region}\\n\\nProyectos (${customer.projectsCount}):\\n${projectsText || 'No hay proyectos asociados.'}\\n\\nCubicaciones (${customer.quotationsCount}):\\n${quotationsText || 'No hay cubicaciones asociadas.'}`,
        icon: 'visibility',
        iconColor: 'blue'
      }
    });
  }
  
  /**
   * Navega a la página para editar un cliente
   * @param customer El cliente a editar
   */
  editCustomer(customer: Customer): void {
    this.router.navigate(['/clientes/editar', customer.id]);
  }
  
  /**
   * Elimina un cliente después de confirmación
   * @param customer El cliente a eliminar
   */
  deleteCustomer(customer: Customer): void {
    // No permitir eliminar clientes con proyectos o cubicaciones asociadas
    if (customer.projectsCount > 0 || customer.quotationsCount > 0) {
      this.dialog.open(AlertDialogComponent, {
        data: {
          title: 'No se puede eliminar',
          message: `No se puede eliminar el cliente "${customer.name}" porque tiene ${customer.projectsCount} proyecto(s) y ${customer.quotationsCount} cubicación(es) asociada(s).`,
          icon: 'error',
          iconColor: 'red'
        }
      });
      return;
    }
    
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar al cliente "${customer.name}" (${customer.rut})? Esta acción no se puede deshacer.`,
        icon: 'warning',
        iconColor: 'red',
        showCancelButton: true
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dataSource.data = this.dataSource.data.filter(c => c.id !== customer.id);
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Cliente Eliminado',
            message: `El cliente "${customer.name}" ha sido eliminado.`,
            icon: 'delete_forever',
            iconColor: 'red'
          }
        });
        this.extractFilterOptions(); // Actualizar filtros
      }
    });
  }
  
  /**
   * Obtiene la clase CSS para el badge de tipo de persona
   * @param type Tipo de persona
   * @returns Nombre de la clase CSS
   */
  getPersonTypeClass(type: string): string {
    return type === 'natural' ? 'type-natural' : 'type-empresa';
  }
  
  /**
   * Obtiene el ícono para el tipo de persona
   * @param type Tipo de persona
   * @returns Nombre del ícono de Material
   */
  getPersonTypeIcon(type: string): string {
    return type === 'natural' ? 'person' : 'business';
  }
}
