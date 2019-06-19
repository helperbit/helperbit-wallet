import * as angular from 'angular';

function MeWalletRestoreCtrl($location, $cookies, $bitcoin, $api, $translate, WizardHandler, $routeParams, $timeout) {
	const self = this;

	angular.extend(self, {
		pageHeader: {
			description: {
				title: $translate.getString('wallet restore'),
				subTitle: $translate.getString('Restore a wallet from backup file')
			}
		},
		restoreWalletModel: {
			username: $cookies.get('username'),
			values: {
				txid: '', 
				loading: false, 
				file: null, 
				data: null, 
				password: '', 
				destination: '',
				error: {
					type: 'error',
					error: null
				}
			},
			step1: {
				title: {
					main: $translate.getString('restore'),
					heading: $translate.getString('Restore your funds')
				},
				loadBackupFile: function (file) {
					$timeout(function () { self.restoreWalletModel.values.error.error = ''; });
					self.restoreWalletModel.values.file = file;
			
					if (file === null) {
						self.restoreWalletModel.values.data = null;
						return;
					}
			
					const reader = new FileReader();
			
					reader.onload = function (event: any) {
						const data = event.target.result;
						try {
							self.restoreWalletModel.values.data = JSON.parse(data);
						} catch (err) {
							return $timeout(function () { self.restoreWalletModel.values.error.error = 'XNJ'; });
						}
					};
					reader.readAsText(file);
				},
				restoreBackup: function () {
					$timeout(function () { self.restoreWalletModel.values.error.error = ''; });

					/* Errors */
					if (self.restoreWalletModel.values.balance === 0.0)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XEW'; });

					if (self.restoreWalletModel.values.file === null)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XNF'; });

					if (self.restoreWalletModel.values.data === null)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XNJ'; });

					if (!('encprivkey' in self.restoreWalletModel.values.data) ||
						!('address' in self.restoreWalletModel.values.data) ||
						!('pubkey' in self.restoreWalletModel.values.data)) 
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XNJ'; });

					if (self.restoreWalletModel.values.wallet.address != self.restoreWalletModel.values.data.address)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XWA'; });

					/* Decrypt the key */
					const keys = $bitcoin.decryptKeys(self.restoreWalletModel.values.data.encprivkey, self.restoreWalletModel.values.password);
					if (keys == null)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XWP'; });

					if (keys.public != self.restoreWalletModel.values.data.pubkey)
						return $timeout(function () { self.restoreWalletModel.values.error.error = 'XWP'; });

					self.restoreWalletModel.values.loading = true;

					const wreq = {
						fee: $bitcoin.evaluteFee(2, 1, true),
						value: self.restoreWalletModel.values.balance, 
						destination: self.restoreWalletModel.values.destination
					};

					wreq.value = wreq.value - wreq.fee - 0.00000001;

					/* Send the refund transaction */
					$api.wallet.withdraw(self.restoreWalletModel.values.wallet.address, wreq).then(function (res) {
						$bitcoin.sign(res.data.txhex, {
							scripttype: self.restoreWalletModel.values.wallet.scripttype,
							wif: keys.private,
							utxos: res.data.utxos,
							pubkeys: self.restoreWalletModel.values.wallet.pubkeys
						}).then (txhex => {
							$api.wallet.send(self.restoreWalletModel.values.wallet.address, txhex).then(function (res) {
								self.restoreWalletModel.values.txid = res.data.txid;

								/* Delete the empty wallet */
								/*$http.post (config.apiUrl + '/wallet/' + self.restoreWalletModel.values.wallet.address + '/update', {delete: true}).success (function (data) {
									self.restoreWalletModel.values.loading = false;
									$scope.reloadWallet ();
								}).error (function (data){
									self.restoreWalletModel.values.error.error = data.error;
									self.restoreWalletModel.values.loading = false;
								});
								*/
								self.restoreWalletModel.values.loading = false;
								WizardHandler.wizard('restoreWallet').next();
							});
						}).catch (err => {
							return $timeout(function () { 
								self.restoreWalletModel.values.error.error = 'E';
								self.restoreWalletModel.values.loading = false;
							});
						});
					}).catch(function (res) {
						return $timeout(function () { 
							res.data.type = 'error';
							self.restoreWalletModel.values.error = res.data;
							self.restoreWalletModel.values.loading = false;
						});
					});
				}
			},
			step2: {
				title: {
					main: $translate.getString('Done'),
					heading: $translate.getString('Done')
				}
			}
		}
	});
	
	self.$onInit = function () {
		$api.wallet.get($routeParams.address).then(res => {
			self.restoreWalletModel.values.wallet = res.data;
			$api.wallet.balance(self.restoreWalletModel.values.wallet.address).then(res => {
				self.restoreWalletModel.values.balance = res.data.balance;
			});
		}).catch(err => {
			return $location.path('/me/wallet');
		});
	};
}


MeWalletRestoreCtrl.$inject = ['$location', '$cookies', '$bitcoin', '$api', '$translate', 'WizardHandler', '$routeParams', '$timeout'];

const MeWalletRestoreComponent = {
	templateUrl: 'components/dashboard/wallet/restore/restore.html',
	controller: MeWalletRestoreCtrl
};

export default MeWalletRestoreComponent;