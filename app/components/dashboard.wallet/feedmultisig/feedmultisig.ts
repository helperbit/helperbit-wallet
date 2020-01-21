import { Wallet } from '../../../models/wallet';
import { CreateWallet } from '../create-wallet';
import { BitcoinService, BitcoinKeys, generateMnemonicPhrase } from '../bitcoin.service/mnemonic';
import { encryptKeys, BackupFile } from '../bitcoin.service/bitcoin-service';
import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { DashboardService } from 'app/models/dashboard';
import { BrowserHelperService } from 'app/services/browser-helper';
import { TranslateService } from '@ngx-translate/core';
import { BitcoinLedgerService } from '../bitcoin.service/ledger';
import { WalletService } from 'app/models/wallet';
import { CookieService } from "ngx-cookie-service";
import { WizardComponent } from 'angular-archwizard';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';


@Component({
	selector: 'me-wallet-feed-multisig-component',
	templateUrl: 'feedmultisig.html',
	styleUrls: ['feedmultisig.scss']
})
export class MeWalletFeedMultisigComponent extends CreateWallet implements OnInit, AfterViewInit {
	@ViewChild(WizardComponent, { static: false }) public wizardHandler: WizardComponent;
	wallet: Wallet;

	constructor(
		protected route: ActivatedRoute,
		private sanitizer: DomSanitizer,
		protected walletService: WalletService,
		protected cookieService: CookieService,
		protected bitcoinService: BitcoinService,
		protected bitcoinLedgerService: BitcoinLedgerService,
		protected translate: TranslateService,
		protected browserHelperService: BrowserHelperService,
		protected dashboardService: DashboardService
	) {
		super(walletService, cookieService, route, bitcoinService, bitcoinLedgerService, translate, browserHelperService, dashboardService);

		this.pageHeader = {
			description: {
				title: translate.instant('multisig wallet feed'),
				subTitle: translate.instant('Insert your signature for a new multisig wallet')
			}
		};

		this.wizard.step1HardwareWallet.setNextInterceptor(() => this.feed());
		this.wizard.step3.setNextInterceptor(() => this.feed());
	}

	sanitize(url: string) {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	feed() {
		this.wizard.step3.loading = true;

		// First key, generated from mnemonic
		let key1: BitcoinKeys;
		if (this.model.hardwareWallet) {
			key1 = { public: this.model.hardwareWalletPublicKey, private: null, pair: null };
		} else {
			key1 = this.bitcoinService.mnemonicToKeys(this.model.mnemonic);
		}

		// Feed the wallet
		this.walletService.feedMultisig(this.route.snapshot.queryParamMap.get('wallet'), key1.public, this.model.hardwareWallet, this.model.hardwareWalletType).subscribe(wallet => {
			this.wizard.step3.resetResponse();
			this.wizard.step3.loading = false;
			this.model.downloadedBackup = false;

			if (!this.model.hardwareWallet) {
				const ee = encryptKeys(key1.private, this.model.backupPassword);
				const backup: BackupFile = {
					user: this.username,
					scripttype: this.wallet.scripttype,
					pubkeysrv: wallet.pubkeysrv,
					encprivkey: ee,
					pubkey: key1.public,
					walletid: this.route.snapshot.queryParamMap.get('wallet'),
					label: this.model.label,
					organization: this.model.organization
				};

				this.model.file = JSON.stringify(backup);
			}

			this.dashboardService.emitNotificationUpdate('wallet');
			this.wizard.step3._next();
		}, (res) =>
			(this.model.hardwareWallet ? this.wizard.step1HardwareWallet : this.wizard.step3).setResponse('error', res.error)
		);
	}

	ngOnInit() {
		this.username = this.cookieService.get('username');
		this.model = {
			ledgerSupport: this.browserHelperService.isLedgerSupported(),
			invalid: false,
			accept: false,
			address: '',
			hardwareWallet: false,
			hardwareWalletType: 'none',
			hardwareWalletPublicKey: '',
			mnemonic: generateMnemonicPhrase(),
			mnemonicConfirmChallenge: [],
			backupPassword: '',
			backupPasswordRepeat: '',
			scripttype: 'p2sh-p2wsh',
			downloadedBackup: false,
			file: null,
			label: this.route.snapshot.queryParamMap.get('label'),
			labelShort: this.route.snapshot.queryParamMap.get('label').replace(/ /g, ''),
			organization: this.route.snapshot.queryParamMap.get('organization')
		}

		this.walletService.getList().subscribe(list => {
			this.model.invalid = false;
			this.wallet = list.adminof.filter(w => w._id == this.route.snapshot.queryParamMap.get('wallet'))[0];

			if (this.wallet == undefined) {
				this.model.invalid = true;
			} else if (this.wallet.active || this.wallet.multisig.doneadmins.indexOf(this.cookieService.get('email')) != -1) {
				this.model.invalid = true;
			}
		});
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