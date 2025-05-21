import { Component } from '@angular/core';
import { RegularTableDemoComponent } from '../../components/regular-table/regular-table-demo.component';

/**
 * Componente para mostrar la demostración del componente de tabla regular
 */
@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [
    RegularTableDemoComponent
  ],
  templateUrl: './table-demo.component.html',
  styleUrls: ['./table-demo.component.scss']
})
export class TableDemoComponent {
  // Este componente solo sirve como contenedor para la demostración
}
