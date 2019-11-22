import { Component, Input, OnInit } from '@angular/core';
import WalletService, { Wallet, WalletTransaction } from '../../../../models/wallet';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'wallet-deposit-modal',
	templateUrl: 'deposit.html'
})
export default class WalletDepositModal implements OnInit {
	@Input() wallet: Wallet;
	private txs: WalletTransaction[] = [];
	private qr: string = '';
	// faucet: { loading: boolean; error: string };

	constructor(
		public activeModal: NgbActiveModal,
		private walletService: WalletService
	){ 
		// this.faucet = { loading: false, error: '' };
		
		// this.modals = {
		// 	faucetDone: {
		// 		id: 'modalFaucetDone'
		// 	},
	}

	// getFaucet(w: Wallet) {
	// 	this.faucet.loading = true;
	// 	this.walletService.getFaucet(w.address).subscribe(_ => {
	// 		this.faucet.loading = false;
	// 		this.reloadWallet();
	// 		$('#modalDeposit').modal('hide');
	// 		$('#modalFaucetDone').modal('show');
	// 	},(res) => {
	// 		this.faucet.error = res.error.error;
	// 		this.faucet.loading = false;
	// 	});
	// }

	ngOnInit() {
		this.walletService.getTransactions(this.wallet.address).subscribe(txs => {
			this.txs = txs;
		});
		this.qr = 'bitcoin:' + this.wallet.address;
	}
}