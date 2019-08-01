import * as angular from 'angular';
import * as $ from 'jquery';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import { LedgerWaitConfig } from '../../ledger-wait/ledger-wait';
import BitcoinService from '../../../../services/bitcoin/mnemonic';
import BitcoinLedgerService from '../../../../services/bitcoin/ledger';
import { ICookiesService } from '../../../../shared/types/angular-cookies';
import RorService, { Ror } from '../../../../models/ror';
import NotificationService from '../../../../models/notifications';
import WalletService from '../../../../models/wallet';

/* User profile /me/wallet */
class MeWalletSignMultisigCtrl {
	$walletService: WalletService;
	$rorService: RorService;
	$timeout: angular.ITimeoutService;
	$bitcoin: BitcoinService;
	$bitcoinLedger: BitcoinLedgerService;
	$cookies: ICookiesService;
	$notificationService: NotificationService;

	username: string;
	email: string;
	model: {
		hardware: boolean;
		hardwareType: string;
		transactions: any[];
		selected: any;
		mnemonic: string;
		rors: { [id: string]: Ror };
		refused: boolean;
		useBackup: boolean;
		backup: {
			password: string;
			file: any;
			data: any;
		};
	};

	wizard: {
		step1: WizardStep<void>;
		step2: WizardStep<{ ledgerWaitStatus: LedgerWaitConfig; exec: () => void }>;
		step3: WizardStep<void>;
	};

	constructor($notificationService, $rorService, $walletService, $bitcoin, $bitcoinLedger, $translate, WizardHandler, $cookies, $timeout) {
		this.$bitcoin = $bitcoin;
		this.$walletService = $walletService;
		this.$timeout = $timeout;
		this.$rorService = $rorService;
		this.$bitcoinLedger = $bitcoinLedger;
		this.$cookies = $cookies;
		this.$notificationService = $notificationService;

		this.wizard = { step1: null, step2: null, step3: null };

		this.model = {
			hardware: false,
			hardwareType: 'none',
			transactions: [],
			selected: null,
			mnemonic: '',
			rors: {},
			refused: false,
			useBackup: false,
			backup: {
				password: '',
				file: null,
				data: null
			}
		};


		this.wizard.step1 = new WizardStep('signMultisig', WizardHandler);
		this.wizard.step1.setTitles({
			main: $translate.getString('Transactions'),
			heading: $translate.getString('Multisig transaction to sign')
		});

		this.wizard.step2 = new WizardStep('signMultisig', WizardHandler);
		this.wizard.step2.setTitles({
			main: $translate.getString('Sign'),
			heading: $translate.getString('Sign a transaction')
		});
		this.wizard.step2.initializeModel({
			ledgerWaitStatus: {
				phase: 0,
				status: 'wait',
				exec: () => { },
				button: false
			},
			exec: () => { this.sign(); }
		})


		this.wizard.step3 = new WizardStep('signMultisig', WizardHandler);
		this.wizard.step3.setTitles({
			main: $translate.getString('Done')
		});
	}

