import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RegularTableComponent } from './regular-table.component';
import { ActionButtonsComponent, ActionButton } from '../action-buttons/action-buttons.component';

/**
 * Estructura de datos para un elemento de la tabla de demostración
 */
interface DemoItem {
  id: number;
  name: string;
  description: string;
  date: Date;
  status: string;
  amount: number;
}

/**
 * Componente de demostración para mostrar el uso de RegularTable
 */
@Component({
  selector: 'app-regular-table-demo',
  standalone: true,  imports: [
    CommonModule,
    RegularTableComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ActionButtonsComponent
  ],
  template: `
    <div class="demo-container">
      <h2>Demostración de Regular Table</h2>
      
      <app-regular-table 
        [displayedColumns]="displayedColumns"
        [dataSource]="dataSource"
        [pageSizeOptions]="[5, 10, 25]"
        [noDataMessage]="'No hay elementos para mostrar.'"
        (rowClick)="onRowClick($event)">
        
        <!-- Plantilla para personalizar las celdas -->
        <ng-template #cellTemplate let-row let-column="column">
          <!-- Columna: Fecha -->
          <ng-container *ngIf="column === 'date'">
            {{formatDate(row.date)}}
          </ng-container>
          
          <!-- Columna: Estado -->
          <ng-container *ngIf="column === 'status'">
            <span class="status-badge" [ngClass]="row.status">
              <mat-icon *ngIf="row.status === 'activo'">check_circle</mat-icon>
              <mat-icon *ngIf="row.status === 'inactivo'">cancel</mat-icon>
              {{ row.status === 'activo' ? 'Activo' : 'Inactivo' }}
            </span>
          </ng-container>
          
          <!-- Columna: Monto -->
          <ng-container *ngIf="column === 'amount'">
            <span class="amount-cell">
              {{row.amount | currency:'USD':'symbol':'1.2-2'}}
            </span>
          </ng-container>
          
          <!-- Para todas las demás columnas, se muestra el valor directamente -->
          <ng-container *ngIf="column !== 'date' && column !== 'status' && column !== 'amount' && column !== 'actions'">
            {{row[column]}}
          </ng-container>
        </ng-template>
          <!-- Plantilla para la columna de acciones usando action-buttons -->
        <ng-template #actionsTemplate let-row>
          <app-action-buttons 
            [buttons]="actionButtons"
            [data]="row"
            [size]="'mini'"
            (action)="handleAction($event)">
          </app-action-buttons>
        </ng-template>
        
        <!-- Título personalizado para la primera columna -->
        <ng-container headerLabel>ID</ng-container>
      </app-regular-table>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      
      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
        margin-right: 4px;
      }
      
      &.activo {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }
      
      &.inactivo {
        background-color: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
    }
    
    .amount-cell {
      font-weight: 500;
    }
  `]
})
export class RegularTableDemoComponent implements OnInit {
  /**
   * Configuración de botones de acción
   */
  actionButtons: ActionButton[] = [
    { action: 'edit', tooltip: 'Editar', icon: 'edit' },
    { action: 'delete', tooltip: 'Eliminar', icon: 'delete' }
  ];
  
  /**
   * Columnas a mostrar en la tabla
   */
  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'date',
    'status',
    'amount',
    'actions'
  ];
  
  /**
   * Origen de datos para la tabla
   */
  dataSource = new MatTableDataSource<DemoItem>([]);
  
  /**
   * Genera datos de ejemplo al inicializar el componente
   */
  ngOnInit(): void {
    // Cargar datos de ejemplo
    const demoItems: DemoItem[] = [];
    
    for (let i = 1; i <= 20; i++) {
      demoItems.push({
        id: i,
        name: `Elemento ${i}`,
        description: `Descripción del elemento ${i}`,
        date: new Date(2025, 0, i),
        status: i % 3 === 0 ? 'inactivo' : 'activo',
        amount: Math.round(Math.random() * 10000) / 100
      });
    }
    
    this.dataSource.data = demoItems;
  }
  
  /**
   * Formatea una fecha como cadena
   */
  formatDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('es-ES');
  }
  
  /**
   * Maneja el clic en una fila
   */
  onRowClick(row: DemoItem): void {
    console.log('Fila seleccionada:', row);
  }
  
  /**
   * Ver detalles de un elemento
   */
  viewItem(item: DemoItem): void {
    console.log('Ver detalles del elemento:', item);
  }
  
  /**
   * Editar un elemento
   */
  editItem(item: DemoItem): void {
    console.log('Editar elemento:', item);
  }
  
  /**
   * Eliminar un elemento
   */
  deleteItem(item: DemoItem): void {
    console.log('Eliminar elemento:', item);
    const index = this.dataSource.data.findIndex(i => i.id === item.id);
    if (index !== -1) {
      const newData = [...this.dataSource.data];
      newData.splice(index, 1);
      this.dataSource.data = newData;
    }
  }
  
  /**
   * Maneja las acciones de los botones
   */
  handleAction(event: {action: string, data: any}): void {
    console.log('Acción:', event.action, 'Datos:', event.data);
    
    switch(event.action) {
      case 'edit':
        this.editItem(event.data);
        break;
      case 'delete':
        this.deleteItem(event.data);
        break;
    }
  }
}
