import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Player {
    name: string;
    class: string;
    rating: number;
}

@Injectable({
    providedIn: 'root'
})
export class BisPlayerApiService {
    private leaderboardUrl = '/assets/leaderboard.json'; // Adjust the path as needed

    constructor(private http: HttpClient) {}

    getHighestRatedPlayers(): Observable<{ [key: string]: Player }> {
        return this.http.get<Player[]>(this.leaderboardUrl).pipe(
            map(players => this.findHighestRatedPlayers(players))
        );
    }

    private findHighestRatedPlayers(players: Player[]): { [key: string]: Player } {
        const highestRatedPlayers: { [key: string]: Player } = {};

        players.forEach(player => {
            if (!highestRatedPlayers[player.class] || player.rating > highestRatedPlayers[player.class].rating) {
                highestRatedPlayers[player.class] = player;
            }
        });

        return highestRatedPlayers;
    }
}