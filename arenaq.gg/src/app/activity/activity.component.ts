import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityApiService } from './activityapi.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  archives: any[] = [];

  constructor(private activityApi: ActivityApiService) {}

  ngOnInit(): void {
    this.activityApi.getArchives().subscribe((data) => {
      this.archives = data;
    });
  }
}
