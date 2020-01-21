import { Payment, payments, ECPair, Network } from 'bitcoinjs-lib';
import { AES } from 'crypto-js';

export type BackupFileMultisig = {
	pubkeysrv: string;
	walletid: string;
	label: string;
	organization: string;
};

export type BackupFileSingle = {
	address: string;
	pubkeys: string[];
};

export type BackupFile = (BackupFileSingle | BackupFileMultisig) & {
	user: string;
	scripttype: BitcoinScriptType;
	encprivkey: string;
	pubkey: string;
};


export type BitcoinUTXO = { value: number; tx: string; n: number };

export type BitcoinScriptType = 'p2wsh' | 'p2sh' | 'p2sh-p2wsh';

export type BitcoinSignOptions = {
	seed?: string;
	wif?: string;
	n?: number;
	scripttype: BitcoinScriptType;
	utxos: BitcoinUTXO[];
	pubkeys: string[];
};



/* Encrypt key */
export function encryptKeys(privateKey: string, password: string): string {
	const ence = AES.encrypt(privateKey, password, { iv: password });
	return ence.toString();
}

export function loadBackup(file: File): Promise<BackupFile> {
	return new Promise((resolve, reject) => {
		if (file === null)
			return reject(null);

		const reader = new FileReader();

		reader.onload = (event: any) => {
			const data = event.target.result;
			try {
				resolve(JSON.parse(data));
			} catch (err) {
				reject(err);
			}
		};
		reader.readAsText(file);
	});
}

export function randomBytes(size: number): Buffer {
	const Buffer = require('safe-buffer').Buffer
	const crypto = (global as any).crypto || (global as any).msCrypto;
	// phantomjs needs to throw
	if (size > 65536) throw new Error('requested too many random bytes')
	// in case browserify  isn't using the Uint8Array version
	const rawBytes = new global.Uint8Array(size)

	// This will not work in older browsers.
	// See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
	if (size > 0) {
		// getRandomValues fails on IE if size == 0
		crypto.getRandomValues(rawBytes)
	}

	return Buffer.from(rawBytes);
}

export function toHexString(buffer: Buffer) {
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

export function toByteArray(hexString: string) {
	const Buffer = require('safe-buffer').Buffer
	const result = Buffer.alloc(hexString.length / 2);
	let i = 0;
	while (hexString.length >= 2) {
		result[i] = parseInt(hexString.substring(0, 2), 16);
		i += 1;
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

export function compressPublicKey(pk: string): string {
	return toHexString(ECPair.fromPublicKey(toByteArray(pk)).publicKey);
}

export type Scripts = {
	address: string;
	scripttype: BitcoinScriptType;
	p2sh?: Payment;
	p2wsh?: Payment;
};

export function prepareScripts(scripttype: BitcoinScriptType, n: number, pubkeys: string[], network: Network): Scripts {
	const pubkeysRaw = pubkeys.map(hex => Buffer.from(hex, 'hex'));
	const p2ms = payments.p2ms({ m: n, pubkeys: pubkeysRaw, network: network });

	switch (scripttype) {
		case 'p2sh': {
			const p2sh = payments.p2sh({ redeem: p2ms, network: network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh
			};
			return res;
		}

		case 'p2sh-p2wsh': {
			const p2wsh = payments.p2wsh({ redeem: p2ms, network: network });
			const p2sh = payments.p2sh({ redeem: p2wsh, network: network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh,
				p2wsh: p2wsh
			};
			return res;
		}

		case 'p2wsh': {
			const p2wsh = payments.p2wsh({ redeem: p2ms, network: network });
			const res: Scripts = {
				address: p2wsh.address,
				scripttype: scripttype,
				p2wsh: p2wsh
			};
			return res;
		}
	}
}


export interface BitcoinSignService {
	sign(txhex: string, options: BitcoinSignOptions, callback?): Promise<string>;
}


export function scriptTypeOfBitcoinScriptType(st: BitcoinScriptType) {
	switch (st) {
		case 'p2sh':
			return 'p2sh-p2pkh';
		case 'p2sh-p2wsh':
			return 'p2sh-p2wsh-p2pk';
		case 'p2wsh':
			return 'p2wsh-p2pkh';
	}
}