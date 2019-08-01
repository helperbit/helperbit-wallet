import * as angular from 'angular';
import BitcoinService from '../../../../services/bitcoin/mnemonic';
import BitcoinLedgerService from '../../../../services/bitcoin/ledger';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import { LedgerWaitConfig } from '../../ledger-wait/ledger-wait';
import WalletService, { Wallet, WalletTransaction, Transaction } from '../../../../models/wallet';
import NotificationService from '../../../../models/notifications';

class MeWalletWithdrawCtrl {
	$bitcoin: BitcoinService;
	$bitcoinLedger: BitcoinLedgerService;
	$walletService: WalletService;
	$timeout: angular.ITimeoutService;

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
		step1: WizardStep<{
			mnemonic: string;
			hardware: boolean;
			hardwareType: string;
		}>;
		step2: WizardStep<{
			ledgerWaitStatus: LedgerWaitConfig;
			exec: () => void;
		}>;
		step3: WizardStep<void>;
	};

	constructor($walletService, $timeout, config, $notificationService: NotificationService, $bitcoin, $bitcoinLedger, WizardHandler, $translate) {
		this.$timeout = $timeout;
		this.$walletService = $walletService;
		this.$bitcoin = $bitcoin;
		this.$bitcoinLedger = $bitcoinLedger;

		this.mtype = 'withdraw';
		this.model = {
			destination: '',
			fee: 0.0,
			feeprofile: 'fastest',
			value: config.minDonation,
			vvalue: 0.0,
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
		this.singleWizard.step1.initializeModel({
			mnemonic: '',
			hardware: false,
			hardwareType: 'none'
		});
		this.singleWizard.step1.setTitles({ main: $translate.getString('Send') });


		this.singleWizard.step2 = new WizardStep('withdrawSingle', WizardHandler);
		this.singleWizard.step2.setTitles({ main: $translate.getString('Summary') });
		this.singleWizard.step2.initializeModel({
			ledgerWaitStatus: {
				phase: 0,
				status: 'wait',
				button: false
			},
			exec: () => { this.singleWizard.step2.submit() }
		});
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
			
			const ledgerWaitCallback = (phase, status) => {
				$timeout(() => {
					this.singleWizard.step2.model.ledgerWaitStatus = {...this.singleWizard.step2.model.ledgerWaitStatus, ...{
						phase: phase,
						status: status
					}};
				});
			};

			this.singleWizard.step2.loading = true;

			let keys = null;

			if (!this.singleWizard.step1.model.hardware) {
				keys = $bitcoin.mnemonicToKeys(this.singleWizard.step1.model.mnemonic);

				if ($.inArray(keys.public, this.wallet.pubkeys) == -1) {
					return $timeout(() => {
						this.singleWizard.step2.setResponse('error', { error: 'XIM' });
						this.singleWizard.step2.loading = false;
					});
				}
			}

			const wreq = {
				fee: this.model.fee,
				value: this.model.vvalue,
				destination: this.model.destination
			};

			this.$walletService.withdraw(this.wallet.address, wreq).then(data=> {
				if (this.singleWizard.step1.model.hardware && this.singleWizard.step1.model.hardwareType == 'ledgernanos') {
					$bitcoinLedger.sign(data.txhex, {
						scripttype: this.wallet.scripttype,
						utxos: data.utxos,
						pubkeys: this.wallet.pubkeys
					}, ledgerWaitCallback).then(txhex => {
						sendTransaction(txhex);
					}).catch(err => {
						// eslint-disable-next-line no-console
						console.log(err);
						return $timeout(() => {
							// this.singleWizard.step2.error.error = 'E';
							this.singleWizard.step2.loading = false;
						});
					});
				} else if (!this.singleWizard.step1.model.hardware) {
					$bitcoin.sign(data.txhex, {
						scripttype: this.wallet.scripttype,
						seed: this.singleWizard.step1.model.mnemonic,
						utxos: data.utxos,
						pubkeys: this.wallet.pubkeys
					}).then(txhex => { 
						sendTransaction(txhex);
					}).catch(err => {
						// eslint-disable-next-line no-console
						console.log(err);
						return $timeout(() => {
							this.singleWizard.step2.setResponse('error', { error: 'E' });
							this.singleWizard.step2.loading = false;
						});
					});
				}
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

		const keys = this.$bitcoin.mnemonicToKeys(this.singleWizard.step1.model.mnemonic);

		if ($.inArray(keys.public, this.wallet.pubkeys) == -1) {
			return this.$timeout(() => {
				this.singleWizard.step1.setResponse('error', { error: 'XIM' });
				this.singleWizard.step1.loading = false;
			});
		}

		this.singleWizard.step1.loading = true;
		this.model.value = parseFloat('' + this.model.value);

		const donreq = {
			address: this.wallet.address,
			value: this.model.value,
			users: this.distribution,
			fee: this.model.fee
		};

		this.$walletService.createEventDonation(this.event, donreq).then(data => {
			if (this.singleWizard.step1.model.hardware) {
				this.$bitcoinLedger.sign(data.txhex, {
					scripttype: this.wallet.scripttype,
					seed: this.singleWizard.step1.model.mnemonic,
					utxos: data.utxos,
					pubkeys: this.wallet.pubkeys
				}, () => { }).then(txhex => {
					sendDonation(txhex, data.donation);
				}).catch(err => {
					// eslint-disable-next-line no-console
					console.log(err);
				});
			} else {
				this.$bitcoin.sign(data.txhex, {
					scripttype: this.wallet.scripttype,
					seed: this.singleWizard.step1.model.mnemonic,
					utxos: data.utxos,
					pubkeys: this.wallet.pubkeys
				}).then(txhex => {
					sendDonation(txhex, data.donation);
				}).catch(err => {
					// eslint-disable-next-line no-console
					console.log(err);
				});
			}
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


		if (!this.$bitcoin.checkAddress(this.model.destination)) {
			return this.$timeout(() => {
				currentStep.setResponse('error', { error: 'EW2' });
				this.multisigWizard.step1.setResponse('error', { error: 'EW2' });
			});
		}

		currentStep.loading = true;
		currentStep.resetResponse();

		this.model.value = parseFloat('' + this.model.value);

		/* Check the mnemonic (for single/company wallets) */
		if (!this.wallet.ismultisig && !this.wallet.hardware) {
			const keys = this.$bitcoin.mnemonicToKeys(this.singleWizard.step1.model.mnemonic);

			if ($.inArray(keys.public, this.wallet.pubkeys) == -1) {
				return this.$timeout(() => {
					currentStep.setResponse('error', { error: 'XIM' });
				});
			}
		}

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

			this.$walletService.getBalance(modalData.address).then(balances => {
				this.balance = balances;
			});
			this.singleWizard.step1.model.hardware = ['ledgernanos'].indexOf(this.wallet.hardware || 'none') != -1;
			this.singleWizard.step1.model.hardwareType = this.wallet.hardware;

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

	static get $inject() { return ['$walletService', '$timeout', 'config', '$notificationService', '$bitcoin', '$bitcoinLedger', 'WizardHandler', '$translate']; }
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