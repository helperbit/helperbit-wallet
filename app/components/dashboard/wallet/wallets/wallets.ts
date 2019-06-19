import * as angular from 'angular';
import * as $ from 'jquery';

/* User profile /me/wallet */
function MeWalletCtrl($scope, $location, $cookies, $routeParams, $rootScope, $uibModal, $api, $anchorScroll, $translate) {
	$scope.rnd = ('' + Math.random()).replace('.', '');
	$scope.username = $cookies.get('username');
	$scope.email = $cookies.get('email');
	$scope.loading = true;
	$scope.wallets = [];
	$scope.adminof = [];
	$scope.faucet = { loading: false, error: '' };
	$scope.settings = { error: '' };
	$scope.remove = { loading: false };
	$scope.receiveaddress = '';
	$scope.qr = '';
	$scope.selected = 'wallet';
	$scope.transactions = [];
	$scope.defaultwallet = {};

	const self = this;

	angular.extend(self, {
		pageHeader: {
			description: {
				title: $translate.getString('wallet'),
				subTitle: $translate.getString('Handle your Bitcoin accounts')
			}
		},
		modals: {
			createDonationButton: {
				id: 'createDonationButtonModal'
			}
		},
		walletsModel: {
		}
	});


	$scope.pageHeader = {
		description: {
			title: $translate.getString('wallet'),
			subTitle: $translate.getString('Handle your Bitcoin accounts')
		}
	};

	$scope.modalConfirmConfig = {
		modalClass: 'modal-md',
		hideCloseButton: true,
		title: null,
		confirm: {
			method: null,
			parameters: null,
			description: null
		}
	};

	self.createDonationButton = function () {
		$('#' + self.modals.createDonationButton.id).modal('show');
	};


	$scope.scrollTo = function (id) {
		$anchorScroll(id);
		$scope.selected = id;
	};

	$scope.reloadWallet = function () {
		$rootScope.$emit('reloadWallets', {});
	};

	$scope.withdraw = function (w) {
		const modalI = $uibModal.open({
			component: 'meWalletWithdrawComponent',
			resolve: {
				modalData: function () {
					return {
						address: w.address
					};
				}
			}
		});

		modalI.result.then(function () {
			$scope.reloadWallet();
		}, function () {
			$scope.reloadWallet();
		});
	};

	$rootScope.$on('loadedWallets', function (event, data) {
		$scope.defaultwallet = data.wallets.filter(function (w) { return w.address == data.receiveaddress; })[0];

		if (data.receiveaddress) {
			$api.wallet.getTransactions(data.receiveaddress).then(function (res) {
				$scope.transactions = res.data.txs;
			});
		}
		
		$scope.wallets = data.wallets;
		$scope.wallets = $scope.wallets.map(function (w) {
			const w1 = w;
			w1.qr = "bitcoin:" + w.address;/*$scope.defaultwallet.address;*/
			return w1;
		});
		$scope.adminof = data.adminof;
	});

	$api.me.get().then(function (res) {
		$scope.user = res.data;
	});

	$scope.reloadWallet();

	/* Update the receiveaddress */
	$scope.receive = function (w) {
		$scope.receiveaddress = w;
		$scope.defaultwallet = $scope.wallets.filter(function (w) { return w.address == $scope.receiveaddress; })[0];
		$api.wallet.updateReceive(w).then(function (res) { });
		$api.wallet.getTransactions(w).then(function (res) {
			$scope.transactions = res.data.txs;
		});
	};

	$scope.faucet = function (w) {
		$scope.faucet.loading = true;
		$api.wallet.faucet(w.address).then(function (res) {
			$scope.faucet.loading = false;
			$scope.reloadWallet();
			$('#depositModal').modal('hide');
			$('#faucetDoneModal').modal('show');
		}).catch(function (res) {
			$scope.faucet.error = res.data.error;
			$scope.faucet.loading = false;
		});
	};

	$scope.openConfirmDeleteWallet = function (wallet) {
		$scope.modalConfirmConfig.confirm.method = $scope.remove;
		$scope.modalConfirmConfig.confirm.parameters = [wallet];
		$scope.modalConfirmConfig.title = $translate.getString('Confirm delete wallet');
		$scope.modalConfirmConfig.confirm.description = $translate.getString('Are you sure to delete') + ' ' + wallet.address + ' ' + $translate.getString('wallet?');

		$('#modalConfirm').modal('show');
	};

	$scope.remove = function (w) {
		$scope.remove.loading = true;

		$api.wallet.delete(w.address).then(function (res) {
			$scope.remove.loading = false;
			$scope.reloadWallet();
			$('#settingsModal').modal('hide');
		}).catch(function (res) {
			$scope.settings.error = res.data.error;
			$scope.remove.loading = false;
		});
	};

	$scope.update = function (w) {
		$api.wallet.updateLabel(w.address, w.label).then(function (res) {
			$scope.reloadWallet();
			$('#settingsModal').modal('hide');
		}).catch(function (res) {
			$scope.settings.error = res.data.error;
		});
	};


	$scope.deposit = function (w) {
		$scope.selectedwallet = w;
		$scope.faucet.error = '';
		$scope.qr = 'bitcoin:' + w.address;

		$('#depositModal').modal('show');

		$api.wallet.getTransactions(w.address).then(function (res) {
			w.txs = res.data.txs;
		});
	};


	$scope.settings = function (w) {
		$scope.remove.loading = false;
		$scope.settings.error = '';
		$scope.selectedwallet = w;
		$scope.backup = { txid: '', loading: false, file: null, data: null, password: '', destination: '', error: '' };
		$('#settingsModal').modal('show');
	};


	/* Backward compatibility feed multisig */
	if ('feed_multisig' in $routeParams) {
		$location.path('/me/wallet/feed').search({
			wallet: $routeParams['feed_multisig'],
			organization: $routeParams['organization'],
			label: $routeParams['label']
		});
	}
}

MeWalletCtrl.$inject = ['$scope', '$location', '$cookies', '$routeParams', '$rootScope', '$uibModal', '$api', '$anchorScroll', '$translate'];

const MeWalletComponent = {
	templateUrl: 'components/dashboard/wallet/wallets/wallets.html',
	controller: MeWalletCtrl
};

export default MeWalletComponent;