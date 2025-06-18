import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  searchQuery = ''; // Bind this to the search bar input
  selectedRegion: 'EU' | 'US' = 'EU'; // Default region

  setRegion(region: 'EU' | 'US') {
    this.selectedRegion = region;
    console.log(`Region set to: ${region}`); // Replace with actual region handling logic
  }

  performSearch() {
    console.log(`Searching for: ${this.searchQuery}`); // Replace with actual search logic
  }
}