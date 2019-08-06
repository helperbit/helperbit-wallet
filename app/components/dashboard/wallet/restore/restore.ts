import * as angular from 'angular';
import { PageHeaderConfig } from '../../../../shared/components/page-header/page-header';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import WalletService, { Wallet } from '../../../../models/wallet';
import BitcoinService, { BitcoinKeys } from '../../../../services/bitcoin/mnemonic';
import { SignConfig } from '../sign/sign';

class MeWalletRestoreCtrl {
	$timeout: angular.ITimeoutService;
	$routeParams: { address: string };
	$location: angular.ILocationService;
	$walletService: WalletService;
	$bitcoin: BitcoinService;

	wallet: Wallet;
	txid: string;
	pageHeader: PageHeaderConfig;
	signConfig: SignConfig;
	wizard: {
		step1: WizardStep<{
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
		this.$bitcoin = $bitcoin;

		this.pageHeader = {
			description: {
				title: $translate.getString('wallet restore'),
				subTitle: $translate.getString('Restore a wallet from backup file')
			}
		};

		this.signConfig = {
			wallet: null,
			forceBackup: true
		};

		this.wizard = { step1: null, step2: null };

		this.wizard.step1 = new WizardStep('restoreWallet', WizardHandler);
		this.wizard.step1.initializeModel({
			destination: '',
			balance: 0.0
		});
		this.wizard.step1.setTitles({
			main: $translate.getString('restore'),
			heading: $translate.getString('Restore your funds')
		});

		this.wizard.step1.setSubmitHandler((model) => {
			this.wizard.step1.loading = false;
			this.wizard.step1.resetResponse();

			if (model.balance === 0.0)
				return this.wizard.step1.setResponse('error', { error: 'XEW' });

			const wreq = {
				fee: $bitcoin.evaluteFee(2, 1, true),
				value: model.balance,
				destination: model.destination
			};

			wreq.value = wreq.value - wreq.fee - 0.00000001;

			/* Send the refund transaction */
			this.$walletService.withdraw(this.wallet.address, wreq).then(data => {
				this.wizard.step1.loading = true;
				this.signConfig.sign(data.txhex, data.utxos).then(txhex => {
					this.$walletService.sendTransaction(this.wallet.address, txhex).then(txid => {
						this.txid = txid;

						/* Delete the empty wallet */
						/*$http.post (config.apiUrl + '/wallet/' + this.wizard.step1.model.wallet.address + '/update', {delete: true}).success ((data) => {
							this.wizard.step1.model.loading = false;
							$scope.reloadWallet ();
						}).catch ((data)=>{
							this.wizard.step1.model.error.error = data.error;
							this.wizard.step1.loading = false;
						});
						*/
						this.wizard.step1.loading = false;
						this.wizard.step1.next();
					})
				}).catch(err => {
					this.wizard.step1.loading = false;
					this.wizard.step1.setResponse('error', { error: err });
				});
			}).catch(res => this.wizard.step1.setResponse('error', res.data));
		});

		this.wizard.step2 = new WizardStep('restoreWallet', WizardHandler);
		this.wizard.step2.setTitles({
			main: $translate.getString('Done'),
			heading: $translate.getString('Done')
		});
	}

	$onInit() {
		this.$walletService.get(this.$routeParams.address).then(wallet => {
			this.wallet = wallet;
			this.signConfig.wallet = wallet;

			this.$walletService.getBalance(this.wallet.address).then(data => {
				this.wizard.step1.model.balance = data.balance + data.unconfirmed;
			});
		}).catch(_ => this.$location.path('/me/wallet'));
	}

	static get $inject() { return ['$walletService', '$location', '$bitcoin', '$translate', 'WizardHandler', '$routeParams', '$timeout']; }
}

const MeWalletRestoreComponent = {
	templateUrl: 'components/dashboard/wallet/restore/restore.html',
	controller: MeWalletRestoreCtrl
};

export default MeWalletRestoreComponent;