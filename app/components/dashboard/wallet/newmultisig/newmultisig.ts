import * as $ from 'jquery';
import { PageHeaderConfig } from '../../../../shared/components/page-header/page-header';
import { WizardStep } from '../../../../shared/helpers/wizard-step';
import { BitcoinScriptType } from '../../../../services/bitcoin/bitcoin-service';
import DashboardService from '../../../../models/dashboard';
import WalletService from '../../../../models/wallet';
import UtilsService from 'app/services/utils';

class MeWalletNewMultisigCtrl {
	$walletService: WalletService;
	$dashboardService: DashboardService;
	$utils: UtilsService;

	pageHeader: PageHeaderConfig;
	wizard: {
		step1: WizardStep<{
			n: number;
			label: string;
			admins: string[];
			adminscheck: { [admin: string]: boolean };
			scripttype: BitcoinScriptType;
		}>;
		step2: WizardStep<void>;
	};

	constructor($dashboardService, $walletService, $translate, WizardHandler, $utils) {
		this.$utils = $utils;
		this.$dashboardService = $dashboardService;
		this.$walletService = $walletService;

		this.pageHeader = {
			description: {
				title: $translate.getString('multisig wallet creation'),
				subTitle: $translate.getString('Create a new multisig wallet to send and receive Bitcoin')
			}
		};

		this.wizard = { step1: null, step2: null };

		this.wizard.step1 = new WizardStep('newWalletMultisig', WizardHandler);
		this.wizard.step1.setTitles({
			main: $translate.getString('Create'),
			heading: $translate.getString('Edit multisig wallet settings')
		});
		this.wizard.step1.initializeModel({
			n: 3,
			label: '',
			admins: [],
			adminscheck: {},
			scripttype: 'p2sh-p2wsh'
		});
		this.wizard.step1.setSubmitHandler((model) => {
			const admins = [];

			for (const ad in model.adminscheck)
				if (model.adminscheck[ad]) admins.push(ad);

			this.$walletService.createMultisig(model.scripttype, model.label, model.n, admins).then(_ => {
				this.$walletService.emitReload();
				this.$dashboardService.emitNotificationUpdate('wallet');
				this.wizard.step1.next();
			}).catch((res) => {
				this.wizard.step1.setResponse('error', res.data);
			});
		});


		this.wizard.step2 = new WizardStep('newWalletMultisig', WizardHandler);
		this.wizard.step2.setTitles({
			main: $translate.getString('Done'),
			heading: $translate.getString('Done')
		});
	}

	evaluteMultisigType() {
		let m = 1;

		for (const ad in this.wizard.step1.model.adminscheck)
			if (this.wizard.step1.model.adminscheck[ad])
				m++;

		// const n = parseInt(this.wizard.step1.model.n);
		const n = this.wizard.step1.model.n;
		return n + ' of ' + m;
	}

	$onInit() {
		this.$dashboardService.getAdminList().then(admins => {
			if (admins.length === 0)
				return $('#noadminModal').modal('show');

			this.wizard.step1.model.admins = admins;
			for (let i = 0; i < admins.length; i++)
				this.wizard.step1.model.adminscheck[admins[i]] = true;

			this.$dashboardService.emitNotificationUpdate('wallet');
		});
	}

	static get $inject() { return ['$dashboardService', '$walletService', '$translate', 'WizardHandler', '$utils']; }
}

const MeWalletNewMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/newmultisig/newmultisig.html',
	controller: MeWalletNewMultisigCtrl
};

export default MeWalletNewMultisigComponent;