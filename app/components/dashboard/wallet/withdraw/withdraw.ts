import * as angular from 'angular';

function MeWalletWithdrawCtrl($timeout, config, $rootScope, $bitcoin, $bitcoinLedger, $api, WizardHandler, $translate) {
	const self = this;
	const modalData = self.resolve.modalData;

	angular.extend (self, {
		mtype: 'withdraw',
		wallet: null,
		values: {
			fee: 0.0, 
			feeprofile: 'fastest',
			fees: null,
			value: config.minDonation,
			vvalue: 0.0,
			description: '',
			txid: null
		},

		withdrawMultisigModel: {
			step1: {
				error: { type: 'error', error: null },
				title: {
					main: $translate.getString('Send')
				},
			},
			step2: {
				loading: false,
				error: { type: 'error', error: null },
				title: {
					main: $translate.getString('Summary')
				},
				back: function () {
					WizardHandler.wizard('withdrawMultisig').previous();
				},
				withdrawMultisigDo: function () {
					self.withdrawMultisigModel.step2.loading = true;

					const wreq = {
						fee: self.values.fee,
						value: self.values.vvalue,
						destination: self.values.destination,
						description: self.values.description,
					};
			
					if ('ror' in modalData)
						wreq['ror'] = modalData.ror;
			
			
					$api.wallet.withdraw(self.wallet.address, wreq).then(function (res) {
						self.withdrawMultisigModel.step2.loading = false;
						$rootScope.$emit('notificationUpdate', { from: 'wallet' });
						WizardHandler.wizard('withdrawMultisig').next();
					}).catch(function (res) {
						res.data.type = 'error';
						self.withdrawMultisigModel.step2.loading = false;
						self.withdrawMultisigModel.step2.error = res.data;
					});
				}
			},
			step3: {
				title: {
					main: $translate.getString('Done')
				},

			}
		},
		withdrawModel: {
			values: { 
				mnemonic: '',
				hardware: false,
				hardwareType: 'none'
			},
			step1: {
				loading: false,
				error: { type: 'error', error: null },
				title: {
					main: $translate.getString('Send')
				},

				eventDonate: function () {
					const keys = $bitcoin.mnemonicToKeys(self.withdrawModel.values.mnemonic);

					if ($.inArray(keys.public, self.wallet.pubkeys) == -1) {
						return $timeout(function () {
							self.withdrawModel.step1.error.error = 'XIM';
							self.withdrawModel.step1.loading = false;
						});
					}

					self.withdrawModel.step1.loading = true;
					self.values.value = parseFloat(self.values.value);

					const donreq = {
						address: self.wallet.address,
						value: self.values.value,
						users: self.distribution,
						fee: self.values.fee
					};

					$api.donation.createEventDonation(self.event, donreq).then(function (res) {
						if (self.withdrawModel.values.hardware) {
							$bitcoinLedger.sign(res.data.txhex, {
								scripttype: self.wallet.scripttype,
								seed: self.withdrawModel.step1.values.mnemonic,
								utxos: res.data.utxos,
								pubkeys: self.wallet.pubkeys
							}).then (txhex => {
								$api.wallet.sendDonation(self.wallet.address, res.data.donation, txhex)
									.then(function (res) {
										self.values.txid = res.data.txid;
										self.withdrawModel.step1.loading = false;
										WizardHandler.wizard('withdrawSingle').next();
									})
									.catch(function (res) {
										res.data.type = 'error';
										self.withdrawModel.step1.error = res.data;
										self.withdrawModel.step1.loading = false;
									});
							}).catch (err => {
								console.log (err);
							});
						} else {
							$bitcoin.sign(res.data.txhex, {
								scripttype: self.wallet.scripttype,
								seed: self.withdrawModel.step1.values.mnemonic,
								utxos: res.data.utxos,
								pubkeys: self.wallet.pubkeys
							}).then (txhex => {
								$api.wallet.sendDonation(self.wallet.address, res.data.donation, txhex)
									.then(function (res) {
										self.values.txid = res.data.txid;
										self.withdrawModel.step1.loading = false;
										WizardHandler.wizard('withdrawSingle').next();
									})
									.catch(function (res) {
										res.data.type = 'error';
										self.withdrawModel.step1.error = res.data;
										self.withdrawModel.step1.loading = false;
									});
							}).catch (err => {
								console.log (err);
							});
						}
					}).catch(function (res) {
						res.data.type = 'error';
						self.withdrawModel.step1.error = res.data;
						self.withdrawModel.step1.loading = false;
					});
				}
			},
			step2: {
				error: { type: 'error', error: null },
				loading: false,
				ledgerWaitStatus: {
					phase: 0,
					status: 'wait',
					button: false,
					exec: () => {}
				},
				title: {
					main: $translate.getString('Summary')
				},
				back: function () {
					WizardHandler.wizard('withdrawSingle').previous();
				},
				withdrawDo: function () {
					const ledgerWaitCallback = (phase, status) => { 
						$timeout(() => {
							self.withdrawModel.step2.ledgerWaitStatus.phase = phase; 
							self.withdrawModel.step2.ledgerWaitStatus.status = status; 
						});
					};

					self.withdrawModel.step2.loading = true;

					let keys = null;

					if (!self.withdrawModel.values.hardware) {
						keys = $bitcoin.mnemonicToKeys(self.withdrawModel.values.mnemonic);

						if ($.inArray(keys.public, self.wallet.pubkeys) == -1) {
							return $timeout(function () {
								self.withdrawModel.step2.error.error = 'XIM';
								self.withdrawModel.step2.loading = false;
							});
						}
					}

					const wreq = {
						fee: self.values.fee,
						value: self.values.vvalue,
						destination: self.values.destination
					};

					$api.wallet.withdraw(self.wallet.address, wreq).then(function (res) {
						if (self.withdrawModel.values.hardware && self.withdrawModel.values.hardwareType == 'ledgernanos') {
							$bitcoinLedger.sign(res.data.txhex, {
								scripttype: self.wallet.scripttype,
								utxos: res.data.utxos,
								pubkeys: self.wallet.pubkeys
							}, ledgerWaitCallback).then (txhex => {
								$api.wallet.send(self.wallet.address, txhex, self.donation).then(function (res) {
									WizardHandler.wizard('withdrawSingle').next();
									return $timeout(function () { 
										self.values.txid = res.data.txid;
										self.withdrawModel.step2.loading = false;
									});
								}).catch(function (res) {
									return $timeout(function () { 
										self.withdrawModel.step2.error = res.data;
										self.withdrawModel.step2.loading = false;
									});
								});
							}).catch (err => {
								console.log(err);
								return $timeout(function () { 
									// self.withdrawModel.step2.error.error = 'E';
									self.withdrawModel.step2.loading = false;
								});
							});
						} else if (!self.withdrawModel.values.hardware) {
							$bitcoin.sign(res.data.txhex, {
								scripttype: self.wallet.scripttype,
								seed: self.withdrawModel.values.mnemonic,
								utxos: res.data.utxos,
								pubkeys: self.wallet.pubkeys
							}).then (txhex => {
								$api.wallet.send(self.wallet.address, txhex, self.donation).then(function (res) {
									WizardHandler.wizard('withdrawSingle').next();
									return $timeout(function () { 
										self.values.txid = res.data.txid;
										self.withdrawModel.step2.loading = false;
									});
								}).catch(function (res) {
									return $timeout(function () { 
										self.withdrawModel.step2.error = res.data;
										self.withdrawModel.step2.loading = false;
									});
								});
							}).catch (err => {
								console.log(err);
								return $timeout(function () { 
									self.withdrawModel.step2.error.error = 'E';
									self.withdrawModel.step2.loading = false;
								});
							});
						}
					}).catch(function (res) {
						self.withdrawModel.step2.error = res.data;
						self.withdrawModel.step2.loading = false;
					});
				}
			},
			step3: {
				title: {
					main: $translate.getString('Done')
				},
			}
		}
	})


	self.cancel = function () {
		self.dismiss({ $value: 'cancel' });
	};

	self.close = function (txid) {
		self.close({ $value: txid });
	};


	self.withdrawFeeDo = function () {
		if (!$bitcoin.checkAddress(self.values.destination)) {
			return $timeout(function () {
				self.withdrawModel.step1.error.error = 'EW2';
				self.withdrawMultisigModel.step1.error.error = 'EW2';
			});
		}

		self.withdrawModel.step1.loading = true;
		self.withdrawMultisigModel.step1.loading = true;

		self.values.value = parseFloat(self.values.value);

		const wreq = {
			value: self.values.value,
			destination: self.values.destination
		};

		/* Check the mnemonic (for single/company wallets) */
		if (!self.wallet.ismultisig && !self.wallet.hardware) {
			const keys = $bitcoin.mnemonicToKeys(self.withdrawModel.values.mnemonic);

			if ($.inArray(keys.public, self.wallet.pubkeys) == -1) {
				return $timeout(function () {
					self.withdrawModel.step1.error.error = 'XIM';
					self.withdrawModel.step1.loading = false;
				});
			}
		}

		/* Get the fees for this withdraw */
		$api.wallet.withdrawFees(self.wallet.address, self.values.destination, self.values.value)
			.then(function (res) {
				self.values.fee = parseFloat(res.data.fastest) / 100000000;
				self.values.feeprofile = 'fastest';
				
				if (self.wallet.ismultisig) {
					WizardHandler.wizard('withdrawMultisig').next();
					self.withdrawMultisigModel.step1.loading = false;
				} else {
					WizardHandler.wizard('withdrawSingle').next();
					self.withdrawModel.step1.loading = false;
				}

				self.values.fees = {
					fastest: parseFloat(res.data.fastest) / 100000000,
					halfhour: parseFloat(res.data.halfhour) / 100000000,
					hour: parseFloat(res.data.hour) / 100000000,
					slowest: parseFloat(res.data.slowest) / 100000000
				};

				self.values.vvalue = self.values.value;
				if ((self.values.vvalue + self.values.fee) > self.balance.balance + self.balance.unconfirmed)
					self.values.vvalue = self.balance.balance + self.balance.unconfirmed - self.values.fee;
			}).catch(function (res) {
				res.data.type = 'error';
				if (self.wallet.ismultisig) {
					self.withdrawMultisigModel.step1.error = res.data;
					self.withdrawMultisigModel.step1.loading = false;
				} else {
					self.withdrawModel.step1.error = res.data;
					self.withdrawModel.step1.loading = false;
				}
			});
	};

	self.changedFeeProfile = function () {
		self.values.fee = self.values.fees[self.values.feeprofile];

		if (self.mtype != 'eventdonation') {
			self.values.vvalue = self.values.value;
			if ((self.values.vvalue + self.values.fee) > self.balance.balance + self.balance.unconfirmed)
				self.values.vvalue = self.balance.balance + self.balance.unconfirmed - self.values.fee;
		}
	};



	self.removeMultisigTransaction = function (txid) {
		$api.wallet.multisig.delete(txid).then(function (res) {
			self.cancel();
		});
	};


	self.$onInit = function () {
		$api.wallet.get(modalData.address).then(function (res) {
			self.wallet = res.data;

			$api.wallet.balance(modalData.address).then(function (res) {
				self.balance = res.data;
			});
			self.withdrawModel.values.hardware = ['ledgernanos'].indexOf(self.wallet.hardware || 'none') != -1;
			self.withdrawModel.values.hardwareType = self.wallet.hardware;

			if ('destination' in modalData)
				self.fixedDestination = modalData.destination;

			if ('mtype' in modalData)
				self.mtype = modalData.mtype;

			if ('donation' in modalData)
				self.donation = modalData.donation;

			if ('value' in modalData)
				self.fixedValue = modalData.value;

			if ('description' in modalData)
				self.fixedDescription = modalData.description;

			if ('distribution' in modalData) {
				self.distribution = modalData.distribution;
				self.distributionn = Object.keys(self.distribution).length;
			}

			if ('event' in modalData)
				self.event = modalData.event;


			if (self.fixedDestination)
				self.values.destination = self.fixedDestination;
		
			if (self.fixedValue)
				self.values.value = parseFloat(self.fixedValue);
		
			if (self.fixedDescription)
				self.values.description = self.fixedDescription;
		
			$api.wallet.getTransactions(self.wallet.address).then(function (res) {
				self.wallet.txs = res.data.txs;
			});
		
			if (self.wallet.ismultisig) {
				$api.wallet.multisig.getTransactions().then(function (res) {
					self.wallet.pendingtxs = res.data.txs;
				});
			}

			if (self.mtype == 'eventdonation') {
				$api.wallet.withdrawDistributionFees(self.wallet.address, self.distribution, self.values.value)
					.then(function (res) {
						self.values.fee = parseFloat(res.data.fastest) / 100000000;
						self.values.feeprofile = 'fastest';
						self.values.fees = {
							fastest: parseFloat(res.data.fastest) / 100000000,
							halfhour: parseFloat(res.data.halfhour) / 100000000,
							hour: parseFloat(res.data.hour) / 100000000,
							slowest: parseFloat(res.data.slowest) / 100000000
						};
					});
			}
		});
	};
}

MeWalletWithdrawCtrl.$inject = ['$timeout', 'config', '$rootScope', '$bitcoin', '$bitcoinLedger', '$api', 'WizardHandler', '$translate'];


const MeWalletWithdrawComponent = {
	templateUrl: 'components/dashboard/wallet/withdraw/withdraw.html',
	controller: MeWalletWithdrawCtrl,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};

export default MeWalletWithdrawComponent;