import * as angular from 'angular';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import WalletService, { Wallet, WalletTransaction, Transaction } from '../../../../models/wallet';
import NotificationService from '../../../../models/notifications';
import { SignConfig } from '../sign/sign';
import ConfigService from '../../../../app.config';
import { checkBitcoinAddress } from '../../../../services/bitcoin/mnemonic';

class MeWalletWithdrawCtrl {
	$walletService: WalletService;
	$timeout: angular.ITimeoutService;
	config: ConfigService;

	resolve: {
		modalData: {
			address: string;
			destination: string;
			mtype: 'withdraw' | 'eventdonation';
			donation: string;
			event: string;
			description: string;
			value: string;
			ror?: string;
			distribution?: any;
		};
	};
	dismiss: ({ $value: any }) => void;
	close: ({ $value: any }) => void;

	mtype: 'withdraw' | 'eventdonation';
	wallet: Wallet & { txs?: WalletTransaction[]; pendingtxs?: Transaction[] };
	signConfig: SignConfig;
	donation: string;
	fixedDestination: string;
	fixedValue: string;
	fixedDescription: string;
	event: any;
	distribution: any;
	distributionn: any;
	balance: { balance: number; unconfirmed: number };

	model: {
		destination: string;
		fee: number;
		feeprofile: string;
		value: number;
		vvalue: number;
		description?: string;
		txid?: any;
		fees?: any;
	};
	multisigWizard: { step1: WizardStep<void>; step2: WizardStep<void>; step3: WizardStep<void> };
	singleWizard: {
		step1: WizardStep<void>;
		step2: WizardStep<void>;
		step3: WizardStep<void>;
	};

	constructor($walletService, $timeout, config, $notificationService: NotificationService, WizardHandler, $translate) {
		this.$timeout = $timeout;
		this.$walletService = $walletService;
		this.config = config;

		this.mtype = 'withdraw';
		this.model = {
			destination: '',
			fee: 0.0,
			feeprofile: 'fastest',
			value: config.minDonation,
			vvalue: 0.0,
		};

		this.signConfig = {
			wallet: null
		};

		this.multisigWizard = { step1: null, step2: null, step3: null };
		this.multisigWizard.step1 = new WizardStep('withdrawMultisig', WizardHandler);
		this.multisigWizard.step1.setTitles({ main: $translate.getString('Send') });


		this.multisigWizard.step2 = new WizardStep('withdrawMultisig', WizardHandler);
		this.multisigWizard.step2.setTitles({ main: $translate.getString('Summary') });

		this.multisigWizard.step2.setSubmitHandler((_) => {
			this.multisigWizard.step2.resetResponse();
			this.multisigWizard.step2.loading = true;

			const wreq = {
				fee: this.model.fee,
				value: this.model.vvalue,
				destination: this.model.destination,
				description: this.model.description,
			};

			if ('ror' in this.resolve.modalData)
				wreq['ror'] = this.resolve.modalData.ror;


			this.$walletService.withdraw(this.wallet.address, wreq).then(data => {
				this.multisigWizard.step2.loading = false;
				$notificationService.emitUpdate('wallet');
				this.multisigWizard.step2.next();
			}).catch((res) => {
				this.multisigWizard.step2.setResponse('error', res.data);
				this.multisigWizard.step2.loading = false;
			});
		});

		this.multisigWizard.step3 = new WizardStep('withdrawMultisig', WizardHandler);
		this.multisigWizard.step3.setTitles({ main: $translate.getString('Done') });


		this.singleWizard = { step1: null, step2: null, step3: null };
		this.singleWizard.step1 = new WizardStep('withdrawSingle', WizardHandler);
		this.singleWizard.step1.setTitles({ main: $translate.getString('Send') });


		this.singleWizard.step2 = new WizardStep('withdrawSingle', WizardHandler);
		this.singleWizard.step2.setTitles({ main: $translate.getString('Summary') });

		this.singleWizard.step2.setSubmitHandler((_) => {
			const sendTransaction = (txhex) => {
				this.$walletService.sendTransaction(this.wallet.address, txhex, this.donation).then(txid => {
					this.singleWizard.step2.next();
					return $timeout(() => {
						this.model.txid = txid;
						this.singleWizard.step2.loading = false;
					});
				}).catch((res) => {
					return $timeout(() => {
						this.singleWizard.step2.setResponse('error', res.data);
						this.singleWizard.step2.loading = false;
					});
				});
			};

			this.singleWizard.step2.loading = true;

			const wreq = {
				fee: this.model.fee,
				value: this.model.vvalue,
				destination: this.model.destination
			};

			this.$walletService.withdraw(this.wallet.address, wreq).then(data => {
				this.signConfig.sign(data.txhex, data.utxos).then(txhex => sendTransaction(txhex)).catch(err => {
					return $timeout(() => {
						this.singleWizard.step2.setResponse('error', { error: err });
						this.singleWizard.step2.loading = false;
					});
				});
			}).catch((res) => {
				this.singleWizard.step2.setResponse('error', res.data);
				this.singleWizard.step2.loading = false;
			});
		});

		this.singleWizard.step3 = new WizardStep('withdrawSingle', WizardHandler);
		this.singleWizard.step3.setTitles({ main: $translate.getString('Done') });
	}


