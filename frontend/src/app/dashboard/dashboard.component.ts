import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatGridListModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Voorbeeld data voor grafiek
  budgetData = [
    { name: 'Voeding', value: 450 },
    { name: 'Huur', value: 1200 },
    { name: 'Transport', value: 300 },
    { name: 'Entertainment', value: 150 }
  ];

  view: [number, number] = [400, 300];
  colorScheme = 'cool';
}