import { Wallet } from '../../../../models/wallet';
import { CreateWalletController } from '../create-wallet';

class MeWalletFeedMultisigCtrl extends CreateWalletController {
	wallet: Wallet;

	constructor($walletService, $scope, $cookies, $routeParams, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper, $dashboardService) {
		super('feedMultisig', $walletService, $scope, $cookies, $routeParams, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper, $dashboardService);

		this.pageHeader = {
			description: {
				title: $translate.getString('multisig wallet feed'),
				subTitle: $translate.getString('Insert your signature for a new multisig wallet')
			}
		};

		this.wizard.step1HardwareWallet.setNextInterceptor(() => {
			this.feed();
		});

		this.wizard.step3.setNextInterceptor(() => {
			this.feed();
		});
	}


	feed() {
		this.wizard.step3.loading = true;

		// First key, generated from mnemonic
		let key1: any = {};
		if (this.model.hardwareWallet) {
			key1 = { public: this.model.hardwareWalletPublicKey, private: '' };
		} else {
			key1 = this.$bitcoin.mnemonicToKeys(this.model.mnemonic);
		}

		// Feed the wallet
		this.$walletService.feedMultisig(this.$routeParams.wallet, key1.public, this.model.hardwareWallet, this.model.hardwareWalletType).then(wallet => {
			this.wizard.step3.resetResponse();
			this.wizard.step3.loading = false;
			this.model.downloadedBackup = false;

			if (!this.model.hardwareWallet) {
				const ee = this.$bitcoin.encryptKeys(key1.private, this.model.backupPassword);

				this.model.file = JSON.stringify({
					user: this.username,
					scripttype: this.wallet.scripttype,
					pubkeysrv: wallet.pubkeysrv,
					encprivkey: ee,
					pubkey: key1.public,
					walletid: this.$routeParams.wallet,
					label: this.model.label,
					organization: this.model.organization
				});
			}

			this.$dashboardService.emitNotificationUpdate('wallet');
			this.wizard.step3._next();
		}).catch((res) => {
			if (this.model.hardwareWallet)
				this.wizard.step1HardwareWallet.setResponse('error', res.data);
			else
				this.wizard.step3.setResponse('error', res.data);
		});
	}


	$onInit() {
		this.username = this.$cookies.get('username');
		this.model = {
			ledgerSupport: this.$browserHelper.isLedgerSupported(),
			invalid: false,
			accept: false,
			address: '',
			hardwareWallet: false,
			hardwareWalletType: 'none',
			hardwareWalletPublicKey: null,
			mnemonic: this.$bitcoin.generateMnemonic(),
			mnemonicConfirmChallenge: [],
			backupPassword: '',
			backupPasswordRepeat: '',
			scripttype: 'p2sh-p2wsh',
			downloadedBackup: false,
			file: null,
			label: this.$routeParams.label,
			labelShort: this.$routeParams.label.replace(/ /g, ''),
			organization: this.$routeParams.organization
		}

		this.$walletService.getList().then(list => {
			this.model.invalid = false;
			this.wallet = list.adminof.filter(w => w._id == this.$routeParams.wallet)[0];

			if (this.wallet == undefined) {
				this.model.invalid = true;
			} else if (this.wallet.active || this.wallet.multisig.doneadmins.indexOf(this.$cookies.get('email')) != -1) {
				this.model.invalid = true;
			}
		});

		this.$scope.$on('wizard:stepChanged', (event, args) => {
			if (args.index == 0)
				this.hideIndicators = true;
			else
				this.hideIndicators = false;
		});
	}
}

const MeWalletFeedMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/feedmultisig/feedmultisig.html',
	controller: MeWalletFeedMultisigCtrl
};

export default MeWalletFeedMultisigComponent;