	sign() {
		const sendSignedTransaction = (txhex) => {
			this.$walletService.signMultisigTransaction(this.model.selected._id, txhex).then(_ => {
				this.$notificationService.emitUpdate('wallet');
				this.wizard.step2.next();

				return this.$timeout(() => {
					this.wizard.step2.loading = false;
					this.$onInit();
				});
			}).catch((res) => {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'E' });
					this.wizard.step2.loading = false;
				});
			});
		};

		const ledgerWaitCallback = (phase, status) => {
			this.$timeout(() => {
				this.wizard.step2.model.ledgerWaitStatus = {
					...this.wizard.step2.model.ledgerWaitStatus, ...{
						phase: phase,
						status: status
					}
				};
			});
		};
		let keys;

		this.wizard.step2.resetResponse();

		/* Sign with hardware */
		if (this.model.hardware) {

		}
		/* Sign with mnemonic */
		else if (!this.model.useBackup) {
			keys = this.$bitcoin.mnemonicToKeys(this.model.mnemonic);

			if ($.inArray(keys.public, this.model.selected.pubkeys) == -1) {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'XIM' });
				});
			}
		}
		/* Sign with backup file */
		else {
			/* Errors */
			if (this.model.backup.file === null) {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'XNF' });
				});
			}

			if (this.model.backup.data === null) {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'XNJ' });
				});
			}

			if (!('encprivkey' in this.model.backup.data) ||
				!('walletid' in this.model.backup.data) ||
				!('pubkey' in this.model.backup.data)) {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'XNJ' });
				});
			}

			keys = this.$bitcoin.decryptKeys(this.model.backup.data.encprivkey, this.model.backup.password);

			if (keys == null) {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: 'XWAP' });
				});
			}
		}

		this.wizard.step2.loading = true;

		/* Request the updated tx */
		this.$walletService.getMultisigTransactions().then(txs => {
			for (let i = 0; i < txs.length; i++) {
				if (txs[i].txid == this.model.selected.txid)
					this.model.selected = txs[i];
			}

			/* Put the signature */
			if (this.model.hardware && this.model.hardwareType == 'ledgernanos') {
				this.$bitcoinLedger.sign(this.model.selected.hex, {
					scripttype: this.model.selected.scripttype,
					utxos: this.model.selected.utxos,
					n: this.model.selected.n,
					complete: false,
					pubkeys: this.model.selected.pubkeys
				}, ledgerWaitCallback).then(txhex => {
					sendSignedTransaction(txhex);
				}).catch(err => {
					return this.$timeout(() => {
						this.wizard.step2.setResponse('error', { error: 'XHW1' });
						this.wizard.step2.loading = false;
					});
				});
			} else if (!this.model.hardware) {
				this.$bitcoin.sign(this.model.selected.hex, {
					scripttype: this.model.selected.scripttype,
					wif: this.model.hardware ? null : keys.private,
					utxos: this.model.selected.utxos,
					n: this.model.selected.n,
					complete: false,
					pubkeys: this.model.selected.pubkeys
				}).then(txhex => {
					sendSignedTransaction(txhex);
				}).catch(err => {
					return this.$timeout(() => {
						this.wizard.step2.setResponse('error', { error: 'E' });
						this.wizard.step2.loading = false;
					});
				});
			}
		});
	}

	loadBackupFile(file) {
		this.wizard.step2.resetResponse();
		this.model.backup.file = file;

		if (file === null) {
			this.model.backup.data = null;
			return;
		}

		const reader = new FileReader();

		reader.onload = (event: any) => {
			const data = event.target.result;
			this.model.backup.data = JSON.parse(data);
		};
		reader.readAsText(file);
	}

	refuse() {
		this.$walletService.refuseMultisigTransaction(this.model.selected._id).then(_ => {
			this.model.refused = true;
			this.wizard.step2.next();
		}).catch((res) => {
			return this.$timeout(() => {
				this.wizard.step2.setResponse('error', { error: 'E' });
			});
		});
	}


	selectTransaction(tx) {
		this.model.selected = tx;
		this.model.mnemonic = '';
		this.model.refused = false;
		this.model.hardware = false;
		this.model.hardwareType = 'none';

		if ('hardwareadmins' in this.model.selected && this.model.selected.hardwareadmins.indexOf(this.email) != -1) {
			this.model.hardware = true;
			this.model.hardwareType = this.model.selected.hardwaretypes[this.model.selected.hardwareadmins.indexOf(this.email)];
		}

		this.wizard.step1.next();
	}

	openModal() {
		$('#signModal').modal('show');
	}


	$onInit() {
		this.username = this.$cookies.get('username');
		this.email = this.$cookies.get('email');

		this.$walletService.getMultisigTransactions().then(txs => {
			this.model.rors = {};

			this.model.transactions = txs.filter(tx =>
				tx.status == 'signing' && this.username != tx.from && tx.signers.indexOf(this.email) == -1
			);
			this.model.transactions.forEach(tx => {
				if (tx.ror) {
					this.$rorService.get(tx.ror, true).then((ror: Ror) => {
						this.model.rors[ror._id] = ror;
					});
				}
			});

			if (this.model.transactions.length > 0) {
				this.openModal();
			}
		});
	}

	static get $inject() { return ['$notificationService', '$rorService', '$walletService', '$bitcoin', '$bitcoinLedger', '$translate', 'WizardHandler', '$cookies', '$timeout']; }
}


const MeWalletSignMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/signmultisig/signmultisig.html',
	controller: MeWalletSignMultisigCtrl
};

export default MeWalletSignMultisigComponent;