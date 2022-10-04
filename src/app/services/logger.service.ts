import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable()
export class LoggerService {

	constructor() {
	}

	public log(message: string): void {
		if (!environment.production) {
			console.log(message);
		}
	}

	public dir(obj: any): void {
		if (!environment.production) {
			console.dir(obj);
		}
	}
}
