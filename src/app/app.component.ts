import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

	is_panel = false;
	is_config = false;
	is_live_config = false;
        is_preview = false;

	constructor(private activatedRoute: ActivatedRoute) {
	}

	ngOnInit(): void {
		this.activatedRoute.queryParams.subscribe((map) => {
			this.is_panel = (map.mode && map.mode === 'viewer');
			this.is_config = (map.mode && map.mode === 'config');
                        this.is_preview = (map.mode && map.mode === 'preview');
			this.is_live_config = (map.mode && map.mode === 'dashboard');
		});
	}
}
