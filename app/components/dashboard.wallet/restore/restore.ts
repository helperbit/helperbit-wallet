import { PageHeaderConfig } from '../../../shared/components/page-header/page-header';
import { WalletService, Wallet } from '../../../models/wallet';
import { BitcoinService } from '../bitcoin.service/mnemonic';
import { WalletSignComponent, SignConfig } from '../sign/sign';
import { TranslateService } from '@ngx-translate/core';
import { Component, ViewChild, OnInit } from '@angular/core';
import { ResponseMessageConfig, buildErrorResponseMessage } from 'app/shared/components/response-messages/response-messages';
import { WizardComponent } from 'angular-archwizard';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'me-wallet-restore-component',
	templateUrl: 'restore.html',
})
export class MeWalletRestoreComponent implements OnInit {
	@ViewChild(WizardComponent, { static: false }) public wizardHandler: WizardComponent;
	@ViewChild(WalletSignComponent, { static: false }) public signComponent: WalletSignComponent;

	wallet: Wallet;
	txid: string;
	pageHeader: PageHeaderConfig;
	signConfig: SignConfig;
	responseMessage: ResponseMessageConfig;
	model: {
		balance: number;
		destination: string;
	};
	loading: boolean;

	constructor(
		private walletService: WalletService,
		private router: Router,
		private bitcoinService: BitcoinService,
		translate: TranslateService,
		private route: ActivatedRoute
	) {
		this.pageHeader = {
			description: {
				title: translate.instant('wallet restore'),
				subTitle: translate.instant('Restore a wallet from backup file')
			}
		};

		this.responseMessage = {};

		this.loading = false;

		this.signConfig = {
			type: 'single',
			wallet: null,
			forceBackup: true
		};

		this.model = {
			destination: '',
			balance: 0.0
		};
	}

	submit() {
		this.loading = false;
		this.responseMessage = {};

		if (this.model.balance === 0.0)
			return this.responseMessage = buildErrorResponseMessage({ error: 'XEW' });

		const wreq = {
			fee: this.bitcoinService.evaluteFee(2, 1, true),
			value: this.model.balance,
			destination: this.model.destination
		};

		wreq.value = wreq.value - wreq.fee - 0.00000001;

		/* Send the refund transaction */
		this.walletService.withdraw(this.wallet.address, wreq).subscribe(data => {
			this.loading = true;
			this.signComponent.sign(data.txhex, data.utxos).then(txhex => {
				this.walletService.sendTransaction(this.wallet.address, txhex).subscribe(txid => {
					this.txid = txid;

					/* Delete the empty wallet */
					/*this.http.post (config.apiUrl + '/wallet/' + this.wizard.step1.model.wallet.address + '/update', {delete: true}).success ((data) => {
						this.wizard.step1.model.loading = false;
						$scope.reloadWallet ();
					}, (data)=>{
						this.wizard.step1.model.error.error = data.error;
						this.wizard.step1.loading = false;
					});
					*/
					this.loading = false;
					this.wizardHandler.goToNextStep();
				})
			}).catch(err => {
				this.loading = false;
				this.responseMessage = buildErrorResponseMessage({ error: err });
			});
		}, res => {
			this.responseMessage = buildErrorResponseMessage(res.error);
		})
	}

	ngOnInit() {
		this.walletService.get(this.route.snapshot.paramMap.get('address')).subscribe(wallet => {
			wallet.hardware = 'none';
			this.wallet = wallet;
			this.signConfig = { ...this.signConfig, ...{ wallet: wallet } };

			this.walletService.getBalance(this.wallet.address).subscribe(data => {
				this.model.balance = data.balance + data.unconfirmed;
			});
		}, _ => this.router.navigateByUrl('/me/wallet'));
	}
}