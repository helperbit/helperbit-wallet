import { Ror } from '../../../models/ror';
import { NotificationService } from '../../../models/notifications';
import { WalletService, Transaction } from '../../../models/wallet';
import { WalletSignComponent, SignConfig } from '../sign/sign';
import { Component, Input, ViewChild } from '@angular/core';
import { WizardComponent } from 'angular-archwizard';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ResponseMessageConfig, buildErrorResponseMessage } from 'app/shared/components/response-messages/response-messages';


@Component({
	selector: 'me-wallet-sign-multisig-modal',
	templateUrl: 'signmultisig.html',
})
export class MeWalletSignMultisigModal {
	@Input() transactions: Transaction[];
	@Input() rors: { [id: string]: Ror };
	@ViewChild(WizardComponent, { static: false }) public wizardHandler: WizardComponent;
	@ViewChild(WalletSignComponent, { static: false }) public signComponent: WalletSignComponent;

	responseMessage: ResponseMessageConfig;
	isLoading: boolean;
	signConfig: SignConfig;
	model: {
		selected: any;
		refused: boolean;
	};

	constructor(
		private notificationService: NotificationService,
		private walletService: WalletService,
		public activeModal: NgbActiveModal
	) {
		this.isLoading = false;
		this.responseMessage = {};

		this.signConfig = {
			type: 'multi',
			transaction: null
		};

		this.model = {
			selected: null,
			refused: false
		};
	}

	sign() {
		const sendSignedTransaction = (txhex) => {
			this.walletService.signMultisigTransaction(this.model.selected._id, txhex).subscribe(_ => {
				this.notificationService.onUpdate.emit('wallet');
				this.wizardHandler.goToNextStep();
				this.isLoading = false;
			}, (res) => {
				this.responseMessage = buildErrorResponseMessage({ error: 'E' });
				this.isLoading = false;
			});
		};

		this.responseMessage = {};
		this.isLoading = true;

		/* Request the updated tx */
		this.walletService.getMultisigTransactions().subscribe(txs => {
			for (let i = 0; i < txs.length; i++) {
				if (txs[i].txid == this.model.selected.txid)
					this.model.selected = txs[i];
			}

			/* Put the signature */
			this.signComponent.sign(this.model.selected.hex, this.model.selected.utxos).then(txhex => sendSignedTransaction(txhex)).catch(err => {
				this.responseMessage = buildErrorResponseMessage({ error: err });
				this.isLoading = false;
			});
		});
	}

	refuse() {
		this.walletService.refuseMultisigTransaction(this.model.selected._id).subscribe(_ => {
			this.model.refused = true;
			this.wizardHandler.goToNextStep();
		}, (res) => {
			this.responseMessage = buildErrorResponseMessage({ error: 'E' });
		});
	}

	selectTransaction(tx) {
		this.model.selected = tx;
		this.model.refused = false;
		this.signConfig = { type: 'multi', transaction: this.model.selected };

		this.wizardHandler.goToNextStep();
	}
}

