import { WalletService, Wallet, WalletTransaction, Transaction } from '../../../models/wallet';
import { NotificationService } from '../../../models/notifications';
import { WalletSignComponent, SignConfig } from '../sign/sign';
import { checkBitcoinAddress } from '../bitcoin.service/bitcoin-helper';
import AppSettings from '../../../app.settings';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WizardComponent } from 'angular-archwizard';
import { NgWizardStep } from 'app/shared/helpers/ng-wizard-step';

export interface MeWalletWithdrawConfig {
	address: string;
	destination?: string;
	mtype?: 'withdraw' | 'eventdonation';
	donation?: string;
	event?: string;
	description?: string;
	value?: string;
	ror?: string;
	distribution?: any;
}

@Component({
	selector: 'me-wallet-withdraw-component',
	templateUrl: 'withdraw.html',
	styleUrls: ['withdraw.scss']
})
export class MeWalletWithdrawComponent implements OnInit {
	public wizardHandlerMulti: WizardComponent;
	public wizardHandlerSingle: WizardComponent;

	@ViewChild(WalletSignComponent) public signComponent: WalletSignComponent;
	@ViewChild('wizardMulti') set contentMulti(content: WizardComponent) {
		this.wizardHandlerMulti = content;
		this.multisigWizard.step1.setHandler(this.wizardHandlerMulti);
		this.multisigWizard.step2.setHandler(this.wizardHandlerMulti);
		this.multisigWizard.step3.setHandler(this.wizardHandlerMulti);
		this.rorTrigger();
	}

	@ViewChild('wizardSingle') set contentSingle(content: WizardComponent) {
		this.wizardHandlerSingle = content;
		this.singleWizard.step1.setHandler(this.wizardHandlerSingle);
		this.singleWizard.step2.setHandler(this.wizardHandlerSingle);
		this.singleWizard.step3.setHandler(this.wizardHandlerSingle);
		this.rorTrigger();
	}

	@Input() config: MeWalletWithdrawConfig;

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
	multisigWizard: { step1: NgWizardStep<void>; step2: NgWizardStep<void>; step3: NgWizardStep<void> };
	singleWizard: {
		step1: NgWizardStep<void>;
		step2: NgWizardStep<void>;
		step3: NgWizardStep<void>;
	};

	constructor(
		public activeModal: NgbActiveModal,
		private walletService: WalletService,
		private notificationService: NotificationService,
		translate: TranslateService
	) {
		this.mtype = 'withdraw';
		this.model = {
			destination: '',
			fee: 0.0,
			feeprofile: 'fastest',
			value: AppSettings.minDonation,
			vvalue: 0.0,
		};

		this.signConfig = {
			type: 'single',
			wallet: null
		};

		this.multisigWizard = { step1: null, step2: null, step3: null };
		this.multisigWizard.step1 = new NgWizardStep();
		this.multisigWizard.step1.setTitles({ main: translate.instant('Send') });

		this.multisigWizard.step2 = new NgWizardStep();
		this.multisigWizard.step2.setTitles({ main: translate.instant('Summary') });

		this.multisigWizard.step3 = new NgWizardStep();
		this.multisigWizard.step3.setTitles({ main: translate.instant('Done') });

		this.singleWizard = { step1: null, step2: null, step3: null };
		this.singleWizard.step1 = new NgWizardStep();
		this.singleWizard.step1.setTitles({ main: translate.instant('Send') });

		this.singleWizard.step2 = new NgWizardStep();
		this.singleWizard.step2.setTitles({ main: translate.instant('Summary') });

		this.singleWizard.step3 = new NgWizardStep();
		this.singleWizard.step3.setTitles({ main: translate.instant('Done') });
	}

	multiSubmit() {
		this.multisigWizard.step2.resetResponse();
		this.multisigWizard.step2.loading = true;

		const wreq = {
			fee: this.model.fee,
			value: this.model.vvalue,
			destination: this.model.destination,
			description: this.model.description,
		};

		// if ('ror' in this.config)
		// 	wreq['ror'] = this.config.ror;

		this.walletService.withdraw(this.wallet.address, wreq).subscribe(data => {
			this.multisigWizard.step2.loading = false;
			this.notificationService.onUpdate.emit('wallet');
			this.multisigWizard.step2.next();
		}, (res) => {
			this.multisigWizard.step2.setResponse('error', res.error);
			this.multisigWizard.step2.loading = false;
		});
	}

	singleSubmit() {
		const sendTransaction = (txhex) => {
			this.walletService.sendTransaction(this.wallet.address, txhex, this.donation).subscribe(txid => {
				this.singleWizard.step2.next();
				// return $timeout(() => {
				this.model.txid = txid;
				this.singleWizard.step2.loading = false;
				// });
			}, (res) => {
				// return $timeout(() => {
				this.singleWizard.step2.setResponse('error', res.error);
				this.singleWizard.step2.loading = false;
				// });
			});
		};

		this.singleWizard.step2.loading = true;

		const wreq = {
			fee: this.model.fee,
			value: this.model.vvalue,
			destination: this.model.destination
		};

		this.walletService.withdraw(this.wallet.address, wreq).subscribe(data => {
			this.signComponent.sign(data.txhex, data.utxos).then(txhex => {
				sendTransaction(txhex);
			}).catch(err => {
				// return $timeout(() => {
				this.singleWizard.step2.setResponse('error', { error: err });
				this.singleWizard.step2.loading = false;
				// });
			});
		}, (res) => {
			this.singleWizard.step2.setResponse('error', res.error);
			this.singleWizard.step2.loading = false;
		});
	}

