import * as common from './common';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as CryptoJS from 'crypto-js';

require("babel-polyfill");


function BitcoinService(config, $currency) {
	/* Generate a new bip39 valid mnemonic */
	this.generateMnemonic = function () {
		return bip39.generateMnemonic(128, common.randomBytes);
	};

	/* Check if the given address is valid */
	this.checkAddress = function (address: string) {
		try {
			bitcoinjs.address.toOutputScript(address, config.network);
			return true;
		} catch (e) {
			return false;
		}
	};


	this.evaluteFee = function (inputs, outputs, fast) {
		let speed = 'halfHourFee';
		if (fast) speed = 'fastestFee';

		return (outputs * 34 + inputs * 180 + 10) * $currency.fees[speed] / 100000000.0;
	};


	/* Return the keypair from a mnemonic */
	this.mnemonicToKeys = function (secret: string) {
		const fixSeed = function (seed) {
			return seed
				.replace('%20', ' ')
				.replace('  ', ' ')
				.replace('\n', '')
				.replace('\r', '')
				.trim();
		};

		const seed = bip39.mnemonicToSeed(fixSeed(secret));
		const hd = bip32.fromSeed(seed, config.network);
		const priv1 = hd.toWIF();
		const pub1 = hd.publicKey.toString('hex');
		return { private: priv1, public: pub1 };
	};


	/* Random keypair */
	this.randomKeys = function (): { private: string, public: string } {
		const pair2 = bitcoinjs.ECPair.makeRandom({ network: config.network, rng: common.randomBytes });
		const priv2 = pair2.toWIF();
		const pub2 = pair2.publicKey.toString('hex');

		return { private: priv2, public: pub2 };
	};


	this.sign = function (txhex: string, options: common.BitcoinSignOptions): Promise<string> {
		if ('seed' in options)
			options.wif = this.mnemonicToKeys(options.seed).private;
		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;

		let segwit = false;
		if (options.scripttype != 'p2sh')
			segwit = true;

		return new Promise ((resolve, reject) => {
			const tx = bitcoinjs.Transaction.fromHex(txhex);
			const txb = bitcoinjs.TransactionBuilder.fromTransaction(tx, config.network);
			const upair = bitcoinjs.ECPair.fromWIF(options.wif, config.network);
			const walletScripts = common.prepareScripts(options.scripttype, options.n, options.pubkeys, config.network);

			for (let j = 0; j < tx.ins.length; j++) {
				switch(options.scripttype) {
					case 'p2sh-p2wsh':
						txb.sign(j, upair, walletScripts.p2shRedeem, null, options.utxos[j].value, walletScripts.p2wshRedeem);
						break;
					case 'p2wsh':
						txb.sign(j, upair, null, null, options.utxos[j].value, walletScripts.p2wshRedeem);
						break;
					case 'p2sh':
						txb.sign(j, upair, walletScripts.p2shRedeem);
						break;
				}
			}

			if (options.complete)
				return resolve(txb.build().toHex());
			else
				return resolve(txb.buildIncomplete().toHex());
		});
	};

	/* Encrypt key */
	this.encryptKeys = function (privateKey: string, password: string): string {
		const ence = CryptoJS.AES.encrypt(privateKey, password, { iv: password });
		return ence.toString();
	};

	/* Decrypt key */
	this.decryptKeys = function (encpriv: string, password: string): { private: string, public: string, pair: bitcoinjs.ECPair } | null {
		const hex2a = function (hex) {
			let str = '';
			for (let i = 0; i < hex.length; i += 2)
				str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
			return str;
		};

		const privkeye = CryptoJS.AES.decrypt(encpriv, password, { iv: password });
		const privkey = hex2a(privkeye.toString());

		let upair = null;
		try {
			upair = bitcoinjs.ECPair.fromWIF(privkey, config.network);
		} catch (e) {
			return null;
		}

		const priv = upair.toWIF();
		const pub = upair.publicKey.toString('hex');

		return { private: priv, public: pub, pair: upair };
	};
}

BitcoinService.$inject = ['config', '$currency'];

export default BitcoinService;