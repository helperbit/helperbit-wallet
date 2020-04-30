import { CreateWallet } from '../create-wallet';
import { BitcoinService, mnemonicToKeys } from '../bitcoin.service/mnemonic';
import { encryptKeys, BackupFile, randomKeys, BitcoinKeys } from '../bitcoin.service/bitcoin-helper';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DashboardService } from 'app/models/dashboard';
import { BrowserHelperService } from 'app/services/browser-helper';
import { TranslateService } from '@ngx-translate/core';
import { BitcoinLedgerService } from '../bitcoin.service/ledger';
import { WalletService } from 'app/models/wallet';
import { WizardComponent } from 'angular-archwizard';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { getLocalStorage } from 'app/shared/helpers/utils';

@Component({
	selector: 'me-wallet-new-component',
	templateUrl: 'new.html',
	styleUrls: ['../../../sass/main/custom/page.scss', 'new.scss']
})
export class MeWalletNewComponent extends CreateWallet implements OnInit, AfterViewInit {
	@ViewChild(WizardComponent) public wizardHandler: WizardComponent;

	constructor(
		private sanitizer: DomSanitizer,
		protected walletService: WalletService,
		protected route: ActivatedRoute,
		protected bitcoinService: BitcoinService,
		protected bitcoinLedgerService: BitcoinLedgerService,
		protected translate: TranslateService,
		protected browserHelperService: BrowserHelperService,
		protected dashboardService: DashboardService
	) {
		super(walletService, route, bitcoinService, bitcoinLedgerService, translate, browserHelperService, dashboardService);

		this.pageHeader = {
			description: {
				title: translate.instant('wallet creation'),
				subTitle: translate.instant('Create a new wallet to send and receive Bitcoin')
			}
		};
	}

	sanitize(url: string) {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	createWallet() {
		this.wizard.step3.loading = true;

		// First key, generated from mnemonic
		let key1: BitcoinKeys;
		if (this.model.hardwareWallet) {
			key1 = { public: this.model.hardwareWalletPublicKey, private: null, pair: null };
		} else {
			key1 = mnemonicToKeys(this.model.mnemonic);
		}

		// Second key, randomly created
		const key2: BitcoinKeys = randomKeys();

		// Create the wallet		
		this.walletService.create(this.model.scripttype, [key1.public, key2.public], this.model.hardwareWallet, this.model.hardwareWalletType).subscribe(wallet => {
			const ee = encryptKeys(key2.private, this.model.backupPassword);
			const backup: BackupFile = {
				user: this.username,
				scripttype: this.model.scripttype,
				encprivkey: ee,
				address: wallet.address,
				pubkey: key2.public,
				pubkeys: [key1.public, key2.public, wallet.pubkeysrv]
			};

			this.model.address = wallet.address;
			this.model.file = JSON.stringify(backup);
			this.wizard.step3.loading = false;
			this.model.downloadedBackup = false;

			this.dashboardService.emitNotificationUpdate('wallet');
			this.wizard.step3.next();
		}, (res) => {
			this.wizard.step3.setResponse('error', res.error);
			this.wizard.step3.loading = false;
		});
	}

	ngOnInit() {
		this.username = getLocalStorage().getItem('username');
	}

	ngAfterViewInit() {
		this.wizard.step0.setHandler(this.wizardHandler);
		this.wizard.step1HardwareWallet.setHandler(this.wizardHandler);
		this.wizard.step1Passphrase.setHandler(this.wizardHandler);
		this.wizard.step2Passphrase.setHandler(this.wizardHandler);
		this.wizard.step3.setHandler(this.wizardHandler);
		this.wizard.step4.setHandler(this.wizardHandler);
		this.wizardHandler.disableNavigationBar = true;
	}
}