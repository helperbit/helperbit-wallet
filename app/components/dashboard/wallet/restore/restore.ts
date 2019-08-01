import * as angular from 'angular';
import { PageHeaderConfig } from '../../../../shared/components/page-header/page-header';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import WalletService, { Wallet } from '../../../../models/wallet';
import BitcoinService from '../../../../services/bitcoin/mnemonic';

class MeWalletRestoreCtrl {
	$timeout: angular.ITimeoutService;
	$routeParams: { address: string };
	$location: angular.ILocationService;
	$walletService: WalletService;

	wallet: Wallet;
	txid: string;
	pageHeader: PageHeaderConfig;
	wizard: {
		step1: WizardStep<{
			file: File;
			data: any;
			password: string;
			balance: number;
			destination: string;
		}>;
		step2: WizardStep<void>;
	};

	constructor($walletService, $location, $bitcoin: BitcoinService, $translate, WizardHandler, $routeParams, $timeout) {
		this.$walletService = $walletService;
		this.$timeout = $timeout;
		this.$location = $location;
		this.$routeParams = $routeParams;

		this.pageHeader = {
			description: {
				title: $translate.getString('wallet restore'),
				subTitle: $translate.getString('Restore a wallet from backup file')
			}
		};

		this.wizard = { step1: null, step2: null };

		this.wizard.step1 = new WizardStep('restoreWallet', WizardHandler);
		this.wizard.step1.initializeModel({
			file: null,
			data: null,
			password: '',
			destination: '',
			balance: 0.0
		});
		this.wizard.step1.setTitles({
			main: $translate.getString('restore'),
			heading: $translate.getString('Restore your funds')
		});

		this.wizard.step1.setSubmitHandler((model) => {
			this.wizard.step1.resetResponse();

			/* Errors */
			if (model.balance === 0.0)
				this.wizard.step1.setResponse('error', { error: 'XEW' });

			if (model.file === null)
				this.wizard.step1.setResponse('error', { error: 'XNF' });

			if (this.wizard.step1.model.data === null)
				this.wizard.step1.setResponse('error', { error: 'XNJ' });

			if (!('encprivkey' in model.data) ||
				!('address' in model.data) ||
				!('pubkey' in model.data))
				this.wizard.step1.setResponse('error', { error: 'XNJ' });

			if (this.wallet.address != model.data.address)
				this.wizard.step1.setResponse('error', { error: 'XWA' });

			/* Decrypt the key */
			const keys = $bitcoin.decryptKeys(model.data.encprivkey, model.password);
			if (keys == null)
				this.wizard.step1.setResponse('error', { error: 'XWP' });

			if (keys.public != model.data.pubkey)
				this.wizard.step1.setResponse('error', { error: 'XWP' });

			this.wizard.step1.loading = true;

			const wreq = {
				fee: $bitcoin.evaluteFee(2, 1, true),
				value: model.balance,
				destination: model.destination
			};

			wreq.value = wreq.value - wreq.fee - 0.00000001;

			/* Send the refund transaction */
			this.$walletService.withdraw(this.wallet.address, wreq).then(data => {
				$bitcoin.sign(data.txhex, {
					scripttype: this.wallet.scripttype,
					wif: keys.private,
					utxos: data.utxos,
					pubkeys: this.wallet.pubkeys
				}).then(txhex => {
					this.$walletService.sendTransaction(this.wallet.address, txhex).then(txid => {
						this.txid = txid;

						/* Delete the empty wallet */
						/*$http.post (config.apiUrl + '/wallet/' + this.wizard.step1.model.wallet.address + '/update', {delete: true}).success ((data) => {
							this.wizard.step1.model.loading = false;
							$scope.reloadWallet ();
						}).error ((data)=>{
							this.wizard.step1.model.error.error = data.error;
							this.wizard.step1.loading = false;
						});
						*/
						this.wizard.step1.loading = false;
						this.wizard.step1.next();
					});
				}).catch(err => {
					this.wizard.step1.setResponse('error', { error: 'E' });
					this.wizard.step1.loading = false;
				});
			}).catch((res) => {
				this.wizard.step1.setResponse('error', res.data);
				this.wizard.step1.loading = false;
			});
		});

		this.wizard.step2 = new WizardStep('restoreWallet', WizardHandler);
		this.wizard.step2.setTitles({
			main: $translate.getString('Done'),
			heading: $translate.getString('Done')
		});
	}


	loadBackupFile(file) {
		this.$timeout(() => { this.wizard.step1.resetResponse(); });
		this.wizard.step1.model.file = file;

		if (file === null) {
			this.wizard.step1.model.data = null;
			return;
		}

		const reader = new FileReader();

		reader.onload = (event: any) => {
			const data = event.target.result;
			try {
				this.wizard.step1.model.data = JSON.parse(data);
			} catch (err) {
				return this.$timeout(() => { this.wizard.step1.setResponse('error', { error: 'XNJ' }); });
			}
		};
		reader.readAsText(file);
	}


	$onInit() {
		this.$walletService.get(this.$routeParams.address).then(wallet => {
			this.wallet = wallet;
			this.$walletService.getBalance(this.wallet.address).then(data => {
				this.wizard.step1.model.balance = data.balance + data.unconfirmed;
			});
		}).catch(err => {
			return this.$location.path('/me/wallet');
		});
	}

	static get $inject() { return ['$walletService', '$location', '$bitcoin', '$translate', 'WizardHandler', '$routeParams', '$timeout']; }
}

const MeWalletRestoreComponent = {
	templateUrl: 'components/dashboard/wallet/restore/restore.html',
	controller: MeWalletRestoreCtrl
};

export default MeWalletRestoreComponent;