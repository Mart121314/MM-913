import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TrackerService, TrackerEvent, TrackerResponse } from './tracker.service';
import { PvpBracket, Region } from '../wow-api.service';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css'],
})
export class TrackerComponent implements OnInit {
  readonly regions: Region[] = ['eu', 'us'];
  readonly brackets: readonly PvpBracket[] = ['2v2', '3v3', '5v5'];
  readonly bracketFilterOptions: Array<PvpBracket | 'all'> = ['all', ...this.brackets];

  region: Region = 'eu';
  bracketFilter: PvpBracket | 'all' = 'all';

  loading = false;
  error?: string;
  generatedAt?: string;

  events: TrackerEvent[] = [];
  filteredEvents: TrackerEvent[] = [];

  constructor(private trackerService: TrackerService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = undefined;
    this.trackerService.getActivity(this.region).subscribe({
      next: (response: TrackerResponse) => {
        this.events = response.events ?? [];
        this.generatedAt = response.generatedAt;
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.error = err?.message ?? 'Failed to load tracker data.';
        this.loading = false;
      },
    });
  }

  onRegionChange(regionValue: string): void {
    const region = regionValue.toLowerCase();
    if (region === this.region) {
      return;
    }
    this.region = (this.regions.includes(region as Region) ? (region as Region) : 'eu') ?? 'eu';
    this.refresh();
  }

  onBracketFilterChange(filterValue: string): void {
    this.bracketFilter = filterValue === 'all' ? 'all' : (filterValue as PvpBracket);
    this.applyFilter();
  }

  trackByEventId(_index: number, event: TrackerEvent): string {
    return event.id;
  }

  timeAgo(iso: string): string {
    if (!iso) {
      return '';
    }
    const now = Date.now();
    const value = new Date(iso).getTime();
    if (!Number.isFinite(value)) {
      return '';
    }
    const diffMs = now - value;
    if (diffMs < 60_000) {
      return 'just now';
    }
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatTimestamp(iso: string | undefined): string {
    if (!iso) {
      return '';
    }
    const time = new Date(iso);
    if (!Number.isFinite(time.getTime())) {
      return iso;
    }
    return time.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private applyFilter(): void {
    const source =
      this.bracketFilter === 'all'
        ? this.events
        : this.events.filter(event => event.bracket === this.bracketFilter);
    this.filteredEvents = source.slice(0, 500);
  }
}
