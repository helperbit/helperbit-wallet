import * as bitcoinjs from 'bitcoinjs-lib';
import * as LedgerTransport from '@ledgerhq/hw-transport-u2f';
import * as LedgerAppBtc from '@ledgerhq/hw-app-btc';
import { BitcoinSignService, BitcoinSignOptions, compressPublicKey, 
	toHexString, prepareScripts, toByteArray } from './bitcoin-service';
import { ConfigService } from '../../app.config';
import { deserializeCall } from '../../models/common';

require("babel-polyfill");


export default class BitcoinLedgerService implements BitcoinSignService {
	config: ConfigService;
	$http: any;

	defaultAccount: string;
	defaultPath: string;

	constructor (config: ConfigService, $http) {
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

	private getPublicKeyFromPath (path: string, ledgerWaitCallback) {
		if(!ledgerWaitCallback)
			ledgerWaitCallback = (phase, status) => {};

		ledgerWaitCallback(0, 'wait');
		
		return new Promise ((resolve, reject) => {
			LedgerTransport.default.create().then(transport => {
				ledgerWaitCallback(1, 'wait');
				transport.setDebugMode(true);
				const btc = new LedgerAppBtc.default(transport);
				ledgerWaitCallback(2, 'wait');
				btc.getWalletPublicKey(path, false, true).then(result => {
					const comppk = compressPublicKey(result.publicKey);
					ledgerWaitCallback(2, 'success');
					resolve (comppk);
				}).catch (err => {
					if (err.statusCode == 27010)
						ledgerWaitCallback(0, 'error');
					else if (err.id == 'U2F_5')
						ledgerWaitCallback(1, 'error');
					else
						ledgerWaitCallback(2, 'error');

					reject(err);
				});
			}).catch (err => {
				ledgerWaitCallback(0, 'error');
				reject(err);
			});
		});
	};

	getPublicKey (ledgerWaitCallback?: any) {
		return (this.getPublicKeyFromPath(this.defaultPath, ledgerWaitCallback) as Promise<string>);
	}

	sign(txhex: string, options: BitcoinSignOptions, ledgerWaitCallback): Promise<string> {	
		if(!ledgerWaitCallback)
			ledgerWaitCallback = (phase, status) => {};

		let segwit = false;

		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;
		if (options.scripttype != 'p2sh')
			segwit = true;

		const walletScripts = prepareScripts(options.scripttype, options.n, options.pubkeys, this.config.network);
		const redeemScriptHex = toHexString(walletScripts.p2shRedeem);
		
		return new Promise ((resolve, reject) => {
			ledgerWaitCallback(1, 'wait');
			this.getPublicKey().then ((publickey: string) => {
				ledgerWaitCallback(1, 'success');
				ledgerWaitCallback(2, 'wait');
				LedgerTransport.default.create().then(transport => {
					transport.setDebugMode(true);
					const btc = new LedgerAppBtc.default(transport);

					/* Download utxo transaction raw */
					this.rawTransactions(options.utxos.map(utxo => utxo.tx)).then (transactions => {
						/* Create inputs and serialized outputs */
						const inputs = options.utxos.map (utxo => [ 
							btc.splitTransaction(transactions[utxo.tx], bitcoinjs.Transaction.fromHex(transactions[utxo.tx]).hasWitnesses()), 
							utxo.n, 
							walletScripts.p2wshRedeem.toString('hex'),
							bitcoinjs.Transaction.fromHex(transactions[utxo.tx]).ins[utxo.n].sequence 
						]);
						const paths = inputs.map(i => this.defaultPath);
						const outshex = btc.serializeTransactionOutputs(btc.splitTransaction(txhex, true)).toString('hex');

						/* Sign the transaction */
						const tx = bitcoinjs.Transaction.fromHex(txhex);
						const txb = bitcoinjs.TransactionBuilder.fromTransaction(tx, this.config.network);

						btc.signP2SHTransaction(inputs, paths, outshex, 0/*tx.locktime*/, 1 /*SIGHASH_ALL*/, segwit, tx.version).then(signatures => {
							/* Inject signatures */

							for (let j = 0; j < tx.ins.length; j++) {
								txb.sign(j, ({
									network: this.config.network,
									publicKey: toByteArray(publickey),
									sign: (hash) => 
										bitcoinjs.script.signature.decode(toByteArray(signatures[j])).signature

								} as bitcoinjs.ECPair), walletScripts.p2shRedeem, null, options.utxos[j].value, walletScripts.p2wshRedeem);
							}

							ledgerWaitCallback(2, 'success');

							/* Build the transaction */
							if (options.complete)
								resolve(txb.build().toHex());
							else
								resolve(txb.buildIncomplete().toHex());
						}).catch (err => {
							ledgerWaitCallback(2, 'error');
							return reject(err);
						});
					}).catch (err => {
						// eslint-disable-next-line no-console
						console.log('Failed acquiring txhashes:', err);
						return reject(err);
					});
				});
			}).catch (err => {
				reject(err);
			});
		});
	}

	static get $inject() { return ['config', '$http'] };
}