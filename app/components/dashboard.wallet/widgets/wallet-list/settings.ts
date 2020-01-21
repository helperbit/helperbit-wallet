import { Component, Input } from '@angular/core';
import { WalletService, Wallet } from '../../../../models/wallet';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'wallet-settings-modal',
	templateUrl: 'settings.html'
})
export class WalletSettingsModal {
	@Input() wallet: Wallet;
	public error: string = '';
	public loading: boolean;

	constructor(
		public activeModal: NgbActiveModal,
		private walletService: WalletService
	) {
	}

	deleteWallet(w) {
		this.loading = true;

		this.walletService.delete(w.address).subscribe(_ => {
			this.loading = false;
			this.walletService.onReload.emit();
			this.activeModal.close();
		}, (res) => {
			this.error = res.error.error;
			this.loading = false;
		});
	}

	updateLabel() {
		this.walletService.updateLabel(this.wallet.address, this.wallet.label).subscribe(_ => {
			this.walletService.onReload.emit();
			this.activeModal.close();
		}, (res) => {
			this.error = res.error.error;
		});
	}
}