import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AlertDialogData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title [ngClass]="'alert-dialog-title ' + data.type">
      <mat-icon *ngIf="data.type === 'success'">check_circle</mat-icon>
      <mat-icon *ngIf="data.type === 'error'">error</mat-icon>
      <mat-icon *ngIf="data.type === 'warning'">warning</mat-icon>
      <mat-icon *ngIf="data.type === 'info'">info</mat-icon>
      {{ data.title }}
    </h2>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>Aceptar</button>
    </div>
  `,
  styles: [`
    .alert-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      
      &.success {
        color: #4caf50;
      }
      
      &.error {
        color: #f44336;
      }
      
      &.warning {
        color: #ff9800;
      }
      
      &.info {
        color: #2196f3;
      }
      
      mat-icon {
        margin-right: 8px;
      }
    }
    
    [mat-dialog-content] {
      margin: 16px 0;
      
      p {
        margin: 0;
        font-size: 16px;
        line-height: 1.5;
      }
    }
  `]
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {}
}
