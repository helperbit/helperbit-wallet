import { BitcoinSignOptions, BitcoinSignService } from "./bitcoin-helper";
import { Injectable } from '@angular/core';

@Injectable()
export class BitcoinTrezorService implements BitcoinSignService {
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
