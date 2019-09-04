import BitcoinService, { BitcoinKeys } from '../../../../services/bitcoin/mnemonic';
import BitcoinLedgerService from '../../../../services/bitcoin/ledger';
import { Wallet, HardwareWalletType, Transaction } from '../../../../models/wallet';
import { ICookiesService } from '../../../../shared/types/angular-cookies';
import { LedgerWaitConfig } from '../../ledger-wait/ledger-wait';
import { BitcoinUTXO, BitcoinSignOptions, BackupFile, loadBackup } from '../../../../services/bitcoin/bitcoin-service';
import { Async } from '../../../..//shared/helpers/async';

export interface SignConfig {
	wallet?: Wallet;
	transaction?: Transaction;
	forceBackup?: boolean;

	sign?: (txhex: string, utxos: BitcoinUTXO[]) => Promise<string>;
	signMany?: (txs: { txhex: string; utxos: BitcoinUTXO[] }[]) => Promise<string[]>;
}

class WalletSignCtrl {
	$bitcoin: BitcoinService;
	$bitcoinLedger: BitcoinLedgerService;
	$timeout: angular.ITimeoutService;
	$cookies: ICookiesService;

	signConfig: SignConfig;

	username: string;
	email: string;
	ledgerWaitStatus: LedgerWaitConfig;
	model: {
		multisig: boolean;
		hardware: boolean;
		hardwareType: HardwareWalletType;
		useBackup: boolean;
		mnemonic: string;
		backup: {
			password: string;
			file: File;
			data: BackupFile;
		};
	}

	constructor($cookies, $timeout, $bitcoin, $bitcoinLedger) {
		this.$cookies = $cookies;
		this.$timeout = $timeout;
		this.$bitcoin = $bitcoin;
		this.$bitcoinLedger = $bitcoinLedger;

		this.model = {
			multisig: false,
			hardware: false,
			hardwareType: 'none',
			useBackup: false,
			mnemonic: '',
			backup: {
				password: '',
				file: null,
				data: null
			}
		};

		this.ledgerWaitStatus = {
			phase: 0,
			status: 'wait',
			button: false
		};
	}

	signMany(txs: { txhex: string; utxos: BitcoinUTXO[] }[]): Promise<string[]> {
		return Async.map(txs, tx => this.sign(tx.txhex, tx.utxos));
	}

	sign(txhex: string, utxos: BitcoinUTXO[]): Promise<string> {
		return new Promise((resolve, reject) => {
			this.updateData();

			const bsign: BitcoinSignOptions = {
				scripttype: this.model.multisig ? this.signConfig.transaction.scripttype : this.signConfig.wallet.scripttype,
				pubkeys: this.model.multisig ? this.signConfig.transaction.pubkeys : this.signConfig.wallet.pubkeys,
				utxos: utxos
			};

			if (this.model.multisig) {
				bsign.n = this.signConfig.transaction.n;
			}

			if (this.model.hardware && this.model.hardwareType == 'ledgernanos') {
				const ledgerWaitCallback = (phase, status) => {
					this.$timeout(() => {
						this.ledgerWaitStatus = {
							...this.ledgerWaitStatus, ...{
								phase: phase,
								status: status
							}
						};
					});
				};

				this.$bitcoinLedger.sign(txhex, bsign, ledgerWaitCallback).then(txhex => {
					resolve(txhex); 
				}).catch(_ => {
					// eslint-disable-next-line no-console
					console.log(_);
					this.$timeout(() => { reject('XHW1') }); 
				});
			} else if (!this.model.hardware && !this.model.useBackup) {
				const keys: BitcoinKeys = this.$bitcoin.mnemonicToKeys(this.model.mnemonic);

				if (bsign.pubkeys.indexOf(keys.public) == -1)
					return reject('XIM');

				bsign.seed = this.model.mnemonic;
				this.$bitcoin.sign(txhex, bsign).then(txhex => resolve(txhex)).catch(err => reject('E'));
			} else if (!this.model.hardware && this.model.useBackup) {
				if (this.model.backup.file === null)
					return reject('XNF');

				let keys: BitcoinKeys;
				try {
					keys = this.$bitcoin.decryptBackup(this.model.backup.data, this.model.backup.password, this.model.multisig);
					bsign.wif = keys.private;
				} catch (err) {
					return reject(err);
				}

				if (!this.model.multisig && bsign.pubkeys.indexOf(keys.public) == -1)
					return reject('XWA');

				// console.log(bsign)
				this.$bitcoin.sign(txhex, bsign).then(txhex => resolve(txhex)).catch(_ => reject('E'));
			}
		});
	}

	loadBackupFile(file: File) {
		this.model.backup.file = file;

		loadBackup(file).then(data => {
			this.model.backup.data = data;
		}).catch(_ => { });
	}

	updateData() {
		if (this.signConfig.transaction) {
			this.model.multisig = true;

			if ('hardwareadmins' in this.signConfig.transaction && this.signConfig.transaction.hardwareadmins.indexOf(this.email) != -1) {
				this.model.hardwareType = this.signConfig.transaction.hardwaretypes[this.signConfig.transaction.hardwareadmins.indexOf(this.email)];
				this.model.hardware = this.model.hardwareType != 'none';
			}
		} else if (this.signConfig.wallet) {
			this.model.multisig = false;

			this.model.hardware = ['ledgernanos'].indexOf(this.signConfig.wallet.hardware || 'none') != -1;
			this.model.hardwareType = this.signConfig.wallet.hardware;
		}
	}

	$onChanges(changes) {
		if (!changes.signConfig)
			return;

		this.updateData();

		this.model.useBackup = this.signConfig.forceBackup;

		this.signConfig.sign = (txhex, utxos) => this.sign(txhex, utxos);
		this.signConfig.signMany = (txs) => this.signMany(txs);
	}

	$onInit() {
		this.username = this.$cookies.get('username');
		this.email = this.$cookies.get('email');
	}

	static get $inject() { return ['$cookies', '$timeout', '$bitcoin', '$bitcoinLedger']; }
}

const WalletSignComponent = {
	templateUrl: 'components/dashboard/wallet/sign/sign.html',
	controller: WalletSignCtrl,
	bindings: {
		signConfig: '<',
		// wallet: '<' //TODO da valutare
		// transaction: '<' //TODO da valutare
	}
};

export default WalletSignComponent;