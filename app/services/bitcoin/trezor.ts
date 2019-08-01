import { BitcoinSignOptions, BitcoinSignService } from "./bitcoin-service";
import { ConfigService } from "../../app.config";

export default class BitcoinTrezorService implements BitcoinSignService {
	config: ConfigService;

	constructor (config) {
		this.config = config;
	}

	sign (txhex: string, options: BitcoinSignOptions): Promise<string> {	
		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;

		let segwit = false;
		if (options.scripttype != 'p2sh')
			segwit = true;
	
		return Promise.reject();
	}

	static get $inject() { return ['config' ]; }
}
