import {Component, NgZone, OnInit} from '@angular/core';
import {TwitchAuthorization, TwitchWindow} from 'hype-twitch-types';
import {LoggerService} from '../services/logger.service';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {GoogleAnalyticsService} from "../services/google-analytics.service";

import pako from "pako";

interface OwnedGame {
	id: number;
	name: string;
}

interface SteamRefreshResponse {
	status: string;
	games: OwnedGame[];
}

@Component({
	selector: 'app-config-extension',
	templateUrl: './config-extension.component.html',
	styleUrls: ['./config-extension.component.css']
})

export class ConfigExtensionComponent implements OnInit {

	MAX_PAYLOAD_SIZE = 5000;

	auth: TwitchAuthorization;
	window: TwitchWindow;

	show_loading = false;

	steam_id = '';

	message = '';

	error_message = '';

	no_games_found = false;

	constructor(private zone: NgZone, private logger: LoggerService, private http: HttpClient, private ga: GoogleAnalyticsService) {
	}

	private initializeCallbacks(window: TwitchWindow) {
		window.Twitch.ext.onAuthorized((auth: TwitchAuthorization) => {
			this.zone.run(() => {
				this.onAuthorized(auth);
			});
		});

		this.window = window;
	}

	private onAuthorized(auth: TwitchAuthorization) {
		this.auth = auth;
		this.logger.log('Authorized: ' + JSON.stringify(auth));
	}

	ngOnInit() {
		this.initializeCallbacks(<any>window);

		this.ga.trackPageView("Config");
	}

	onInputChanged(e: Event) {
		this.steam_id = (<HTMLInputElement>e.currentTarget).value;
	}

	private isNumeric(value: string): boolean {
		return /^\d+$/.test(value);
	}

	private findLargestBatchSize(games: OwnedGame[]): number
	{
		let batchSize = 0;
		while (batchSize < games.length) {
			const newBatchSize = Math.min(batchSize + 10, games.length);;
			const subset = games.slice(0, newBatchSize);
			const compressed = this.compressPayload(subset);
			this.logger.log("Compressed payload for batchSize " + newBatchSize + " is " + compressed.length);
			if (compressed.length >= this.MAX_PAYLOAD_SIZE) {
				break;
			}

			batchSize = newBatchSize;
		}

		this.logger.log("Largest batch size is " + batchSize);
		return batchSize;
	}

	private compressPayload(games: OwnedGame[]): string
	{
		const content = {games};
		const payload = JSON.stringify(content);
		const compressed = pako.deflate(payload, {to: 'string', level: 9});
		const binary = btoa(compressed);
		return binary;
	}

	onSaveClicked() {

		this.error_message = '';
		this.no_games_found = false;

		if (this.steam_id === '') {
			this.error_message = 'Please enter your Steam ID, use the link above to find your ID.';
			return;
		}

		// check if this is a valid steam id
		if (!this.isNumeric(this.steam_id)) {
			this.error_message = 'Steam ID is a number, a very large one. Please try again.';
			return;
		}

		if (this.steam_id.length < 15) {
			this.error_message = 'Your Steam ID seems invalid. Please try again.';
			return;
		}

		this.show_loading = true;

		const options: any = {
			headers: new HttpHeaders({'Authorization': 'Bearer ' + this.auth.token}),
		};

		const params: any = {
			id: this.steam_id,
		};

		const url = environment.apiEndpoint + '/mysteam.games.refresh';
		this.http.post<SteamRefreshResponse>(url, params, options).subscribe((data: any) => {

			this.logger.log("Got response:");
			this.logger.dir(data);

			this.show_loading = false;
			if (data.games.length > 0) {
				this.message = 'Success! Games will be listed in your channel. Remember to activate extension panel!';

				const batchSize = this.findLargestBatchSize(data.games);
				const subsetGames = data.games.slice(0, batchSize);
				const binary = this.compressPayload(subsetGames);
				this.window.Twitch.ext.configuration.set("broadcaster", "1", binary);
			} else {
				this.message = 'Hmpf! It seems that your account is set to private.';
				this.no_games_found = true;
			}
		}, () => {
			// error happened
			this.show_loading = false;
			this.error_message = 'Sad! We could not load your games list. Please email support and help debug.';
		});
	}

}
