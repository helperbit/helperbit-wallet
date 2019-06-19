import * as common from './common';

function BitcoinTrezorService(config, $api) {
	this.getPublicKey = function() {
	};

	this.sign = function (txhex: string, options: common.BitcoinSignOptions): Promise<string> {
		const self = this;
	
		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;

		let segwit = false;
		if (options.scripttype != 'p2sh')
			segwit = true;
	
		return Promise.reject();
	};
}

BitcoinTrezorService.$inject = ['config', '$api'];

export default BitcoinTrezorService;