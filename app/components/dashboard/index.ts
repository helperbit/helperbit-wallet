import * as angular from 'angular';
import MeAdminComponent from './admin/admin';
import MeBadgesComponent from './badges/badges';
import MeControlPanelComponent from './controlpanel/controlpanel';
import MeDeleteComponent from './delete/delete';
import MnemonicViewComponent from './mnemonic-view/mnemonic-view';
import LedgerWaitComponent from './ledger-wait/ledger-wait';
import TransactionListComponent from './transaction-list/transaction-list';
import WalletListComponent from './wallet-list/wallet-list';
import MePrivacyComponent from './privacy/privacy';
import MeInvoiceableComponent from './invoiceable/invoiceable';
import MeNotificationsComponent from './notifications/notifications';
import MeSocialEditComponent from './socialedit/socialedit';
import MeSecurityComponent from './security/security';
import MeGeolocalizationModalComponent from './geolocalization/modal/modal';
import MeGeolocalizationComponent from './geolocalization/geolocalization';
import MeEditComponent from './edit/edit';
import MeRorsComponent from './rors/rors';
import MeWalletWithdrawComponent from './wallet/withdraw/withdraw';
import MeWalletRestoreComponent from './wallet/restore/restore';
import MeWalletNewComponent from './wallet/new/new';
import MeWalletNewMultisigComponent from './wallet/newmultisig/newmultisig';
import MeWalletFeedMultisigComponent from './wallet/feedmultisig/feedmultisig';
import MeWalletSignMultisigComponent from './wallet/signmultisig/signmultisig';
import MeWalletComponent from './wallet/wallets/wallets';
import MeWalletDonateComponent from './wallet/donate/donate';
import MeVerifyComponent from './verify/verify';
import MeVerifyProviderCompanyComponent from './verify/providers/company/company';
import MeVerifyProviderGpsComponent from './verify/providers/gps/gps';
import MeVerifyProviderDocumentComponent from './verify/providers/document/document';
import MeVerifyProviderResidencyComponent from './verify/providers/residency/residency';
import MeVerifyProviderOtcComponent from './verify/providers/otc/otc';
import MeVerifyProviderNpoComponent from './verify/providers/npo/npo';
import MeVerifyProviderNpoStatuteComponent from './verify/providers/npo/statute/statute';
import MeVerifyProviderNpoMemorandumComponent from './verify/providers/npo/memorandum/memorandum';
import MeVerifyProviderNpoAdminsComponent from './verify/providers/npo/admins/admins';
import MeRorCreateComponent from './rors/create/create';
import WalletSignComponent from './wallet/sign/sign';
// import AlertComponent from './alert/alert';

export default "helperbit.components.dashboard";

const mod = angular.module('helperbit.components.dashboard', [
	'helperbit.core',
	'helperbit.services',
	'helperbit.shared'
]);

mod.component('meAdminComponent', MeAdminComponent);
// mod.component('alert', AlertComponent);
mod.component('meBadgesComponent', MeBadgesComponent);
mod.component('meControlPanelComponent', MeControlPanelComponent);
mod.component('meDeleteComponent', MeDeleteComponent);
mod.component('mePrivacyComponent', MePrivacyComponent);
mod.component('meInvoiceableComponent', MeInvoiceableComponent);
mod.component('meNotificationsComponent', MeNotificationsComponent);
mod.component('meSocialEditComponent', MeSocialEditComponent);
mod.component('meSecurityComponent', MeSecurityComponent);
mod.component('meGeolocalizationModalComponent', MeGeolocalizationModalComponent);
mod.component('meGeolocalizationComponent', MeGeolocalizationComponent);
mod.component('meEditComponent', MeEditComponent);

mod.component('meRorsComponent', MeRorsComponent);
mod.component('meRorCreateComponent', MeRorCreateComponent);

mod.component('meWalletWithdrawComponent', MeWalletWithdrawComponent);
mod.component('meWalletRestoreComponent', MeWalletRestoreComponent);
mod.component('meWalletNewComponent', MeWalletNewComponent);
mod.component('meWalletNewMultisigComponent', MeWalletNewMultisigComponent);
mod.component('meWalletFeedMultisigComponent', MeWalletFeedMultisigComponent);
mod.component('meWalletSignMultisigComponent', MeWalletSignMultisigComponent);
mod.component('meWalletComponent', MeWalletComponent);
mod.component('meWalletDonateComponent', MeWalletDonateComponent);

mod.component('walletSign', WalletSignComponent);
mod.component('mnemonicView', MnemonicViewComponent);
mod.component('ledgerWait', LedgerWaitComponent);
mod.component('transactionList', TransactionListComponent);
mod.component('walletList', WalletListComponent);

mod.component('meVerifyComponent', MeVerifyComponent);
mod.component('meVerifyProviderCompanyComponent', MeVerifyProviderCompanyComponent);
mod.component('meVerifyProviderGpsComponent', MeVerifyProviderGpsComponent);
mod.component('meVerifyProviderDocumentComponent', MeVerifyProviderDocumentComponent);
mod.component('meVerifyProviderResidencyComponent', MeVerifyProviderResidencyComponent);
mod.component('meVerifyProviderOtcComponent', MeVerifyProviderOtcComponent);
mod.component('meVerifyProviderNpoComponent', MeVerifyProviderNpoComponent);
mod.component('meVerifyProviderNpoStatuteComponent', MeVerifyProviderNpoStatuteComponent);
mod.component('meVerifyProviderNpoMemorandumComponent', MeVerifyProviderNpoMemorandumComponent);
mod.component('meVerifyProviderNpoAdminsComponent', MeVerifyProviderNpoAdminsComponent);
