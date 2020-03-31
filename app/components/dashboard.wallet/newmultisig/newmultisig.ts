import * as $ from 'jquery';
import { PageHeaderConfig } from '../../../shared/components/page-header/page-header';
import { WizardComponent } from 'angular-archwizard';
import { BitcoinScriptType } from '../bitcoin.service/bitcoin-helper';
import { DashboardService } from '../../../models/dashboard';
import { WalletService } from '../../../models/wallet';
import { UtilsService } from 'app/services/utils';
import { TranslateService } from '@ngx-translate/core';
import { ModalsConfig } from 'app/shared/components/modal/oldModal/modal';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ResponseMessageConfig, buildErrorResponseMessage } from 'app/shared/components/response-messages/response-messages';

@Component({
	selector: 'me-wallet-new-multisig-component',
	templateUrl: 'newmultisig.html'
})
export class MeWalletNewMultisigComponent implements OnInit {
	@ViewChild(WizardComponent) public wizardHandler: WizardComponent;

	responseMessage: ResponseMessageConfig;
	pageHeader: PageHeaderConfig;
	modals: ModalsConfig;
	model: {
		n: number;
		label: string;
		admins: string[];
		adminscheck: { [admin: string]: boolean };
		scripttype: BitcoinScriptType;
		scripttypenative: boolean;
	};

	constructor(
		private dashboardService: DashboardService,
		private walletService: WalletService,
		translate: TranslateService,
		public utilsService: UtilsService
	) {
		this.pageHeader = {
			description: {
				title: translate.instant('multisig wallet creation'),
				subTitle: translate.instant('Create a new multisig wallet to send and receive Bitcoin')
			}
		};
		this.modals = {
			noAdmin: {
				id: 'modalNoAdmin',
				title: translate.instant('Admins not verified')
			}
		};
		this.model = {
			n: 3,
			label: '',
			admins: [],
			adminscheck: {},
			scripttype: 'p2sh-p2wsh',
			scripttypenative: false
		};
		this.responseMessage = {};


		// TODO: missingheadingtitle
		// 	heading: translate.instant('Edit multisig wallet settings')
		// 	heading: translate.instant('Done')
	}

	submit() {
		const admins = [];

		for (const ad in this.model.adminscheck)
			if (this.model.adminscheck[ad]) admins.push(ad);

		this.model.scripttype = this.model.scripttypenative ? 'p2wsh' : 'p2sh-p2wsh';

		this.walletService.createMultisig(this.model.scripttype, this.model.label, this.model.n, admins).subscribe(_ => {
			this.walletService.onReload.emit();
			this.dashboardService.emitNotificationUpdate('wallet');
			this.wizardHandler.goToNextStep();
		}, (res) => {
			this.responseMessage = buildErrorResponseMessage(res.error);
		});
	}

	evaluteMultisigType() {
		let m = 1;

		for (const ad in this.model.adminscheck)
			if (this.model.adminscheck[ad])
				m++;

		// const n = parseInt(this.model.n);
		const n = this.model.n;
		return n + ' of ' + m;
	}

	ngOnInit() {
		this.dashboardService.getAdminList().subscribe(adminsinfo => {
			if (adminsinfo.admins.length === 0)
				return $('#modalNoAdmin').modal('show');

			this.model.admins = adminsinfo.admins;
			for (let i = 0; i < adminsinfo.admins.length; i++)
				this.model.adminscheck[adminsinfo.admins[i]] = true;

			this.dashboardService.emitNotificationUpdate('wallet');
		});
	}
}

