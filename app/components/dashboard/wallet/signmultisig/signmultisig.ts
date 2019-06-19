import * as angular from 'angular';
import * as $ from 'jquery';

/* User profile /me/wallet */
function MeWalletSignMultisigCtrl($rootScope, $api, $bitcoin, $bitcoinLedger, $translate, WizardHandler, $cookies, $timeout) {
	const self = this;

	angular.extend(self, {
		signMultisigModel: {
			username: $cookies.get('username'),
			email: $cookies.get('email'),
			values: {
				hardware: false,
				hardwareType: 'none',
				transactions: [],
				selected: null,
				mnemonic: '',
				rors: {},
				refused: false,
				useBackup: false,
				backup: {
					password: '',
					file: null,
					data: null
				}
			},
			step1: {
				title: {
					main: $translate.getString('Transactions'),
					heading: $translate.getString('Multisig transaction to sign')
				},
				selectTransaction: function (tx) {
					self.signMultisigModel.values.selected = tx;
					self.signMultisigModel.values.mnemonic = '';
					self.signMultisigModel.values.refused = false;
					self.signMultisigModel.values.hardware = false;
					self.signMultisigModel.values.hardwareType = 'none';

					if ('hardwareadmins' in self.signMultisigModel.values.selected && self.signMultisigModel.values.selected.hardwareadmins.indexOf(self.signMultisigModel.email) != -1) {
						self.signMultisigModel.values.hardware = true;
						self.signMultisigModel.values.hardwareType = self.signMultisigModel.values.selected.hardwaretypes[self.signMultisigModel.values.selected.hardwareadmins.indexOf(self.signMultisigModel.email)];
					}

					WizardHandler.wizard('signMultisig').next();	
				}
			},
			step2: {
				loading: false,
				error: {
					type: 'error',
					text: null,
					error: null
				},
				ledgerWaitStatus: {
					phase: 0,
					status: 'wait',
					exec: () => {},
					button: false
				},
				title: {
					main: $translate.getString('Sign'),
					heading: $translate.getString('Sign a transaction')
				},
				loadBackupFile: function (file) {
					self.signMultisigModel.step2.error.error = '';
					self.signMultisigModel.values.backup.file = file;

					if (file === null) {
						self.signMultisigModel.values.backup.data = null;
						return;
					}

					const reader = new FileReader();

					reader.onload = function (event: any) {
						const data = event.target.result;
						self.signMultisigModel.values.backup.data = JSON.parse(data);
					};
					reader.readAsText(file);
				},
				refuse: function () {
					$api.wallet.multisig.signRefuse(self.signMultisigModel.values.selected._id).then(function (res) {
						self.signMultisigModel.values.refused = true;
						WizardHandler.wizard('signMultisig').next();
					}).catch(function (res) { 
						return $timeout(function () { 
							self.signMultisigModel.step2.error.error = 'E';
						});
					});
				},
				sign: function () {
					const ledgerWaitCallback = (phase, status) => { 
						$timeout(() => {
							self.withdrawModel.step2.ledgerWaitStatus.phase = phase; 
							self.withdrawModel.step2.ledgerWaitStatus.status = status; 
						});
					};
					let keys;
					let upair;
			
					self.signMultisigModel.step2.error.error = '';

					/* Sign with hardware */
					if (self.signMultisigModel.values.hardware) {

					}
					/* Sign with mnemonic */
					else if (!self.signMultisigModel.values.useBackup) {
						keys = $bitcoin.mnemonicToKeys(self.signMultisigModel.values.mnemonic);

						if ($.inArray(keys.public, self.signMultisigModel.values.selected.pubkeys) == -1) {
							return $timeout(function () { 
								self.signMultisigModel.step2.error.error = 'XIM';
							});
						}
					}
					/* Sign with backup file */
					else {
						/* Errors */
						if (self.signMultisigModel.values.backup.file === null) {
							return $timeout(function () { 
								self.signMultisigModel.step2.error.error = 'XNF';
							});
						}
			
						if (self.signMultisigModel.values.backup.data === null) {
							return $timeout(function () { 
								self.signMultisigModel.step2.error.error = 'XNJ';
							});
						}
			
						if (!('encprivkey' in self.signMultisigModel.values.backup.data) ||
							!('walletid' in self.signMultisigModel.values.backup.data) ||
							!('pubkey' in self.signMultisigModel.values.backup.data)) {
							return $timeout(function () { 
								self.signMultisigModel.step2.error.error = 'XNJ';
							});
						}
			
						keys = $bitcoin.decryptKeys(self.signMultisigModel.values.backup.data.encprivkey, self.signMultisigModel.values.backup.password);
			
						if (keys == null) {
							return $timeout(function () { 
								self.signMultisigModel.step2.error.error = 'XWAP';
							});
						}
					}

					self.signMultisigModel.step2.loading = true;

					/* Request the updated tx */
					$api.wallet.multisig.getTransactions().then(function (res) {
						const data = res.data;
						for (let i = 0; i < data.txs.length; i++) {
							if (data.txs[i].txid == self.signMultisigModel.values.selected.txid)
								self.signMultisigModel.values.selected = data.txs[i];
						}
			
						/* Put the signature */
						if (self.signMultisigModel.values.hardware && self.signMultisigModel.values.hardwareType == 'ledgernanos') {
							$bitcoinLedger.sign(self.signMultisigModel.values.selected.hex, {
								scripttype: self.signMultisigModel.values.selected.scripttype,
								utxos: self.signMultisigModel.values.selected.utxos,
								n: self.signMultisigModel.values.selected.n,
								complete: false,
								pubkeys: self.signMultisigModel.values.selected.pubkeys
							}, ledgerWaitCallback).then (txhex => {
								$api.wallet.multisig.sign(self.signMultisigModel.values.selected._id, txhex).then(function (res) {
									$rootScope.$emit('notificationUpdate', { from: 'wallet' });
									WizardHandler.wizard('signMultisig').next();

									return $timeout(function () { 
										self.signMultisigModel.step2.loading = false;
										self.$onInit();
									});
								}).catch(function (res) {
									return $timeout(function () { 
										self.signMultisigModel.step2.error.error = 'E';
										self.signMultisigModel.step2.loading = false;
									});
								});
							}).catch (err => {
								return $timeout(function () { 
									self.signMultisigModel.step2.error.error = 'XHW1';
									self.signMultisigModel.step2.loading = false;
								});
							});
						} else if (!self.signMultisigModel.values.hardware) {
							$bitcoin.sign(self.signMultisigModel.values.selected.hex, {
								scripttype: self.signMultisigModel.values.selected.scripttype,
								wif: self.signMultisigModel.values.hardware ? null : keys.private,
								utxos: self.signMultisigModel.values.selected.utxos,
								n: self.signMultisigModel.values.selected.n,
								complete: false,
								pubkeys: self.signMultisigModel.values.selected.pubkeys
							}).then (txhex => {
								$api.wallet.multisig.sign(self.signMultisigModel.values.selected._id, txhex).then(function (res) {
									$rootScope.$emit('notificationUpdate', { from: 'wallet' });
									WizardHandler.wizard('signMultisig').next();

									return $timeout(function () { 
										self.signMultisigModel.step2.loading = false;
										self.$onInit();
									});
								}).catch(function (res) {
									return $timeout(function () { 
										self.signMultisigModel.step2.error.error = 'E';
										self.signMultisigModel.step2.loading = false;
									});
								});
							}).catch (err => {
								return $timeout(function () { 
									self.signMultisigModel.step2.error.error = 'E';
									self.signMultisigModel.step2.loading = false;
								});
							});
						}
					});
				}
			},
			step3: {
				title: {
					main: $translate.getString('Done')
				}
			}
		}
	});

	self.openModal = function () {
		$('#signModal').modal('show');
	};


	self.$onInit = function () {
		$api.wallet.multisig.getTransactions().then(function (res) {
			const txs = res.data.txs;
			self.signMultisigModel.values.rors = {};

			self.signMultisigModel.values.transactions = txs.filter (tx => 
				tx.status == 'signing' && self.signMultisigModel.username != tx.from && tx.signers.indexOf(self.signMultisigModel.email) == -1
			);
			self.signMultisigModel.values.transactions.forEach(tx => {
				if (tx.ror) {
					$api.ror.get(tx.ror, true).then(function (res) {
						self.signMultisigModel.values.rors[res.data._id] = res.data;
					});
				}
			});

			if (self.signMultisigModel.values.transactions.length > 0) {
				self.openModal();
			}
		});
	};
}

MeWalletSignMultisigCtrl.$inject = ['$rootScope', '$api', '$bitcoin', '$bitcoinLedger', '$translate', 'WizardHandler', '$cookies', '$timeout'];


const MeWalletSignMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/signmultisig/signmultisig.html',
	controller: MeWalletSignMultisigCtrl
};

export default MeWalletSignMultisigComponent;