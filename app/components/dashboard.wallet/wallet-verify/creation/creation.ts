import { Component, Input } from "@angular/core";
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WalletService, WalletVerification } from "app/models/wallet";

@Component({
	selector: 'me-wallet-verify-creation',
	templateUrl: 'creation.html',
	styleUrls: ['creation.scss']
})
export class MeWalletVerifyCreationComponent {
	@Input() walletVer: WalletVerification;

	constructor (
		public activeModal: NgbActiveModal,
		public walletService: WalletService
	) {}

	startProcedure() {
		this.walletService.startWalletVerification(this.walletVer.address).subscribe(tltx => {
			this.activeModal.close();
		});
	}
}