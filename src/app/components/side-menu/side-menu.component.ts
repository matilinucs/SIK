import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class SideMenuComponent implements OnInit {
  currentUrl: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Mantener actualizada la URL actual para determinar la categoría activa
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.url;
    });
    
    // Inicializar con la URL actual
    this.currentUrl = this.router.url;
  }

  /**
   * Determina si una categoría específica está activa basada en la URL actual
   * @param categoryPath La ruta base de la categoría ('/clientes', '/proyectos', etc)
   * @returns true si la URL actual comienza con la ruta de la categoría
   */
  isActiveCategory(categoryPath: string): boolean {
    return this.currentUrl.startsWith(categoryPath);
  }
}