	eventDonate() {
		const sendDonation = (txhex, donation) => {
			this.$walletService.sendTransaction(this.wallet.address, txhex, donation).then(txid => {
				this.model.txid = txid;
				this.singleWizard.step1.loading = false;
				this.singleWizard.step1.next();
			}).catch((res) => {
				this.singleWizard.step1.setResponse('error', res.data);
				this.singleWizard.step1.loading = false;
			});
		};

		this.singleWizard.step1.loading = true;
		this.model.value = parseFloat('' + this.model.value);

		const donreq = {
			address: this.wallet.address,
			value: this.model.value,
			users: this.distribution,
			fee: this.model.fee
		};

		this.$walletService.createEventDonation(this.event, donreq).then(data => {
			this.signConfig.sign(data.txhex, data.utxos).then(txhex => sendDonation(txhex, data.donation)).catch(err => {
				// eslint-disable-next-line no-console
				console.log(err);
			});
		}).catch((res) => {
			this.singleWizard.step1.setResponse('error', res.data);
		});
	}

	cancel() {
		this.dismiss({ $value: 'cancel' });
	}

	/*close (txid) {
		this.close({ $value: txid });
	}*/


	withdrawFeeDo() {
		let currentStep: WizardStep<any> = null;
		if (this.wallet.ismultisig)
			currentStep = this.multisigWizard.step1;
		else
			currentStep = this.singleWizard.step1;


		if (!checkBitcoinAddress(this.model.destination, this.config)) {
			return this.$timeout(() => {
				currentStep.setResponse('error', { error: 'EW2' });
				this.multisigWizard.step1.setResponse('error', { error: 'EW2' });
			});
		}

		currentStep.loading = true;
		currentStep.resetResponse();

		this.model.value = parseFloat('' + this.model.value);

		/* Get the fees for this withdraw */
		this.$walletService.withdrawFees(this.wallet.address, this.model.destination, this.model.value).then(fees => {
			this.model.fee = fees.fastest / 100000000;
			this.model.feeprofile = 'fastest';

			currentStep.next();
			currentStep.loading = false;

			this.model.fees = {
				fastest: fees.fastest / 100000000,
				halfhour: fees.halfhour / 100000000,
				hour: fees.hour / 100000000,
				slowest: fees.slowest / 100000000
			};

			this.model.vvalue = this.model.value;
			if ((this.model.vvalue + this.model.fee) > this.balance.balance + this.balance.unconfirmed)
				this.model.vvalue = this.balance.balance + this.balance.unconfirmed - this.model.fee;
		}).catch((res) => {
			currentStep.setResponse('error', res.data);
			currentStep.loading = false;
		});
	}

	changedFeeProfile() {
		this.model.fee = this.model.fees[this.model.feeprofile];

		if (this.mtype != 'eventdonation') {
			this.model.vvalue = this.model.value;
			if ((this.model.vvalue + this.model.fee) > this.balance.balance + this.balance.unconfirmed)
				this.model.vvalue = this.balance.balance + this.balance.unconfirmed - this.model.fee;
		}
	}



	removeMultisigTransaction(txid) {
		this.$walletService.deleteMultisigTransaction(txid).then(_ => {
			this.cancel();
		});
	}


	$onInit() {
		const modalData = this.resolve.modalData;

		this.$walletService.get(modalData.address).then(wallet => {
			this.wallet = wallet;
			this.signConfig.wallet = wallet;

			this.$walletService.getBalance(modalData.address).then(balances => {
				this.balance = balances;
			});

			if ('destination' in modalData)
				this.fixedDestination = modalData.destination;

			if ('mtype' in modalData)
				this.mtype = modalData.mtype;

			if ('donation' in modalData)
				this.donation = modalData.donation;

			if ('value' in modalData)
				this.fixedValue = modalData.value;

			if ('description' in modalData)
				this.fixedDescription = modalData.description;

			if ('distribution' in modalData) {
				this.distribution = modalData.distribution;
				this.distributionn = Object.keys(this.distribution).length;
			}

			if ('event' in modalData)
				this.event = modalData.event;


			if (this.fixedDestination)
				this.model.destination = this.fixedDestination;

			if (this.fixedValue)
				this.model.value = parseFloat(this.fixedValue);

			if (this.fixedDescription)
				this.model.description = this.fixedDescription;

			this.$walletService.getTransactions(this.wallet.address).then((txs) => {
				this.wallet.txs = txs;
			});

			if (this.wallet.ismultisig) {
				this.$walletService.getMultisigTransactions().then(txs => {
					this.wallet.pendingtxs = txs;
				});
			}

			if (this.mtype == 'eventdonation') {
				this.$walletService.withdrawDistributionFees(this.wallet.address, this.distribution, this.model.value).then(fees => {
					this.model.fee = fees.fastest / 100000000;
					this.model.feeprofile = 'fastest';
					this.model.fees = {
						fastest: fees.fastest / 100000000,
						halfhour: fees.halfhour / 100000000,
						hour: fees.hour / 100000000,
						slowest: fees.slowest / 100000000
					};
				});
			}
		});
	}

	static get $inject() { return ['$walletService', '$timeout', 'config', '$notificationService', 'WizardHandler', '$translate']; }
}


const MeWalletWithdrawComponent = {
	templateUrl: 'components/dashboard/wallet/withdraw/withdraw.html',
	controller: MeWalletWithdrawCtrl,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};

export default MeWalletWithdrawComponent;