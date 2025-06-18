import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { TrackerService } from './tracker.service';

@Component({
  selector: 'app-tracker',
  standalone: true,
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css'],
})
export class TrackerComponent implements OnInit {
  chart: any;

  constructor(private trackerService: TrackerService) {}

  ngOnInit(): void {
    this.initChart();
    this.fetchTrackedGames();
  }

  initChart(): void {
    const chartDom = document.getElementById('tracked-games-chart')!;
    this.chart = echarts.init(chartDom);

    this.chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      legend: { data: ['2v2', '3v3', 'RBG'], top: 10, textStyle: { color: '#fff' } },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [], // Dates to be filled dynamically
        axisLabel: { color: '#fff' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#fff' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
      },
      series: [
        { name: '2v2', type: 'line', data: [], smooth: true },
        { name: '3v3', type: 'line', data: [], smooth: true },
        { name: 'RBG', type: 'line', data: [], smooth: true },
      ],
    });
  }

  fetchTrackedGames(): void {
    this.trackerService.getTrackedGames(32, '3v3').subscribe((data) => {
      const dates = data.map((item) => item.date);
      const games2v2 = data.map((item) => (item.bracket === '2v2' ? item.gamesPlayed : 0));
      const games3v3 = data.map((item) => (item.bracket === '3v3' ? item.gamesPlayed : 0));
      const gamesRBG = data.map((item) => (item.bracket === 'rbg' ? item.gamesPlayed : 0));

      this.chart.setOption({
        xAxis: { data: dates },
        series: [
          { name: '2v2', data: games2v2 },
          { name: '3v3', data: games3v3 },
          { name: 'RBG', data: gamesRBG },
        ],
      });
    });
  }
}
