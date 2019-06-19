import * as angular from 'angular';

/** List of wallet of an user */
function WalletListController ($rootScope, $api, $browserHelper) {
	const self = this;

	/* FIELDS */

	angular.extend(self, {
		services: { $browserHelper: $browserHelper },
		responseMessage: {},
		wallets: [],
		adminof: [],
		selected: null,
		error: ''
	});

	/* METHODS */

	self.reload = function () {
		$api.wallet.list()
			.then(function (res) {
				self.wallets = res.data.wallets;
				self.adminof = res.data.adminof;

				if (self.onlyUsable) {
					self.wallets = self.wallets.filter(function (w) {
						if ((w.ismultisig && w.multisig.active) || !w.ismultisig)
							return true;
						else
							return false;
					});
					self.adminof = [];
				}

				if (self.receiveaddress !== undefined)
					self.receiveaddress = res.data.receiveaddress;

				$rootScope.$emit('loadedWallets', { wallets: self.wallets, receiveaddress: self.receiveaddress, adminof: self.adminof });
			})
			.catch(function (res) {
				self.error = res.data.error;
			});
	};

	/* EVENTS */

	const cleanupReloadWallets = $rootScope.$on('reloadWallets', function (event) {
		self.reload();
	});

	/* DESTROY */

	self.$onDestroy = function () {
		if(cleanupReloadWallets)
			cleanupReloadWallets();
	};

	/* INITIALIZATION */

	self.$onInit = function () {
		if (self.onlyUsable === undefined)
			self.onlyUsable = false;
		else
			self.onlyUsable = true;

		if (self.footer === undefined)
			self.footer = false;

		self.reload();
	};
};

WalletListController.$inject = ['$rootScope', '$api', '$browserHelper'];

const WalletListComponent = {
	templateUrl: 'components/dashboard/wallet-list/wallet-list.html',
	controller: WalletListController,
	bindings: {
		receiveaddress: '=',
		receive: '=',
		select: '=',
		withdraw: '=',
		settings: '=',
		new: '=',
		deposit: '=',
		footer: '@',
		onlyUsable: '@?'
	}
};

export default WalletListComponent;