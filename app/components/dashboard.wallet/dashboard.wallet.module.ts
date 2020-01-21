import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModalModule, NgbTabsetModule } from '@ng-bootstrap/ng-bootstrap';
import { MnemonicViewComponent } from './widgets/mnemonic-view/mnemonic-view';
import { SharedModule } from '../../shared/shared.module';
import { TransactionListComponent } from './widgets/transaction-list/transaction-list';
import { WalletListComponent } from './widgets/wallet-list/wallet-list';
import { WalletDepositModal } from './widgets/wallet-list/deposit';
import { WalletSettingsModal } from './widgets/wallet-list/settings';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { MeWalletVerifyCreationComponent } from './wallet-verify/creation/creation';
import { MeWalletVerifySignComponent } from './wallet-verify/sign/sign';
import { LedgerWaitComponent } from './widgets/ledger-wait/ledger-wait';
import { WalletSignComponent } from './sign/sign';
import { MeWalletDonateComponent } from './donate/donate';
import { FormlyModule } from '@ngx-formly/core';
import { ArchwizardModule } from 'angular-archwizard';
import { MeWalletComponent } from './wallets/wallets';
import { MeWalletSignMultisigModal } from './signmultisig/signmultisig';
import { MeWalletNewMultisigComponent } from './newmultisig/newmultisig';
import { MeWalletRestoreComponent } from './restore/restore';
import { MeWalletNewComponent } from './new/new';
import { MeWalletFeedMultisigComponent } from './feedmultisig/feedmultisig';
import { FeeSelectorComponent } from './withdraw/fee-selector';
import { MeWalletWithdrawComponent } from './withdraw/withdraw';
import { RouterModule } from '@angular/router';
import { MetaGuard } from 'ng2-meta';
import { AuthGuard } from '../../shared/helpers/auth-guard';
import { MeWalletVerificationComponent } from './wallet-verify/wallet-verify';
import { BitcoinTrezorService } from './bitcoin.service/trezor';
import { BitcoinLedgerService } from './bitcoin.service/ledger';
import { BitcoinService } from './bitcoin.service/mnemonic';
import { TranslateModule } from '@ngx-translate/core';
// import AlertComponent from './alert/alert';

import 'babel-polyfill';

@NgModule({
	imports: [
		RouterModule.forChild([
			{
				path: '',
				component: MeWalletComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Wallet',
						'footerName': 'Wallet',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser', 'npo', 'municipality', 'company'],
						redirect: {
							default: '/auth/login'
						}
					}
				}
			},
			{
				path: 'new',
				component: MeWalletNewComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Wallet creation',
						'footerName': 'Wallet creation',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser', 'company'],
						redirect: {
							default: '/auth/login'
						}
					}
				}
			},
			{
				path: 'newmultisig',
				component: MeWalletNewMultisigComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Wallet creation',
						'footerName': 'Multisig Wallet Creation',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['npo', 'municipality'],
						redirect: {
							default: '/auth/login',
							wrongUserType: '/user/me'
						}
					}
				}
			},
			{
				path: 'feedmultisig',
				component: MeWalletFeedMultisigComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Transaction sign',
						'footerName': 'Feed Multisig Wallet',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser'],
						redirect: {
							default: '/auth/login',
							wrongUserType: '/user/me'
						}
					}
				}
			},
			{
				path: 'verify',
				component: MeWalletVerificationComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Wallet Verify',
						'footerName': 'Verify Your Wallet',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser', 'npo', 'municipality', 'company'],
						redirect: {
							default: '/auth/login',
							wrongUserType: '/user/me'
						}
					}
				}
			},
			{
				path: 'restore/:address',
				component: MeWalletRestoreComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Restore Wallet',
						'footerName': 'Wallet Restore',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser'],
						redirect: {
							default: '/auth/login',
							wrongUserType: '/user/me'
						}
					}
				}
			},
			{
				path: 'donate/:restype/:resid',
				component: MeWalletDonateComponent,
				canActivate: [MetaGuard, AuthGuard],
				data: {
					meta: {
						'title': 'Donate',
						'footerName': 'Donate',
						'showWizardProcedure': true
					},
					auth: {
						status: 'logged',
						allowedUserType: ['singleuser', 'npo', 'municipality', 'company'],
						redirect: {
							default: '/auth/login'
						}
					}
				}
			}
		]),
		CommonModule,
		SharedModule,
		FormsModule,
		ReactiveFormsModule,
		FormlyModule,
		NgbModalModule,
		QRCodeModule,
		NgbTabsetModule,
		ArchwizardModule,
		TranslateModule
	],
	exports: [
		RouterModule
	],
	providers: [
		BitcoinTrezorService,
		BitcoinLedgerService,
		BitcoinService,
	],
	declarations: [
		MnemonicViewComponent,
		TransactionListComponent,
		WalletListComponent,
		MeWalletVerificationComponent,
		MeWalletVerifyCreationComponent,
		MeWalletVerifySignComponent,
		LedgerWaitComponent,
		WalletSignComponent,
		MeWalletDonateComponent,
		MeWalletComponent,
		WalletDepositModal,
		WalletSettingsModal,
		MeWalletSignMultisigModal,
		MeWalletNewMultisigComponent,
		MeWalletRestoreComponent,
		MeWalletNewComponent,
		MeWalletFeedMultisigComponent,
		FeeSelectorComponent,
		MeWalletWithdrawComponent,
	],
	entryComponents: [
		WalletDepositModal,
		WalletSettingsModal,
		MeWalletWithdrawComponent,
		MeWalletSignMultisigModal,
		MeWalletVerifyCreationComponent,
		MeWalletVerifySignComponent
	]
})
export class DashboardWalletModule {
	constructor() { }
} 