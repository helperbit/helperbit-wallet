import { CreateWallet } from '../create-wallet';
import BitcoinService, { BitcoinKeys } from '../../bitcoin.service/mnemonic';
import { encryptKeys, BackupFile } from '../../bitcoin.service/bitcoin-service';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import DashboardService from 'app/models/dashboard';
import BrowserHelperService from 'app/services/browser-helper';
import { TranslateService } from '@ngx-translate/core';
import BitcoinLedgerService from '../../bitcoin.service/ledger';
import WalletService from 'app/models/wallet';
import { CookieService } from "ngx-cookie-service";
import { WizardComponent } from 'angular-archwizard';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'me-wallet-new-component',
	templateUrl: 'new.html',
	styleUrls: ['new.scss']
})
export default class MeWalletNewComponent extends CreateWallet implements OnInit, AfterViewInit {
	@ViewChild(WizardComponent, { static: false }) public wizardHandler: WizardComponent;

	constructor(
		private sanitizer: DomSanitizer,
		protected walletService: WalletService,
		protected cookieService: CookieService,
		protected route: ActivatedRoute,
		protected bitcoinService: BitcoinService,
		protected bitcoinLedgerService: BitcoinLedgerService,
		protected translate: TranslateService,
		protected browserHelperService: BrowserHelperService,
		protected dashboardService: DashboardService
	) {
		super(walletService, cookieService, route, bitcoinService, bitcoinLedgerService, translate, browserHelperService, dashboardService);

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
			key1 = this.bitcoinService.mnemonicToKeys(this.model.mnemonic);
		}

		// Second key, randomly created
		const key2: BitcoinKeys = this.bitcoinService.randomKeys();

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
		this.username = this.cookieService.get('username');
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