	eventDonate() {
		const sendDonation = (txhex, donation) => {
			this.walletService.sendTransaction(this.wallet.address, txhex, donation).subscribe(txid => {
				this.model.txid = txid;
				this.singleWizard.step1.loading = false;
				this.singleWizard.step1.next();
			}, (res) => {
				this.singleWizard.step1.setResponse('error', res.error);
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

		this.walletService.createEventDonation(this.event, donreq).subscribe(data => {
			this.signComponent.sign(data.txhex, data.utxos).then(txhex => sendDonation(txhex, data.donation)).catch(err => {
				// eslint-disable-next-line no-console
				console.log(err);
			});
		}, (res) => {
			this.singleWizard.step1.setResponse('error', res.error);
		});
	}

	cancel() {
		this.activeModal.dismiss();
	}

	withdrawFeeDo() {
		let currentStep: NgWizardStep<any> = null;
		if (this.wallet.ismultisig)
			currentStep = this.multisigWizard.step1;
		else
			currentStep = this.singleWizard.step1;


		if (!checkBitcoinAddress(this.model.destination)) {
			// return this.$timeout(() => {
			currentStep.setResponse('error', { error: 'EW2' });
			this.multisigWizard.step1.setResponse('error', { error: 'EW2' });
			// });
		}

		currentStep.loading = true;
		currentStep.resetResponse();

		this.model.value = parseFloat('' + this.model.value);

		/* Get the fees for this withdraw */
		this.walletService.withdrawFees(this.wallet.address, this.model.destination, this.model.value).subscribe(fees => {
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
		}, (res) => {
			// this.$timeout(() => { 
			currentStep.setResponse('error', res.error);
			// });
			currentStep.loading = false;
		});
	}

	changedFeeProfile(value: string) {
		console.log(value);
		this.model.feeprofile = value;
		this.model.fee = this.model.fees[this.model.feeprofile];

		if (this.mtype != 'eventdonation') {
			this.model.vvalue = this.model.value;
			if ((this.model.vvalue + this.model.fee) > this.balance.balance + this.balance.unconfirmed)
				this.model.vvalue = this.balance.balance + this.balance.unconfirmed - this.model.fee;
		}
	}

	removeMultisigTransaction(txid) {
		this.walletService.deleteMultisigTransaction(txid).subscribe(_ => {
			this.cancel();
		});
	}

	rorTrigger() {
		const wreq = {
			fee: this.model.fee,
			value: this.model.vvalue,
			destination: this.model.destination,
			description: this.model.description,
		};

		if ('ror' in this.config) {
			wreq['ror'] = this.config.ror;

			this.walletService.withdraw(this.wallet.address, wreq).subscribe(data => {
				this.multisigWizard.step2.loading = false;
				this.notificationService.onUpdate.emit('wallet');
				this.multisigWizard.step2.next();
			}, (res) => {
				this.multisigWizard.step2.setResponse('error', res.error);
				this.multisigWizard.step2.loading = false;
			});
		}
	}

	ngOnInit() {
		this.walletService.get(this.config.address).subscribe(wallet => {
			this.wallet = wallet;
			this.signConfig = { ...this.signConfig, ...{ wallet: wallet } };

			this.walletService.getBalance(this.config.address).subscribe(balances => {
				this.balance = balances;
			});

			if ('destination' in this.config)
				this.fixedDestination = this.config.destination;

			if ('mtype' in this.config)
				this.mtype = this.config.mtype;

			if ('donation' in this.config)
				this.donation = this.config.donation;

			if ('value' in this.config)
				this.fixedValue = this.config.value;

			if ('description' in this.config)
				this.fixedDescription = this.config.description;

			if ('distribution' in this.config) {
				this.distribution = this.config.distribution;
				this.distributionn = Object.keys(this.distribution).length;
			}

			if ('event' in this.config)
				this.event = this.config.event;


			if (this.fixedDestination)
				this.model.destination = this.fixedDestination;

			if (this.fixedValue)
				this.model.value = parseFloat(this.fixedValue);

			if (this.fixedDescription)
				this.model.description = this.fixedDescription;

			this.walletService.getTransactions(this.wallet.address).subscribe((txs) => {
				this.wallet.txs = txs;
			});

			if (this.wallet.ismultisig) {
				this.walletService.getMultisigTransactions().subscribe(txs => {
					this.wallet.pendingtxs = txs;
				});
			}

			if (this.mtype == 'eventdonation') {
				this.walletService.withdrawDistributionFees(this.wallet.address, this.distribution, this.model.value).subscribe(fees => {
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
}

