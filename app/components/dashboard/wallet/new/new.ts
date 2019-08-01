import { CreateWalletController } from '../create-wallet';

class MeWalletNewCtrl extends CreateWalletController {
	constructor($walletService, $scope, $cookies, $routeParams, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper, $dashboardService) {
		super('newWallet', $walletService, $scope, $cookies, $routeParams, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper, $dashboardService);

		this.pageHeader = {
			description: {
				title: $translate.getString('wallet creation'),
				subTitle: $translate.getString('Create a new wallet to send and receive Bitcoin')
			}
		};
	}

	createWallet() {
		this.wizard.step3.loading = true;

		// First key, generated from mnemonic
		let key1: any = {};
		if (this.model.hardwareWallet) {
			key1 = { public: this.model.hardwareWalletPublicKey };
		} else {
			key1 = this.$bitcoin.mnemonicToKeys(this.model.mnemonic);
		}

		// Second key, randomly created
		const key2 = this.$bitcoin.randomKeys();

		// Create the wallet		
		this.$walletService.create(this.model.scripttype, [key1.public, key2.public], this.model.hardwareWallet, this.model.hardwareWalletType).then(wallet => {
			// Give the encrypted key as backup file
			const ee = this.$bitcoin.encryptKeys(key2.private, this.model.backupPassword);
			this.model.address = wallet.address;
			this.model.file = JSON.stringify({
				user: this.username,
				scripttype: this.model.scripttype,
				encprivkey: ee,
				address: wallet.address,
				pubkey: key2.public,
				pubkeys: [key1.public, key2.public, wallet.pubkeysrv]
			});
			this.wizard.step3.loading = false;
			this.model.downloadedBackup = false;

			this.$dashboardService.emitNotificationUpdate('wallet');
			this.wizard.step3.next();
		}).catch((res) => {
			this.wizard.step3.setResponse('error', res.data);
			this.wizard.step3.loading = false;
		});
	}

	$onInit() {
		this.username = this.$cookies.get('username');

		this.$scope.$on('wizard:stepChanged', (event, args) => {
			if (args.index == 0)
				this.hideIndicators = true;
			else
				this.hideIndicators = false;
		});
	}
}

const MeWalletNewComponent = {
	templateUrl: 'components/dashboard/wallet/new/new.html',
	controller: MeWalletNewCtrl
};

export default MeWalletNewComponent;