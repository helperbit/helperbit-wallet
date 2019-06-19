import * as bitcoinjs from 'bitcoinjs-lib';

export type BitcoinSignOptions = {
	seed?: string,
	wif?: string,
	n?: number,
	complete?: boolean,
	scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh',
	utxos: { value: number, tx: string, n: number }[],
	pubkeys: string[]
};


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

	return new Buffer(rawBytes);
}

export function toHexString(buffer: Buffer) {
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

export function toByteArray(hexString: string) {
	const Buffer = require('safe-buffer').Buffer
	const result = new Buffer(hexString.length / 2);
	let i = 0;
	while (hexString.length >= 2) {
		result[i] = parseInt(hexString.substring(0, 2), 16);
		i += 1;
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

export function compressPublicKey(pk: string): string {
	return exports.toHexString(bitcoinjs.ECPair.fromPublicKey(exports.toByteArray(pk)).publicKey);
}

export type Scripts = {
	address: string,
	scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh',
	p2sh?: any,
	p2shRedeem?: Buffer,
	p2wsh?: any,
	p2wshRedeem?: Buffer
};

export function prepareScripts(scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh', n: number, pubkeys: string[], network: any): Scripts {
	const pubkeysRaw = pubkeys.map(hex => new Buffer(hex, 'hex'));
	const p2ms = bitcoinjs.payments.p2ms({ m: n, pubkeys: pubkeysRaw, network: network });

	switch (scripttype) {
		case 'p2sh': {
			const p2sh = bitcoinjs.payments.p2sh({ redeem: p2ms, network: network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh,
				p2shRedeem: p2sh.redeem.output
			};
			return res;
		}

		case 'p2sh-p2wsh': {
			const p2wsh = bitcoinjs.payments.p2wsh({ redeem: p2ms, network: network });
			const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wsh, network: network });
			const res: Scripts = {
				address: p2sh.address,
				scripttype: scripttype,
				p2sh: p2sh,
				p2shRedeem: p2sh.redeem.output,
				p2wsh: p2wsh,
				p2wshRedeem: p2wsh.redeem.output
			};
			return res;
		}

		case 'p2wsh': {
			const p2wsh = bitcoinjs.payments.p2wsh({ redeem: p2ms, network: network });
			const res: Scripts = {
				address: p2wsh.address,
				scripttype: scripttype,
				p2wsh: p2wsh,
				p2wshRedeem: p2wsh.redeem.output
			};
			return res;
		}
	}
}

