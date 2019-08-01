import BrowserHelperService from '../../../services/browser-helper';
import WalletService from '../../../models/wallet';

export type WalletListConfig = {
	wallets?: any[];
	adminof?: any[];
	receiveaddress?: string;
	select?: (w: any) => void;
	settings?: (w: any) => void;
	new?: (w: any) => void;
	withdraw?: (w: any) => void;
	deposit?: (w: any) => void;
	receive?: (w: any) => void;
	footer?: boolean;
	onlyUsable?: boolean;
};


/** List of wallet of an user */
class WalletListController {
	$browserHelper: BrowserHelperService;
	$walletService: WalletService;

	config: WalletListConfig;
	selected?: any;
	error: string;
	cleanupReloadWallets: () => void;

	constructor($walletService, $browserHelper) {
		this.$walletService = $walletService;
		this.$browserHelper = $browserHelper;

		this.selected = null;
		this.error = '';
	}

	reload() {
		this.$walletService.getList().then((list) => {
			this.config.wallets = list.wallets;
			this.config.adminof = list.adminof;

			if (this.config.onlyUsable) {
				this.config.wallets = this.config.wallets.filter((w) => {
					if ((w.ismultisig && w.multisig.active) || !w.ismultisig)
						return true;
					else
						return false;
				});
				this.config.adminof = [];
			}

			if (this.config.receiveaddress !== undefined)
				this.config.receiveaddress = list.receiveaddress;

			this.$walletService.emitLoad({ wallets: this.config.wallets, receiveaddress: this.config.receiveaddress, adminof: this.config.adminof });
		}).catch((res) => {
			this.error = res.data.error;
		});
	}

	$onDestroy() {
		this.cleanupReloadWallets();
	}

	$onInit() {
		if (this.config.onlyUsable === undefined)
			this.config.onlyUsable = false;
		else
			this.config.onlyUsable = true;

		if (this.config.footer === undefined)
			this.config.footer = false;


		this.cleanupReloadWallets = this.$walletService.onReload(() => { this.reload(); });
		this.reload();
	}

	static get $inject() { return ['$walletService', '$browserHelper']; }
}

const WalletListComponent = {
	templateUrl: 'components/dashboard/wallet-list/wallet-list.html',
	controller: WalletListController,
	controllerAs: '$ctrl',
	bindings: {
		config: '<',
	}
};

export default WalletListComponent;