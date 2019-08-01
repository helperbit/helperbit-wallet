import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as CryptoJS from 'crypto-js';
import CurrencyService from '../currency';
import { BitcoinSignService, randomBytes, BitcoinSignOptions, prepareScripts } from './bitcoin-service';
import { ConfigService } from '../../app.config';

require("babel-polyfill");


export type MnemonicChallenge = { index: number; correct: string; insert: string }[];

export function checkMnemonicChallenge(challenge: MnemonicChallenge) {
	for (let i = 0; i < challenge.length; i++) {
		if (challenge[i].correct != challenge[i].insert) {
			return false;
		}
	}
	return true;
}

export function createMnemonicChallenge(mnemonic: string): MnemonicChallenge {
	const mn2 = mnemonic.split(' ');
	const el1 = Math.floor(Math.random() * 4);
	const el2 = Math.floor(Math.random() * 4);
	const el3 = Math.floor(Math.random() * 4);
	return [
		{ index: el1 + 1, correct: mn2[el1], insert: '' },
		{ index: el2 + 5, correct: mn2[4 + el2], insert: '' },
		{ index: el3 + 9, correct: mn2[8 + el3], insert: '' }
	];
}

export default class BitcoinService implements BitcoinSignService {
	config: ConfigService;
	$currency: CurrencyService;

	constructor(config: ConfigService, $currency: CurrencyService) {
		this.config = config;
		this.$currency = $currency;
	}

	/* Generate a new bip39 valid mnemonic */
	generateMnemonic() {
		return bip39.generateMnemonic(128, randomBytes);
	}

	/* Check if the given address is valid */
	checkAddress(address: string) {
		try {
			bitcoinjs.address.toOutputScript(address, this.config.network);
			return true;
		} catch (e) {
			return false;
		}
	}


	evaluteFee(inputs, outputs, fast) {
		let speed = 'halfHourFee';
		if (fast) speed = 'fastestFee';

		return (outputs * 34 + inputs * 180 + 10) * this.$currency.fees[speed] / 100000000.0;
	}


	/* Return the keypair from a mnemonic */
	mnemonicToKeys(secret: string) {
		const fixSeed = function (seed) {
			return seed
				.replace('%20', ' ')
				.replace('  ', ' ')
				.replace('\n', '')
				.replace('\r', '')
				.trim();
		};

		const seed = bip39.mnemonicToSeed(fixSeed(secret));
		const hd = bip32.fromSeed(seed, this.config.network);
		const priv1 = hd.toWIF();
		const pub1 = hd.publicKey.toString('hex');
		return { private: priv1, public: pub1 };
	}


	/* Random keypair */
	randomKeys(): { private: string; public: string } {
		const pair2 = bitcoinjs.ECPair.makeRandom({ network: this.config.network, rng: randomBytes });
		const priv2 = pair2.toWIF();
		const pub2 = pair2.publicKey.toString('hex');

		return { private: priv2, public: pub2 };
	}


	sign(txhex: string, options: BitcoinSignOptions): Promise<string> {
		if ('seed' in options)
			options.wif = this.mnemonicToKeys(options.seed).private;
		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;

		let segwit = false;
		if (options.scripttype != 'p2sh')
			segwit = true;

		return new Promise((resolve, reject) => {
			const tx = bitcoinjs.Transaction.fromHex(txhex);
			const txb = bitcoinjs.TransactionBuilder.fromTransaction(tx, this.config.network);
			const upair = bitcoinjs.ECPair.fromWIF(options.wif, this.config.network);
			const walletScripts = prepareScripts(options.scripttype, options.n, options.pubkeys, this.config.network);

			for (let j = 0; j < tx.ins.length; j++) {
				switch (options.scripttype) {
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
	}

	/* Encrypt key */
	encryptKeys(privateKey: string, password: string): string {
		const ence = CryptoJS.AES.encrypt(privateKey, password, { iv: password });
		return ence.toString();
	}

	/* Decrypt key */
	decryptKeys(encpriv: string, password: string): { private: string; public: string; pair: bitcoinjs.ECPair } | null {
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
			upair = bitcoinjs.ECPair.fromWIF(privkey, this.config.network);
		} catch (e) {
			return null;
		}

		const priv = upair.toWIF();
		const pub = upair.publicKey.toString('hex');

		return { private: priv, public: pub, pair: upair };
	}

	static get $inject() { return ['config', '$currency']; }
}
