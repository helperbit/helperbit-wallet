import { Component, OnInit } from "@angular/core";
import { WalletService, WalletVerification, WalletVerificationHistory, WalletVerificationResponse, Wallet, TLTransaction, WalletPendingVerificationsResponse, WalletPendingVerification } from '../../../models/wallet';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderConfig } from "app/shared/components/page-header/page-header";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MeWalletVerifyCreationComponent } from "./creation/creation";
import { MeWalletVerifySignComponent } from './sign/sign';

interface AccordationStatus {
	class?: { label: string; icon: string };
	text?: {
		label: string;
		description: string;
	};
}

interface WalletVerificationHistoryEx extends AccordationStatus, WalletVerificationHistory { };

interface WalletVerificationEx extends WalletVerification {
	signed?: boolean;
	creation?: boolean;
	history: WalletVerificationHistoryEx[];
}

@Component({
	selector: 'me-wallet-verify',
	templateUrl: 'wallet-verify.html',
	styleUrls: ['wallet-verify.scss']
})
export class MeWalletVerificationComponent implements OnInit {
	pageHeader: PageHeaderConfig;
	wallets: WalletVerificationEx[];
	pending: WalletPendingVerification[];

	constructor(
		private walletService: WalletService,
		private translate: TranslateService,
		private modalService: NgbModal,
	) {
		this.pageHeader = {
			description: {
				title: translate.instant('Wallet Verify'),
				subTitle: translate.instant('Check your wallets verification status')
			}
		}
	}

	updateWallets() {
		this.walletService.getWalletVerificationList().subscribe((res: WalletVerificationResponse) => {
			res.verifications.forEach((wallet: WalletVerificationEx) => {
				wallet.signed = true;
				wallet.creation = false;

				// status: creation, ismultisig: true			mostra verify
				// status: signing, ismultisig: true			non mostrare tasto
				// status: signing, ismultisig: false			mostra verify
				// status: signed		 						non mostrare tasti

				wallet.history.forEach((history: WalletVerificationHistoryEx) => {
					if (wallet.signed && history.status == 'signing')
						wallet.signed = false;
					else if (!wallet.creation && history.status == 'creation')
						wallet.creation = true;

					const style = this.getLabelClass(history.status);
					history.class = style.class;
					history.text = style.text;
				});
			});

			this.wallets = res.verifications;
		});

		this.walletService.getWalletVerificationPending().subscribe((res: WalletPendingVerificationsResponse) => {
			this.pending = res.pending;
		});
	}

	private getLabelClass(status: string): { class: { label: string; icon: string }; text: { label: string; description: string } } {
		// signed (firmata)
		// signing (da firmare)
		// creating (inizio)
		switch (status) {
			case 'creating':
				return {
					class: { label: 'state-working', icon: 'fa-clock-o' },
					text: {
						label: this.translate.instant('signing'),
						description: this.translate.instant('You need to verify this wallet')
					}
				};
			case 'signed':
				return {
					class: { label: 'state-success', icon: 'fa-check' },
					text: {
						label: this.translate.instant('signed'),
						description: this.translate.instant('Your verification is completed!')
					}
				};
			case 'signing':
				return {
					class: { label: 'state-working', icon: 'fa-sign-o' },
					text: {
						label: this.translate.instant('signing'),
						description: this.translate.instant('You need to verify this wallet')
					}
				};
			default:
				return {
					class: { label: '', icon: '' },
					text: {
						label: this.translate.instant('n/a'),
						description: this.translate.instant('Not Applicable')
					}
				}
		}
	}

	verificationCreate(walletVer: WalletVerification) {
		const modalRef = this.modalService.open(MeWalletVerifyCreationComponent, {
			size: 'lg',
			backdrop: 'static',
			keyboard: false
		});
		modalRef.componentInstance.walletVer = walletVer;
		modalRef.result.then((v) => {
			this.updateWallets();
		}, () => {
			this.updateWallets();
		});
	}

	verificationSign(pending: WalletPendingVerification) {
		const modalRef = this.modalService.open(MeWalletVerifySignComponent, {
			size: 'lg',
			backdrop: 'static',
			keyboard: false
		});
		modalRef.componentInstance.pending = pending;
		modalRef.result.then((v) => {
			this.updateWallets();
		}, () => {
			this.updateWallets();
		});
	}

	ngOnInit(): void {
		this.updateWallets();
	}
}
