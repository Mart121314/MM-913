import { Component, OnInit  } from '@angular/core';
import { CommonModule} from '@angular/common';
import { WowApiService } from '../wow-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bis-gear',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bis-gear.component.html',
  styleUrl: './bis-gear.component.css'
})
export class BisGearComponent implements OnInit {
  equipment$!: Observable<any>;   // <- observable for template

  constructor(public topGear: WowApiService) {} // can stay public OR private (not used in template)

  ngOnInit(): void {
    this.equipment$ = this.topGear.getCharacterEquipment('stormscale', 'sippycup', 'eu');
  }
}
