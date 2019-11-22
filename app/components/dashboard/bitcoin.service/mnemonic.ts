import * as bitcoinjs from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as CryptoJS from 'crypto-js';
import CurrencyService from '../../../services/currency';
import { BitcoinSignService, randomBytes, BitcoinSignOptions, BackupFile } from './bitcoin-service';
import AppSettings from '../../../app.settings';
import { Injectable } from '@angular/core';

require("babel-polyfill");


export type MnemonicChallenge = { index: number; correct: string; insert: string }[];
export type BitcoinKeys = { private: string; public: string; pair: bitcoinjs.ECPairInterface };

export function checkBitcoinAddress(address: string): boolean {
	try {
		bitcoinjs.address.toOutputScript(address, AppSettings.network);
		return true;
	} catch (e) {
		return false;
	}
}


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

/* Generate a new bip39 valid mnemonic */
export function generateMnemonic(): string {
	return bip39.generateMnemonic(128, randomBytes);
}


@Injectable()
export default class BitcoinService implements BitcoinSignService {
	constructor(private currencyService: CurrencyService) {}

	/* Decrypt key */
	decryptKeys(encpriv: string, password: string): BitcoinKeys | null {
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
			upair = bitcoinjs.ECPair.fromWIF(privkey, AppSettings.network);
		} catch (e) {
			return null;
		}

		const priv = upair.toWIF();
		const pub = upair.publicKey.toString('hex');

		return { private: priv, public: pub, pair: upair };
	}

	decryptBackup(backup: BackupFile, password: string, multisig: boolean = false): BitcoinKeys {
		if (backup === null)
			throw "XNJ";

		if (!('encprivkey' in backup) || !('pubkey' in backup))
			throw "XNJ";
		if (!multisig && !('address' in backup))
			throw "XNJ";
		if (multisig && !('walletid' in backup))
			throw "XNJ";

		const keys: BitcoinKeys = this.decryptKeys(backup.encprivkey, password);
		if (keys == null)
			throw "XWP";

		if (keys.public != backup.pubkey)
			throw "XWP";

		return keys
	}


	checkAddress(address: string): boolean {
		return checkBitcoinAddress(address);
	}

	evaluteFee(inputs, outputs, fast) {
		let speed = 'halfHourFee';
		if (fast) speed = 'fastestFee';

		return (outputs * 34 + inputs * 180 + 10) * this.currencyService.fees[speed] / 100000000.0;
	}


	/* Return the keypair from a mnemonic */
	mnemonicToKeys(secret: string): BitcoinKeys {
		const fixSeed = function (seed) {
			return seed
				.replace('%20', ' ')
				.replace('  ', ' ')
				.replace('\n', '')
				.replace('\r', '')
				.trim();
		};

		const seed = bip39.mnemonicToSeedSync(fixSeed(secret));
		const hd = bitcoinjs.ECPair.fromWIF(bip32.fromSeed(seed, AppSettings.network).toWIF(), AppSettings.network);
		const priv1 = hd.toWIF();
		const pub1 = hd.publicKey.toString('hex');
		return { private: priv1, public: pub1, pair: hd };
	}


	/* Random keypair */
	randomKeys(): BitcoinKeys {
		const pair2 = bitcoinjs.ECPair.makeRandom({ network: AppSettings.network, rng: randomBytes });
		const priv2 = pair2.toWIF();
		const pub2 = pair2.publicKey.toString('hex');

		return { private: priv2, public: pub2, pair: pair2 };
	}


	sign(txhex: string, options: BitcoinSignOptions): Promise<string> {
		if ('seed' in options)
			options.wif = this.mnemonicToKeys(options.seed).private;

		return new Promise((resolve, reject) => {
			const txb = bitcoinjs.Psbt.fromHex(txhex, { network: AppSettings.network });
			const upair = bitcoinjs.ECPair.fromWIF(options.wif, AppSettings.network);

			txb.signAllInputs(upair);
			resolve(txb.toHex());
		});
	}
}
