import * as angular from 'angular';

function MeWalletNewCtrl($scope, $cookies, $rootScope, $bitcoin, $bitcoinLedger, $api, $window, $translate, WizardHandler, $timeout, $browserHelper) {
	const self = this;

	angular.extend(self, {
		hideIndicators: false,
		pageHeader: {
			description: {
				title: $translate.getString('wallet creation'),
				subTitle: $translate.getString('Create a new wallet to send and receive Bitcoin')
			}
		},
		newWalletModel: {
			username: $cookies.get('username'),
			user: null,
			values: {
				ledgerSupport: $browserHelper.isLedgerSupported(),
				accept: false,
				hardwareWallet: false,
				hardwareWalletType: 'none',
				hardwareWalletPublicKey: null,
				mnemonic: $bitcoin.generateMnemonic(),
				mnemonicConfirmChallenge: [	],
				backupPassword: '',
				backupPasswordRepeat: '',
				scripttype: 'p2sh-p2wsh',
				downloadedBackup: false,
				file: null,
				address: ''
			},
			step0: {
				title: {
					main: $translate.getString('Type'),
					heading: $translate.getString('Choose wallet type')
				},
				selectLedger: function () {
					self.newWalletModel.values.hardwareWallet = true;
					self.newWalletModel.values.hardwareWalletType = 'ledgernanos';
					self.newWalletModel.values.accept = false;	
					WizardHandler.wizard('newWallet').reset();
					$timeout(() => { WizardHandler.wizard('newWallet').next(); });
				},
				selectMnemonic: function () {
					self.newWalletModel.values.hardwareWallet = false;
					self.newWalletModel.values.hardwareWalletType = 'none';
					self.newWalletModel.values.accept = false;	
					WizardHandler.wizard('newWallet').reset();
					$timeout(() => { WizardHandler.wizard('newWallet').next(); });
				}
			},
			step1Passphrase: {
				title: {
					main: $translate.getString('Passphrase'),
					heading: $translate.getString('Generate a random passphrase')
				},
				renewMnemonic: function () {
					self.newWalletModel.values.mnemonic = $bitcoin.generateMnemonic();
				},
				printMnemonic: function () {
					const oldtitle = document.title;
					document.title = 'helperbit_passphrase_' + self.newWalletModel.username + '.pdf';
					$window.print();
					document.title = oldtitle;
				},
				next: function () {
					self.newWalletModel.step2Passphrase.error.type = '';
					const mn2 = self.newWalletModel.values.mnemonic.split(' ');
					const el1 = Math.floor(Math.random() * 4);
					const el2 = Math.floor(Math.random() * 4);
					const el3 = Math.floor(Math.random() * 4);
					self.newWalletModel.values.mnemonicConfirmChallenge = [
						{ index: el1 + 1, correct: mn2[el1], insert: '' },
						{ index: el2 + 5, correct: mn2[4 + el2], insert: '' },
						{ index: el3 + 9, correct: mn2[8 + el3], insert: '' }
					];

					WizardHandler.wizard('newWallet').next();
				},
				previous: function () {
					WizardHandler.wizard('newWallet').previous();
				}
			},
			step1HardwareWallet: {
				loading: false,
				ledgerWaitStatus: {
					phase: 0,
					status: 'wait',
					exec: () => {}
				},
				error: {
					type: null,
					text: null,
					error: null
				},
				title: {
					main: $translate.getString('Hardware Wallet'),
					heading: $translate.getString('Pair your hardware wallet')
				},
				previous: function () {
					WizardHandler.wizard('newWallet').previous();
				},
				pairHardwareWallet: function () {
					const ledgerWaitCallback = (phase, status) => { 
						$timeout(() => {
							self.newWalletModel.step1HardwareWallet.ledgerWaitStatus.phase = phase; 
							self.newWalletModel.step1HardwareWallet.ledgerWaitStatus.status = status; 
						});
					};

					self.newWalletModel.step1HardwareWallet.loading = true;

					$bitcoinLedger.getPublicKey(ledgerWaitCallback).then (pk => {
						return $timeout(function () { 
							self.newWalletModel.step1HardwareWallet.loading = false;
							self.newWalletModel.values.hardwareWalletPublicKey = pk;
							self.newWalletModel.values.accept = true;	
							self.newWalletModel.step1HardwareWallet.error.text = $translate.getString('Hardware Wallet successfully paired');
							self.newWalletModel.step1HardwareWallet.error.type = 'success';
						});
					}).catch (err => {
						return $timeout(function () { 
							self.newWalletModel.values.hardwareWalletPublicKey = null;
							self.newWalletModel.step1HardwareWallet.loading = false;
							// self.newWalletModel.step1HardwareWallet.error.error = 'XHW1';
							// self.newWalletModel.step1HardwareWallet.error.type = 'error';
							console.log('Error:', err);
						});
					});
				},
				next: function () {
					WizardHandler.wizard('newWallet').next();
					WizardHandler.wizard('newWallet').next();
				}
			},
			step2Passphrase: {
				error: {
					type: null,
					error: null
				},
				title: {
					main: $translate.getString('Confirm'),
					heading: $translate.getString('Prove you have written down your passphrase')
				},
				previous: function () {
					WizardHandler.wizard('newWallet').previous();
				},
				next: function () {
					self.newWalletModel.step2Passphrase.error.error = '';

					for (let i = 0; i < self.newWalletModel.values.mnemonicConfirmChallenge.length; i++) {
						if (self.newWalletModel.values.mnemonicConfirmChallenge[i].correct != self.newWalletModel.values.mnemonicConfirmChallenge[i].insert) {	
							return $timeout(function () { 
								self.newWalletModel.step2Passphrase.error.error = 'XM1';
								self.newWalletModel.step2Passphrase.error.type = 'error';
							});
						}
					}
					WizardHandler.wizard('newWallet').next();					
				}
			},
			step3: {
				passwordVisibility: 'password',
				loading: false,
				error: null,
				title: {
					main: $translate.getString('Backup'),
					heading: $translate.getString('Create a signature backup file')
				},
				create: function () {
					self.newWalletModel.step3.loading = true;

					// First key, generated from mnemonic
					let key1: any = {};
					if (self.newWalletModel.values.hardwareWallet) {
						key1 = { public: self.newWalletModel.values.hardwareWalletPublicKey };
					} else {
						key1 = $bitcoin.mnemonicToKeys(self.newWalletModel.values.mnemonic);
					}
			
					// Second key, randomly created
					const key2 = $bitcoin.randomKeys();
			
					// Create the wallet		
					$api.wallet.create(self.newWalletModel.values.scripttype, [key1.public, key2.public], self.newWalletModel.values.hardwareWallet, self.newWalletModel.values.hardwareWalletType).then(function (res) {
						// Give the encrypted key as backup file
						const ee = $bitcoin.encryptKeys(key2.private, self.newWalletModel.values.backupPassword);
						self.newWalletModel.values.address = res.data.address;
						self.newWalletModel.values.file = JSON.stringify({
							user: self.newWalletModel.username, 
							scripttype: self.newWalletModel.values.scripttype, 
							encprivkey: ee, 
							address: res.data.address, 
							pubkey: key2.public,
							pubkeys: [key1.public, key2.public, res.data.pubkeysrv]
						});
						self.newWalletModel.step3.loading = false;
						self.newWalletModel.step3.downloadedBackup = false;
			
						$rootScope.$emit('notificationUpdate', { from: 'wallet' });
						WizardHandler.wizard('newWallet').next();	
					}).catch(function (res) {
						res.data.type = 'error';
						self.newWalletModel.step3.error = res.data;
						self.newWalletModel.step3.loading = false;
					});
				}
			},
			step4: {
				title: {
					main: $translate.getString('Done'),
					heading: $translate.getString('Done')
				},
				downloadBackup: function () {
					self.newWalletModel.values.downloadedBackup = true;
				}
			},
		}
	});

	
	self.$onInit = function () {
		$api.me.get().then(function (res) {
			self.newWalletModel.user = res.data;
		});

		$scope.$on('wizard:stepChanged',function(event, args) {
			if (args.index == 0)
				self.hideIndicators = true;
			else
				self.hideIndicators = false;
		});
	};
}


MeWalletNewCtrl.$inject = ['$scope', '$cookies', '$rootScope', '$bitcoin', '$bitcoinLedger', '$api', '$window', '$translate', 'WizardHandler', '$timeout', '$browserHelper'];

const MeWalletNewComponent = {
	templateUrl: 'components/dashboard/wallet/new/new.html',
	controller: MeWalletNewCtrl
};

export default MeWalletNewComponent;