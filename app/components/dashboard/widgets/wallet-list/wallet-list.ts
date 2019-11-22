import BrowserHelperService from '../../../../services/browser-helper';
import WalletService, { Wallet } from '../../../../models/wallet';
import { Subscription } from 'rxjs/internal/Subscription';
import { Component, Inject, Output, Input, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import WalletDepositModal from './deposit';
import WalletSettingsModal from './settings';
import MeWalletWithdrawComponent from '../../wallet/withdraw/withdraw';

export interface WalletListConfig {
	wallets?: Wallet[];
	adminof?: Wallet[];
	receiveaddress?: string;
	footer?: boolean;
	onlyUsable?: boolean;
	selector?: boolean;
}


/** List of wallet of an user */
@Component({
	selector: 'wallet-list',
	templateUrl: 'wallet-list.html',
})
export default class WalletListComponent implements OnDestroy, OnInit {
	@Input() config: WalletListConfig
	@Output() selected: EventEmitter<Wallet> = new EventEmitter();
	@Output() defaultChange: EventEmitter<string> = new EventEmitter();

	error: string;
	cleanupReloadWallets: Subscription;
	currentResolution: string;
	selectedWallet: Wallet;

	constructor(
		private walletService: WalletService,
		browserHelperService: BrowserHelperService,
		private modalService: NgbModal
	) {
		this.currentResolution = browserHelperService.currentResolution;
		this.selectedWallet = null;
		this.error = '';
	}

	reload() {
		this.walletService.getList().subscribe((list) => {
			this.config.wallets = list.wallets;
			this.config.adminof = list.adminof;

			if (this.config.onlyUsable) {
				this.config.wallets = this.config.wallets.filter((w) => {
					if ((w.ismultisig && w.multisig.active) || !w.ismultisig)
						return true;
					else
						return false;
				});
				this.config.adminof = [];
			}

			if (this.config.receiveaddress !== undefined)
				this.config.receiveaddress = list.receiveaddress;

			this.walletService.onLoad.emit({ wallets: this.config.wallets, receiveaddress: this.config.receiveaddress, adminof: this.config.adminof });
		}, (res) => {
			this.error = res.error.error;
		});
	}

	settingsClick(w: Wallet) {
		const modalRef = this.modalService.open(WalletSettingsModal);
		modalRef.componentInstance.wallet = w;
		modalRef.result.then((v) => { this.reload(); }, () => { this.reload(); });
	}

	depositClick(w: Wallet) {
		const modalRef = this.modalService.open(WalletDepositModal);
		modalRef.componentInstance.wallet = w;
		modalRef.result.then((v) => { }, () => { });
	}

	withdrawClick(w: Wallet) {
		const modalRef = this.modalService.open(MeWalletWithdrawComponent, {
			size: 'lg'
		});
		modalRef.componentInstance.config = { address: w.address };
		modalRef.result.then((v) => { this.reload(); }, () => { this.reload(); });
	}

	ngOnDestroy() {
		this.cleanupReloadWallets.unsubscribe();
	}

	ngOnInit() {
		if (this.config.onlyUsable === undefined)
			this.config.onlyUsable = false;
		else
			this.config.onlyUsable = true;

		if (this.config.footer === undefined)
			this.config.footer = false;


		this.cleanupReloadWallets = this.walletService.onReload.subscribe(() => { this.reload(); });
		this.reload();
	}
}
