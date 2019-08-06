import * as angular from 'angular';
import * as $ from 'jquery';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import { ICookiesService } from '../../../../shared/types/angular-cookies';
import RorService, { Ror } from '../../../../models/ror';
import NotificationService from '../../../../models/notifications';
import WalletService from '../../../../models/wallet';
import { SignConfig } from '../sign/sign';

/* User profile /me/wallet */
class MeWalletSignMultisigCtrl {
	$walletService: WalletService;
	$rorService: RorService;
	$timeout: angular.ITimeoutService;
	$cookies: ICookiesService;
	$notificationService: NotificationService;

	username: string;
	email: string;
	signConfig: SignConfig;
	model: {
		transactions: any[];
		selected: any;
		rors: { [id: string]: Ror };
		refused: boolean;
	};

	wizard: {
		step1: WizardStep<void>;
		step2: WizardStep<void>;
		step3: WizardStep<void>;
	};

	constructor($notificationService, $rorService, $walletService, $translate, WizardHandler, $cookies, $timeout) {
		this.$walletService = $walletService;
		this.$timeout = $timeout;
		this.$rorService = $rorService;
		this.$cookies = $cookies;
		this.$notificationService = $notificationService;

		this.wizard = { step1: null, step2: null, step3: null };

		this.signConfig = {
			transaction: null
		};

		this.model = {
			transactions: [],
			selected: null,
			rors: {},
			refused: false
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

		this.wizard.step2.resetResponse();
		this.wizard.step2.loading = true;

		/* Request the updated tx */
		this.$walletService.getMultisigTransactions().then(txs => {
			for (let i = 0; i < txs.length; i++) {
				if (txs[i].txid == this.model.selected.txid)
					this.model.selected = txs[i];
			}

			/* Put the signature */
			this.signConfig.sign(this.model.selected.hex, this.model.selected.utxos).then(txhex => sendSignedTransaction(txhex)).catch(err => {
				return this.$timeout(() => {
					this.wizard.step2.setResponse('error', { error: err });
					this.wizard.step2.loading = false;
				});
			});
		});
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
		this.model.refused = false;
		this.signConfig.transaction = this.model.selected;

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
				if (!tx.ror)
					return;

				this.$rorService.get(tx.ror, true).then((ror: Ror) => {
					this.model.rors[ror._id] = ror;
				});
			});

			if (this.model.transactions.length > 0)
				this.openModal();
		});
	}

	static get $inject() { return ['$notificationService', '$rorService', '$walletService', '$translate', 'WizardHandler', '$cookies', '$timeout']; }
}

const MeWalletSignMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/signmultisig/signmultisig.html',
	controller: MeWalletSignMultisigCtrl
};

export default MeWalletSignMultisigComponent;