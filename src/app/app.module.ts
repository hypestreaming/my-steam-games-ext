import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PanelExtensionComponent} from './panel-extension/panel-extension.component';
import {ConfigExtensionComponent} from './config-extension/config-extension.component';
import {RouterModule, Routes} from '@angular/router';
import {LoggerService} from './services/logger.service';
import {GoogleAnalyticsService} from "./services/google-analytics.service";

const appRoutes: Routes = [
	{path: 'index.html', component: AppComponent},
];

@NgModule({
	declarations: [
		AppComponent,
		PanelExtensionComponent,
		ConfigExtensionComponent
	],
	imports: [
		HttpClientModule,
		BrowserAnimationsModule,
		BrowserModule,
		RouterModule.forRoot(appRoutes),
	],
	providers: [
		GoogleAnalyticsService,
		LoggerService,
	],
	bootstrap: [AppComponent]
})

export class AppModule {
}
