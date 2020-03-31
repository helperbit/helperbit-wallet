import * as $ from 'jquery';
import { PageHeaderConfig } from '../../../shared/components/page-header/page-header';
import { ModalsConfig } from '../../../shared/components/modal/oldModal/modal';
import { TranslateService } from '@ngx-translate/core';
import { WalletListConfig } from '../widgets/wallet-list/wallet-list';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WalletService, WalletTransaction, Transaction, Wallet } from '../../../models/wallet';
import { DashboardService, UserPrivate } from '../../../models/dashboard';
import AppSettings from '../../../app.settings';
import { Component, OnInit } from '@angular/core';
import { WalletSettingsModal } from '../widgets/wallet-list/settings';
import { RorService, Ror } from 'app/models/ror';
import { MeWalletSignMultisigModal } from '../signmultisig/signmultisig';
import { MeWalletWithdrawComponent } from '../withdraw/withdraw';
import { getLocalStorage } from 'app/shared/helpers/utils';

@Component({
	selector: 'me-wallet-component',
	templateUrl: 'wallets.html',
	styleUrls: ['wallets.scss']
})
export class MeWalletComponent implements OnInit {
	baseUrl: string = AppSettings.baseUrl;
	pageHeader: PageHeaderConfig;
	modals: ModalsConfig;
	walletList: WalletListConfig;
	user: UserPrivate;
	adminof: Wallet[];
	qr: string;
	selected: string;
	transactions: WalletTransaction[];
	defaultwallet: Wallet & { balance?: number; qr?: string };
	backup: any;
	multisigPending: { transactions: Transaction[]; rors: { [id: string]: Ror } };

	constructor(
		private walletService: WalletService,
		private dashboardService: DashboardService,
		private rorService: RorService,
		private modalService: NgbModal,
		translate: TranslateService
	) {
		this.multisigPending = {
			transactions: [],
			rors: {}
		};
		this.adminof = [];
		this.selected = 'wallet';
		this.transactions = [];
		this.defaultwallet = null;

		this.walletList = {
			wallets: [],
			footer: true,
			receiveaddress: ''
		};

		this.pageHeader = {
			description: {
				title: translate.instant('wallet'),
				subTitle: translate.instant('Handle your Bitcoin accounts')
			}
		};

		this.modals = {
			createDonationButton: {
				id: 'modalCreateDonationButton'
			}
		};
	}

	withdraw(w: Wallet) {
		const modalRef = this.modalService.open(MeWalletWithdrawComponent, {
			size: 'lg'
		});
		modalRef.componentInstance.config = { address: w.address };
		modalRef.result.then((v) => { this.reloadWallet(); }, () => { this.reloadWallet(); });
	}

	createDonationButton() {
		$('#modalCreateDonationButton').modal('show');
	}

	reloadWallet() {
		this.walletService.onReload.emit();

		this.walletService.getMultisigTransactions().subscribe(txs => {
			const username = getLocalStorage().getItem('username');
			const email = getLocalStorage().getItem('email');

			this.multisigPending.rors = {};

			this.multisigPending.transactions = txs.filter(tx =>
				tx.status == 'signing' && username != tx.from && tx.signers.indexOf(email) == -1
			);
			this.multisigPending.transactions.forEach(tx => {
				if (!tx.ror)
					return;

				this.rorService.get(tx.ror, true).subscribe((ror: Ror) => {
					this.multisigPending.rors[ror._id] = ror;
				});
			});

			if (this.multisigPending.transactions.length > 0)
				this.openSignMultisigModal();
		});
	}


	settingsClick(w: Wallet) {
		const modalRef = this.modalService.open(WalletSettingsModal);
		modalRef.componentInstance.wallet = w;
		modalRef.result.then((v) => { this.reloadWallet(); }, () => { this.reloadWallet(); });
	}

	defaultChange(w: string) {
		this.walletList.receiveaddress = w;
		this.walletList = { ...this.walletList };
		this.defaultwallet = this.walletList.wallets.filter((w) => { return w.address == this.walletList.receiveaddress; })[0];
		this.walletService.updateReceive(w).subscribe(_ => { });
		this.walletService.getTransactions(w).subscribe(txs => {
			this.transactions = txs;
		});
	}

	openSignMultisigModal() {
		const modalRef = this.modalService.open(MeWalletSignMultisigModal);
		modalRef.componentInstance.transactions = this.multisigPending.transactions;
		modalRef.componentInstance.rors = this.multisigPending.rors;
		modalRef.result.then((v) => { this.reloadWallet(); }, () => { this.reloadWallet(); });
	}


	ngOnInit() {
		this.walletService.onLoad.subscribe(data => {
			this.defaultwallet = data.wallets.filter((w) => { return w.address == data.receiveaddress; })[0];

			if (data.receiveaddress) {
				this.walletService.getTransactions(data.receiveaddress).subscribe((txs) => {
					this.transactions = txs;
				});
			}

			this.walletList.wallets = data.wallets;
			this.walletList.wallets = this.walletList.wallets.map((w) => {
				const w1: Wallet & { qr?: string } = w;
				w1.qr = "bitcoin:" + w.address;/*this.defaultwallet.address;*/
				return w1;
			});
			this.adminof = data.adminof;
			this.walletList = { ...this.walletList };
		});

		this.dashboardService.get().subscribe(user => {
			this.user = user;
		});

		this.reloadWallet();
	}
}
