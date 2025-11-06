import { Component, OnInit } from '@angular/core';
import { AsyncPipe,  } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { WowApiService } from '../wow-api.service';

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './bis-gear.component.html',
  styleUrls: ['./bis-gear.component.css'],
})
export class BisGearComponent implements OnInit {
  equipment$!: Observable<any>;
  error?: string;

  constructor(private topGear: WowApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.equipment$ = this.route.paramMap.pipe(
      switchMap(params => {
        const realm = params.get('realm');
        const name  = params.get('name');
        if (!realm || !name) {
          this.error = 'Missing route params: /gear/:realm/:name';
          return of(null);
        }
        // Service should use namespace = profile-classic-${region} (MoP Classic)
        return this.topGear.getCharacterEquipment(realm, name, 'eu');
      })
    );
  }
  
}
