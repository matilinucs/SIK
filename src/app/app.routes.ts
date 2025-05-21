import { Routes } from '@angular/router';

import { MainLayoutComponent } from './components/layout/main-layout.component';

import { CreateQuotationComponent } from './pages/create-quotation/create-quotation.component';
import { ListQuotationComponent } from './pages/list-quotation/list-quotation.component';
import { CreateCustomerComponent } from './pages/create-customer/create-customer.component';
import { ListCustomerComponent } from './pages/list-customer/list-customer.component';
import { CreateProjectComponent } from './pages/create-project/create-project.component';
import { ListProjectComponent } from './pages/list-project/list-project.component';
import { CreateProductComponent } from './pages/create-product/create-product.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [      // Ruta principal
      { 
        path: '', 
        redirectTo: '/cubicaciones/lista', 
        pathMatch: 'full' 
      },
      
      // Rutas de Clientes
      { 
        path: 'clientes/nuevo', 
        component: CreateCustomerComponent,
        data: { title: 'Ingresar Clientes' }
      },
      { 
        path: 'clientes/lista', 
        component: ListCustomerComponent,
        data: { title: 'Listado de Clientes' }
      },
      
      // Rutas de Proyectos
      { 
        path: 'proyectos/nuevo', 
        component: CreateProjectComponent,
        data: { title: 'Ingresar Proyecto' }
      },
      { 
        path: 'proyectos/lista', 
        component: ListProjectComponent,
        data: { title: 'Listado de Proyectos' }
      },
        // Rutas de Cubicaciones
      { 
        path: 'cubicaciones/nueva', 
        component: CreateQuotationComponent,
        data: { title: 'Ingresar Cubicación' }
      },
      { 
        path: 'cubicaciones/lista', 
        component: ListQuotationComponent,
        data: { title: 'Listado de Cubicaciones' }
      },      { 
        path: 'productos', 
        loadComponent: () => import('./pages/create-product/create-product.component').then(m => m.CreateProductComponent),
        data: { title: 'Ingresar producto' }
      },
      // Ruta para la demostración de tabla
      { 
        path: 'demo/tabla', 
        loadComponent: () => import('./pages/table-demo/table-demo.component').then(m => m.TableDemoComponent),
        data: { title: 'Demostración de Tabla Reutilizable' }
      },
    ]
  },
    // Manejo de rutas no encontradas
  { path: '**', redirectTo: '/cubicaciones/lista' }
];