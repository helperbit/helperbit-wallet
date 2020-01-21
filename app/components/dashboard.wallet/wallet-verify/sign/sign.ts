import { Component, Input, ViewChild, OnInit } from "@angular/core";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WalletService, TLTransaction, WalletPendingVerification } from 'app/models/wallet';
import { ResponseMessageConfig, buildErrorResponseMessage } from 'app/shared/components/response-messages/response-messages';
import { WalletSignComponent, SignConfig } from '../../sign/sign';

@Component({
	selector: 'me-wallet-verify-sign',
	templateUrl: 'sign.html',
	styleUrls: ['sign.scss']
})
export class MeWalletVerifySignComponent implements OnInit {
	public tx: TLTransaction;
	responseMessage: ResponseMessageConfig;
	signConfig: SignConfig;
	isLoading: boolean;
	@Input() pending: WalletPendingVerification;
	@ViewChild(WalletSignComponent, { static: false }) public signComponent: WalletSignComponent;

	constructor(
		public activeModal: NgbActiveModal,
		private walletService: WalletService
	) { 
		this.signConfig = null;
		this.isLoading = false;
		this.responseMessage = {};
	}

	submitSignature(txhex1, txhex2) {
		if (this.tx.wallet.ismultisig) {
			this.walletService.feedTLTransaction(this.tx.wallet.address, txhex1, txhex2).subscribe(_ => {
				this.isLoading = false;
				this.activeModal.close();
			}, (res) => {
				this.responseMessage = buildErrorResponseMessage({ error: 'E' });
				this.isLoading = false;
			});
		} else {
			this.walletService.signTLTransaction(this.tx.wallet.address, txhex1, txhex2).subscribe(_ => {
				this.isLoading = false;
				this.activeModal.close();
			}, (res) => {
				this.responseMessage = buildErrorResponseMessage({ error: 'E' });
				this.isLoading = false;
			});
		}
	}

	sign() {		
		this.responseMessage = {};
		this.isLoading = true;

		/* Put the signature */
		if (this.tx.onlycheck) {
			return this.signComponent.sign(this.tx.hex, this.tx.utxos).then(txhex => {
				this.submitSignature('', '');
			})
		}

		this.signComponent.sign(this.tx.hex, this.tx.utxos).then(txhex1 => {
			this.signComponent.sign(this.tx.recoveryhex, this.tx.utxos).then(txhex2 => {
				this.submitSignature(txhex1, txhex2);
			}).catch(err => {
				this.responseMessage = buildErrorResponseMessage({ error: err });
				this.isLoading = false;
			});
		}).catch(err => {
			this.responseMessage = buildErrorResponseMessage({ error: err });
			this.isLoading = false;
		});
	}

	ngOnInit() {
		this.walletService.getTLTransaction(this.pending._id).subscribe(tltx => {
			this.tx = tltx;
			// console.log(tltx);
			this.signConfig = { tltransaction: tltx, type: 'verify' };
		});
	}
}