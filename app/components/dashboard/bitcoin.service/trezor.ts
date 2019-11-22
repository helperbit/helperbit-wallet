import { BitcoinSignOptions, BitcoinSignService } from "./bitcoin-service";
import { Injectable } from '@angular/core';

@Injectable()
export default class BitcoinTrezorService implements BitcoinSignService {
	constructor () {
	}

	sign (txhex: string, options: BitcoinSignOptions): Promise<string> {	
		if (!('n' in options))
			options.n = 2;

		let segwit = false;
		if (options.scripttype != 'p2sh')
			segwit = true;
	
		return Promise.reject();
	}
}
