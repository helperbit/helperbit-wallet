import * as bitcoinjs from 'bitcoinjs-lib';
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Btc from "@ledgerhq/hw-app-btc";
import {
	BitcoinSignService, BitcoinSignOptions, compressPublicKey,
	prepareScripts, toByteArray, scriptTypeOfBitcoinScriptType
} from './bitcoin-service';
import { ConfigService } from '../../app.config';
import { deserializeCall } from '../../models/common';

require("babel-polyfill");


export default class BitcoinLedgerService implements BitcoinSignService {
	config: ConfigService;
	$http: any;

	defaultAccount: string;
	defaultPath: string;

	constructor(config: ConfigService, $http) {
		this.config = config;
		this.$http = $http;

		this.defaultAccount = '7276'; // HB
		this.defaultPath = "44'/" + (config.networkName == 'testnet' ? '1' : '0') + "'/" + this.defaultAccount + "'/0/0";
	}

	private rawTransactions(hashes: string[]): Promise<{ [txid: string]: string }> {
		return deserializeCall<{ [txid: string]: string }>(
			this.$http.post(this.config.apiUrl + '/blockchain/rawtransactions', { hashes: hashes }),
			'transactions'
		);
	}

	private getPublicKeyFromPath(path: string, ledgerWaitCallback) {
		if (!ledgerWaitCallback)
			ledgerWaitCallback = (phase, status) => { };

		ledgerWaitCallback(0, 'wait');

		return new Promise((resolve, reject) => {
			TransportU2F.create().then(transport => {
				ledgerWaitCallback(1, 'wait');

				const btc = new Btc(transport);
				ledgerWaitCallback(2, 'wait');
				btc.getWalletPublicKey(path, { verify: false, format: 'legacy' }).then(result => {
					const comppk = compressPublicKey(result.publicKey);
					ledgerWaitCallback(2, 'success');
					resolve(comppk);
				}).catch(err => {
					if (err.statusCode == 27010)
						ledgerWaitCallback(0, 'error');
					else if (err.id == 'U2F_5')
						ledgerWaitCallback(1, 'error');
					else
						ledgerWaitCallback(2, 'error');

					reject(err);
				});
			}).catch(err => {
				ledgerWaitCallback(0, 'error');
				reject(err);
			});
		});
	};

	getPublicKey(ledgerWaitCallback?: any) {
		return (this.getPublicKeyFromPath(this.defaultPath, ledgerWaitCallback) as Promise<string>);
	}

	sign(txhex: string, options: BitcoinSignOptions, ledgerWaitCallback): Promise<string> {
		if (!ledgerWaitCallback)
			ledgerWaitCallback = (phase, status) => { };

		let segwit = false;

		if (!('n' in options))
			options.n = 2;
		if (options.scripttype != 'p2sh')
			segwit = true;

		const walletScripts = prepareScripts(options.scripttype, options.n, options.pubkeys, this.config.network);

		return new Promise((resolve, reject) => {
			ledgerWaitCallback(1, 'wait');
			this.getPublicKey().then((publickey: string) => {
				ledgerWaitCallback(1, 'success');
				ledgerWaitCallback(2, 'wait');
				TransportU2F.create().then(transport => {
					const btc = new Btc(transport);

					/* Download utxo transaction raw */
					this.rawTransactions(options.utxos.map(utxo => utxo.tx)).then(transactions => {
						/* Create inputs and serialized outputs */
						const inputs = options.utxos.map(utxo => [
							btc.splitTransaction(transactions[utxo.tx], bitcoinjs.Transaction.fromHex(transactions[utxo.tx]).hasWitnesses()),
							utxo.n,
							walletScripts.p2wsh.redeem.output.toString('hex'),
							// bitcoinjs.Transaction.fromHex(transactions[utxo.tx]).outs[utxo.n].sequence
						]);
						const paths = inputs.map(i => this.defaultPath);
						const txb = bitcoinjs.Psbt.fromHex(txhex, { network: this.config.network });
						const outshex = btc.serializeTransactionOutputs(btc.splitTransaction((txb as any).__CACHE.__TX.toHex(), true)).toString('hex');

						btc.signP2SHTransaction(inputs, paths, outshex, 0/*tx.locktime*/, 1 /*SIGHASH_ALL*/, segwit, 2).then(signatures => {
							/* Inject signatures */
							for (let j = 0; j < txb.inputCount; j++) {
								txb.signInput(j, {
									network: this.config.network,
									publicKey: toByteArray(publickey),
									sign: (hash) => bitcoinjs.script.signature.decode(toByteArray(signatures[j])).signature
								} as bitcoinjs.ECPairInterface);
							}

							ledgerWaitCallback(2, 'success');

							/* Build the transaction */
							resolve(txb.toHex());
						}).catch(err => {
							ledgerWaitCallback(2, 'error');
							return reject(err);
						});
					}).catch(err => {
						// eslint-disable-next-line no-console
						console.log('Failed acquiring txhashes:', err);
						ledgerWaitCallback(2, 'error');
						return reject(err);
					});
				}).catch(err => {
					ledgerWaitCallback(2, 'error');
					return reject(err);
				})
			}).catch(err => {
				ledgerWaitCallback(1, 'error');
				return reject(err);
			});
		});
	}

	static get $inject() { return ['config', '$http'] };
}