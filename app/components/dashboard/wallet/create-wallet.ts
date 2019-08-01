import * as angular from 'angular';
import WalletService from "../../../models/wallet";
import TranslateService from "../../../services/translate";
import BitcoinLedgerService from "../../../services/bitcoin/ledger";
import BitcoinService, { createMnemonicChallenge, checkMnemonicChallenge } from "../../../services/bitcoin/mnemonic";
import { ICookiesService } from "../../../shared/types/angular-cookies";
import { PageHeaderConfig } from "../../../shared/components/page-header/page-header";
import { BitcoinScriptType } from "../../../services/bitcoin/bitcoin-service";
import { WizardStep } from "../../../shared/helpers/wizard-step";
import { LedgerWaitConfig } from "../ledger-wait/ledger-wait";
import BrowserHelperService from '../../../services/browser-helper';
import DashboardService from '../../../models/dashboard';

export class CreateWalletController {
	$scope: any;
	$browserHelper: BrowserHelperService;
	$routeParams: any;
	$walletService: WalletService;
	$translate: TranslateService;
	$bitcoinLedger: BitcoinLedgerService;
	$window: angular.IWindowService;
	$bitcoin: BitcoinService;
	$timeout: angular.ITimeoutService;
	$dashboardService: DashboardService;
	$cookies: ICookiesService;

	hideIndicators: boolean;
	pageHeader: PageHeaderConfig;
	username: string;
	rnd: string;

	model: {
		ledgerSupport: boolean;
		accept: boolean;
		hardwareWallet: boolean;
		hardwareWalletType: string;
		hardwareWalletPublicKey: string;
		mnemonic: string;
		mnemonicConfirmChallenge: any[];
		backupPassword: string;
		backupPasswordRepeat: string;
		scripttype: BitcoinScriptType;
		downloadedBackup: boolean;
		file?: any;
		address: string;

		invalid: boolean;
		label?: string;
		organization?: string;
		labelShort?: string;
	};

	wizard: {
		step0: WizardStep<void>;
		step1Passphrase: WizardStep<void>;
		step1HardwareWallet: WizardStep<{ ledgerWaitStatus: LedgerWaitConfig; exec: () => void }>;
		step2: WizardStep<void>;
		step2Passphrase: WizardStep<void>;
		step3: WizardStep<{ passwordVisibility: string }>;
		step4: WizardStep<void>;
	};

