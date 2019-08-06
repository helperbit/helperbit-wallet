import * as angular from 'angular';
import * as $ from 'jquery';
import { PageHeaderConfig } from '../../../../shared/components/page-header/page-header';
import { ModalsConfig } from '../../../../shared/components/modal/modal';
import TranslateService from '../../../../services/translate';
import { ConfigService } from '../../../../app.config';
import { WalletListConfig } from '../../wallet-list/wallet-list';
import { IModalService } from 'angular-ui-bootstrap';
import WalletService, { WalletTransaction, Wallet } from '../../../../models/wallet';
import DashboardService, { UserPrivate } from '../../../../models/dashboard';
import { AnchorScrollService } from '../../../../shared/types/anchor-scroll';

/* User profile /me/wallet */
class MeWalletCtrl {
	config: ConfigService;
	$uibModal: IModalService;
	$location: angular.ILocationService;
	$translate: TranslateService;
	$dashboardService: DashboardService;
	$anchorScroll: AnchorScrollService;
	$walletService: WalletService;
	$routeParams: {
		feed_multisig?: string;
		organization?: string;
		label?: string;
	};

	pageHeader: PageHeaderConfig;
	modals: ModalsConfig;
	walletList: WalletListConfig;
	user: UserPrivate;
	adminof: Wallet[];
	faucet: { loading: boolean; error: string };
	remove: { loading: boolean };
	qr: string;
	selected: string;
	transactions: WalletTransaction[];
	defaultwallet: Wallet;
	settings: { error: string };
	selectedwallet: Wallet;
	backup: any;

	constructor($location, $routeParams, $walletService, $uibModal, $dashboardService, $anchorScroll, $translate, config) {
		this.config = config;
		this.$uibModal = $uibModal;
		this.$location = $location;
		this.$walletService = $walletService;
		this.$routeParams = $routeParams;
		this.$dashboardService = $dashboardService;
		this.$anchorScroll = $anchorScroll;
		this.$translate = $translate;

		this.adminof = [];
		this.faucet = { loading: false, error: '' };
		this.settings = { error: '' };
		this.remove = { loading: false };
		this.qr = '';
		this.selected = 'wallet';
		this.transactions = [];
		this.defaultwallet = null;

		this.walletList = {
			wallets: [],
			footer: true,
			receiveaddress: '',
			receive: w => this.receive(w),
			withdraw: w => this.withdraw(w),
			deposit: w => this.deposit(w),
			settings: w => this.walletSettings(w)
		};

		this.pageHeader = {
			description: {
				title: $translate.getString('wallet'),
				subTitle: $translate.getString('Handle your Bitcoin accounts')
			}
		};

		this.modals = {
			modalConfirmConfig: {
				id: 'modalConfirm',
				modalClass: 'modal-md',
				hideCloseButton: true,
				title: null,
				confirm: {
					method: null,
					parameters: null,
					description: null
				}
			}
		};
	}

	createDonationButton() {
		$('#createDonationButtonModal').modal('show');
	}

	scrollTo(id) {
		this.$anchorScroll(id);
		this.selected = id;
	}

	reloadWallet() {
		this.$walletService.emitReload();
	}

	withdraw(w) {
		const modalI = this.$uibModal.open({
			component: 'meWalletWithdrawComponent',
			size: 'lg',
			resolve: { modalData: () => ({ address: w.address }) }
		});

		modalI.result.then(() => { this.reloadWallet(); }, () => { this.reloadWallet(); });
	}

	receive(w) {
		this.walletList.receiveaddress = w;
		this.walletList = { ...this.walletList };
		this.defaultwallet = this.walletList.wallets.filter((w) => { return w.address == this.walletList.receiveaddress; })[0];
		this.$walletService.updateReceive(w).then(_ => { });
		this.$walletService.getTransactions(w).then(txs => {
			this.transactions = txs;
		});
	}

	getFaucet(w) {
		this.faucet.loading = true;
		this.$walletService.getFaucet(w.address).then(_ => {
			this.faucet.loading = false;
			this.reloadWallet();
			$('#depositModal').modal('hide');
			$('#faucetDoneModal').modal('show');
		}).catch((res) => {
			this.faucet.error = res.data.error;
			this.faucet.loading = false;
		});
	}

	openConfirmDeleteWallet(wallet) {
		this.modals.modalConfirmConfig.confirm.method = (w) => { this.removeWallet(w); };
		this.modals.modalConfirmConfig.confirm.parameters = [wallet];
		this.modals.modalConfirmConfig.title = this.$translate.getString('Confirm delete wallet');
		this.modals.modalConfirmConfig.confirm.description = this.$translate.getString('Are you sure to delete') + ' ' + wallet.address + ' ' + this.$translate.getString('wallet?');

		$('#modalConfirm').modal('show');
	}

	removeWallet(w) {
		this.remove.loading = true;

		this.$walletService.delete(w.address).then(_ => {
			this.remove.loading = false;
			this.reloadWallet();
			$('#settingsModal').modal('hide');
		}).catch((res) => {
			this.settings.error = res.data.error;
			this.remove.loading = false;
		});
	}

	update(w) {
		this.$walletService.updateLabel(w.address, w.label).then(_ => {
			this.reloadWallet();
			$('#settingsModal').modal('hide');
		}).catch((res) => {
			this.settings.error = res.data.error;
		});
	}

	deposit(w) {
		this.selectedwallet = w;
		this.faucet.error = '';
		this.qr = 'bitcoin:' + w.address;

		$('#depositModal').modal('show');

		this.$walletService.getTransactions(w.address).then(txs => {
			w.txs = txs;
		});
	}

	walletSettings(w) {
		this.remove.loading = false;
		this.settings.error = '';
		this.selectedwallet = w;
		this.backup = { txid: '', loading: false, file: null, data: null, password: '', destination: '', error: '' };
		$('#settingsModal').modal('show');
	}

	$onInit() {
		this.$walletService.onLoad(data => {
			this.defaultwallet = data.wallets.filter((w) => { return w.address == data.receiveaddress; })[0];

			if (data.receiveaddress) {
				this.$walletService.getTransactions(data.receiveaddress).then((txs) => {
					this.transactions = txs;
				});
			}

			this.walletList.wallets = data.wallets;
			this.walletList.wallets = this.walletList.wallets.map((w) => {
				const w1 = w;
				w1.qr = "bitcoin:" + w.address;/*this.defaultwallet.address;*/
				return w1;
			});
			this.adminof = data.adminof;
			this.walletList = { ...this.walletList };
		});

		this.$dashboardService.get().then(user => {
			this.user = user;
		});

		this.reloadWallet();

		/* Backward compatibility feed multisig */
		if ('feed_multisig' in this.$routeParams) {
			this.$location.path('/me/wallet/feed').search({
				wallet: this.$routeParams['feed_multisig'],
				organization: this.$routeParams['organization'],
				label: this.$routeParams['label']
			});
		}
	}

	static get $inject() { return ['$location', '$routeParams', '$walletService', '$uibModal', '$dashboardService', '$anchorScroll', '$translate', 'config']; }
}

const MeWalletComponent = {
	templateUrl: 'components/dashboard/wallet/wallets/wallets.html',
	controller: MeWalletCtrl
};

export default MeWalletComponent;