import {Component, NgZone, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TwitchAuthorization, TwitchWindow} from 'twitch-typings';
import {LoggerService} from '../services/logger.service';
import {environment} from '../../environments/environment';

import pako from 'pako';
import {GoogleAnalyticsService} from '../services/google-analytics.service';

interface SteamGame {
	id: number;
	img: string;
	name: string;
}

@Component({
	selector: 'app-panel-extension',
	templateUrl: './panel-extension.component.html',
	styleUrls: ['./panel-extension.component.css'],
	animations: [
		trigger('visibleState', [
			state('true', style({opacity: 1})),
			state('false', style({opacity: 0})),
			transition('false => true', animate('100ms ease-in-out')),
			transition('true => false', animate('100ms ease-in-out')),
		]),
	]
})

export class PanelExtensionComponent implements OnInit {

	games: Array<SteamGame> = [];

	hovered_game: SteamGame;

	hype_logo_url = 'https://extensions2.com/more/hype-network';

	constructor(private zone: NgZone, private logger: LoggerService, private ga: GoogleAnalyticsService) {
	}

	private installCallbacks(window: TwitchWindow) {
		window.Twitch.ext.onAuthorized((auth: TwitchAuthorization) => {
			this.zone.run(() => {
				this.onAuthorized(auth);
			});
		});

		window.Twitch.ext.configuration.onChanged(() => {
			this.zone.run(() => {
				this.onConfigurationChanged(window);
			});
		});
	}

	private onAuthorized(auth: TwitchAuthorization) {
		this.logger.log('Authorized: ' + JSON.stringify(auth));

		this.hype_logo_url = 'https://extensions2.com/more/hype-network?source_extension_id=' + environment.clientId +
			'&source_extension_name=' + environment.extensionName +
			'&source_extension_version=' + environment.version +
			'&source_channel_id=' + auth.channelId;
	}

	private onConfigurationChanged(window: TwitchWindow) {
		const content = window.Twitch.ext.configuration.broadcaster.content.replace(/"/g, '');
		this.logger.log('Configuration has changed: ' + content);
                this.onNewPayload(content);
        }

        public onNewPayload(content: string) {
		const raw = pako.inflate(atob(content), {to: 'string'});
		const json = JSON.parse(raw);
		this.games = json.games;

                this.logger.log("Got this JSON out:");
		this.logger.dir(json);
	}

	ngOnInit(): void {
		this.installCallbacks(<any>window);

		this.ga.trackPageView('Panel');
	}

	onMouseOver(game: SteamGame) {
		this.hovered_game = game;
	}

	onMouseOut(game: SteamGame) {
		if (this.hovered_game && this.hovered_game.id === game.id) {
			this.hovered_game = null;
		}
	}

	onGameClicked(game: SteamGame, index: number) {
		this.ga.trackEvent('My_Steam', 'game_clicked', game.name);
	}

	onHypeClicked(): boolean {
		this.ga.trackEvent('My_Steam', 'hype_clicked', '');
		return true;
	}
}