	constructor(wizardName, $walletService, $scope, $cookies, $routeParams, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper, $dashboardService) {
		this.$walletService = $walletService;
		this.$browserHelper = $browserHelper;
		this.$routeParams = $routeParams;
		this.$translate = $translate;
		this.$bitcoinLedger = $bitcoinLedger;
		this.$bitcoin = $bitcoin;
		this.$timeout = $timeout;
		this.$scope = $scope;
		this.$window = $window;
		this.$dashboardService = $dashboardService;
		this.$cookies = $cookies;

		this.rnd = 'rnd' + Math.random() + '_';

		this.hideIndicators = false;

		this.model = {
			invalid: false,
			ledgerSupport: $browserHelper.isLedgerSupported(),
			accept: false,
			hardwareWallet: false,
			hardwareWalletType: 'none',
			hardwareWalletPublicKey: null,
			mnemonic: $bitcoin.generateMnemonic(),
			mnemonicConfirmChallenge: [],
			backupPassword: '',
			backupPasswordRepeat: '',
			scripttype: 'p2sh-p2wsh',
			downloadedBackup: false,
			file: null,
			address: ''
		};

		this.wizard = { step0: null, step1Passphrase: null, step1HardwareWallet: null, step2: null, step2Passphrase: null, step3: null, step4: null };

		this.wizard.step0 = new WizardStep(wizardName, WizardHandler);
		this.wizard.step0.setTitles({
			main: $translate.getString('Type'),
			heading: $translate.getString('Choose wallet type')
		});


		this.wizard.step1Passphrase = new WizardStep(wizardName, WizardHandler);
		this.wizard.step1Passphrase.setTitles({
			main: $translate.getString('Passphrase'),
			heading: $translate.getString('Generate a random passphrase')
		});
		this.wizard.step1Passphrase.setNextInterceptor(() => {
			this.wizard.step2Passphrase.resetResponse();
			this.model.mnemonicConfirmChallenge = createMnemonicChallenge(this.model.mnemonic);
			this.wizard.step1Passphrase._next();
		});


		this.wizard.step1HardwareWallet = new WizardStep(wizardName, WizardHandler);
		this.wizard.step1HardwareWallet.setTitles({
			main: $translate.getString('Hardware Wallet'),
			heading: $translate.getString('Pair your hardware wallet')
		});
		this.wizard.step1HardwareWallet.initializeModel({
			ledgerWaitStatus: {
				phase: 0,
				status: 'wait',
				exec: () => { }
			},
			exec: () => { this.pairHardwareWallet(); }
		});
		this.wizard.step1HardwareWallet.setNextInterceptor(() => {
			this.wizard.step1HardwareWallet._next();
			this.wizard.step1HardwareWallet._next();
		});


		this.wizard.step2Passphrase = new WizardStep(wizardName, WizardHandler);
		this.wizard.step2Passphrase.setTitles({
			main: $translate.getString('Confirm'),
			heading: $translate.getString('Prove you have written down your passphrase')
		});
		this.wizard.step2Passphrase.setNextInterceptor(() => {
			this.wizard.step2Passphrase.resetResponse();

			if (!checkMnemonicChallenge(this.model.mnemonicConfirmChallenge))
				return $timeout(() => {
					this.wizard.step2Passphrase.setResponse('error', { error: 'XM1' });
				});

			this.wizard.step2Passphrase._next();
		});


		this.wizard.step3 = new WizardStep(wizardName, WizardHandler);
		this.wizard.step3.setTitles({
			main: $translate.getString('Backup'),
			heading: $translate.getString('Create a signature backup file')
		});
		this.wizard.step3.initializeModel({
			passwordVisibility: 'password'
		});


		this.wizard.step4 = new WizardStep(wizardName, WizardHandler);
		this.wizard.step4.setTitles({
			main: $translate.getString('Done'),
			heading: $translate.getString('Done')
		});
	}

	pairHardwareWallet() {
		const ledgerWaitCallback = (phase, status) => {
			this.$timeout(() => {
				this.wizard.step1HardwareWallet.model.ledgerWaitStatus = {
					...this.wizard.step1HardwareWallet.model.ledgerWaitStatus, ...{
						phase: phase,
						status: status
					}
				};
			});
		};

		this.wizard.step1HardwareWallet.loading = true;

		this.$bitcoinLedger.getPublicKey(ledgerWaitCallback).then(pk => {
			return this.$timeout(() => {
				this.wizard.step1HardwareWallet.loading = false;
				this.model.hardwareWalletPublicKey = pk;
				this.model.accept = true;
				this.wizard.step1HardwareWallet.setResponse('success', {
					text: this.$translate.getString('Hardware Wallet successfully paired')
				});
			});
		}).catch((err) => {
			return this.$timeout(() => {
				this.model.hardwareWalletPublicKey = null;
				this.wizard.step1HardwareWallet.loading = false;
				// this.wizard.step1HardwareWallet.setResponse ('error', { error: 'XHW1' });
			});
		});
	}

	downloadBackup() {
		this.model.downloadedBackup = true;
	}

	renewMnemonic() {
		this.model.mnemonic = this.$bitcoin.generateMnemonic();
	}

	printMnemonic() {
		const oldtitle = document.title;
		document.title = 'helperbit_passphrase_' + this.username + '.pdf';
		this.$window.print();
		document.title = oldtitle;
	}


	selectWalletType(wt: 'ledger' | 'mnemonic') {
		if (wt == 'ledger') {
			this.model.hardwareWallet = true;
			this.model.hardwareWalletType = 'ledgernanos';
		} else if (wt == 'mnemonic') {
			this.model.hardwareWallet = false;
			this.model.hardwareWalletType = 'none';
		}

		this.model.accept = false;

		this.wizard.step0.reset();
		this.$timeout(() => { this.wizard.step0.next(); });
	}

	static get $inject() { return ['$walletService', '$scope', '$cookies', '$routeParams', '$bitcoin', '$bitcoinLedger', '$window', '$translate', 'WizardHandler', '$timeout', '$browserHelper', '$dashboardService']; }
}
