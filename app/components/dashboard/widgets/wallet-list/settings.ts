import { Component, Input, OnInit } from '@angular/core';
import WalletService, { Wallet, WalletTransaction } from '../../../../models/wallet';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'wallet-settings-modal',
	templateUrl: 'settings.html'
})
export default class WalletSettingsModal implements OnInit {
	@Input() wallet: Wallet;
	private txs: WalletTransaction[] = [];
	private qr: string = '';
	private error: string = '';
	// faucet: { loading: boolean; error: string };

	constructor(
		public activeModal: NgbActiveModal,
		private walletService: WalletService
	) {
		// confirmConfig: {
		// 	id: 'modalConfirm',
		// 	modalClass: 'modal-md',
		// 	hideCloseButton: true,
		// 	title: null,
		// 	confirm: {
		// 		method: null,
		// 		parameters: null,
		// 		description: null
		// 	}
		// }
	}


	// openConfirmDeleteWallet(wallet) {
	// 	this.modals.confirmConfig.confirm.method = (w) => { this.removeWallet(w); };
	// 	this.modals.confirmConfig.confirm.parameters = [wallet];
	// 	this.modals.confirmConfig.title = this.translate.instant('Confirm delete wallet');
	// 	this.modals.confirmConfig.confirm.description = this.translate.instant('Are you sure to delete') + ' ' + wallet.address + ' ' + this.translate.instant('wallet?');

	// 	$('#modalConfirm').modal('show');
	// }

	// removeWallet(w) {
	// 	this.remove.loading = true;

	// 	this.walletService.delete(w.address).subscribe(_ => {
	// 		this.remove.loading = false;
	// 		this.reloadWallet();
	// 		$('#modalSettings').modal('hide');
	// 	}, (res) => {
	// 		this.settings.error = res.error.error;
	// 		this.remove.loading = false;
	// 	});
	// }

	updateLabel() {
		this.walletService.updateLabel(this.wallet.address, this.wallet.label).subscribe(_ => {
			this.walletService.onReload.emit();
			$('#modalSettings').modal('hide');
		}, (res) => {
			this.error = res.error.error;
		});
	}

	// walletSettings(w) {
	// 	this.remove.loading = false;
	// 	this.settings.error = '';
	// 	this.selectedwallet = w;
	// 	this.backup = { txid: '', loading: false, file: null, data: null, password: '', destination: '', error: '' };
	// 	$('#modalSettings').modal('show');
	// }


	ngOnInit() {
	}
}