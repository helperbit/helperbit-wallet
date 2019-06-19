import * as common from './common';
import * as bitcoinjs from 'bitcoinjs-lib';
import * as LedgerTransport from '@ledgerhq/hw-transport-u2f';
import * as LedgerAppBtc from '@ledgerhq/hw-app-btc';

require("babel-polyfill");


function BitcoinLedgerService (config, $api) {
	const defaultAccount = '7276'; // HB
	const defaultPath = "44'/" + (config.networkName == 'testnet' ? '1' : '0') + "'/" + defaultAccount + "'/0/0";
	this.defaultPath = defaultPath;

	this.getPublicKeyFromPath = function (path, ledgerWaitCallback) {
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
					const comppk = common.compressPublicKey(result.publicKey);
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

	this.getPublicKey = function(ledgerWaitCallback) {
		return this.getPublicKeyFromPath(this.defaultPath, ledgerWaitCallback);
	};

	this.sign = function (txhex: string, options: common.BitcoinSignOptions, ledgerWaitCallback): Promise<string> {
		const self = this;
	
		if(!ledgerWaitCallback)
			ledgerWaitCallback = (phase, status) => {};

		let segwit = false;

		if (!('n' in options))
			options.n = 2;
		if (!('complete' in options))
			options.complete = true;
		if (options.scripttype != 'p2sh')
			segwit = true;

		const walletScripts = common.prepareScripts(options.scripttype, options.n, options.pubkeys, config.network);
		const redeemScriptHex = common.toHexString(walletScripts.p2shRedeem);
		

		return new Promise ((resolve, reject) => {
			ledgerWaitCallback(1, 'wait');
			self.getPublicKey().then (publickey => {
				ledgerWaitCallback(1, 'success');
				ledgerWaitCallback(2, 'wait');
				LedgerTransport.default.create().then(transport => {
					transport.setDebugMode(true);
					const btc = new LedgerAppBtc.default(transport);

					/* Download utxo transaction raw */
					$api.blockchain.rawTransactions(options.utxos.map(utxo => utxo.tx)).then (data => {
						/* Create inputs and serialized outputs */
						const inputs = options.utxos.map (utxo => [ 
							btc.splitTransaction(data.data.transactions[utxo.tx], bitcoinjs.Transaction.fromHex(data.data.transactions[utxo.tx]).hasWitnesses()), 
							utxo.n, 
							walletScripts.p2wshRedeem.toString('hex'),
							bitcoinjs.Transaction.fromHex(data.data.transactions[utxo.tx]).ins[utxo.n].sequence 
						]);
						const paths = inputs.map(i => self.defaultPath);
						const outshex = btc.serializeTransactionOutputs(btc.splitTransaction(txhex, true)).toString('hex');

						/* Sign the transaction */
						const tx = bitcoinjs.Transaction.fromHex(txhex);
						const txb = bitcoinjs.TransactionBuilder.fromTransaction(tx, config.network);

						btc.signP2SHTransaction(inputs, paths, outshex, 0/*tx.locktime*/, 1 /*SIGHASH_ALL*/, segwit, tx.version).then(signatures => {
							/* Inject signatures */

							for (let j = 0; j < tx.ins.length; j++) {
								txb.sign(j, ({
									network: config.network,
									publicKey: common.toByteArray(publickey),
									sign: (hash) => 
										bitcoinjs.script.signature.decode(common.toByteArray(signatures[j])).signature

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
						console.log('Failed acquiring txhashes:', err);
						return reject(err);
					});
				});
			}).catch (err => {
				reject(err);
			});
		});
	};
}

BitcoinLedgerService.$inject = ['config', '$api'];

export default BitcoinLedgerService;