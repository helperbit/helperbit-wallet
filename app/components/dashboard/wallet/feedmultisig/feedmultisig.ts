import * as angular from 'angular';

function MeWalletFeedMultisigCtrl($scope, $api, $cookies, $routeParams, $rootScope, $bitcoin, $bitcoinLedger, $window, $translate, WizardHandler, $timeout, $browserHelper) {
	const self = this;

	angular.extend(self, {
		hideIndicators: false,
		pageHeader: {
			description: {
				title: $translate.getString('multisig wallet feed'),
				subTitle: $translate.getString('Insert your signature for a new multisig wallet')
			}
		},
		feedMultisigModel: {
			username: $cookies.get('username'),
			wallet: null,
			values: {
				ledgerSupport: $browserHelper.isLedgerSupported(),
				invalid: false,
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
				label: $routeParams.label,
				labelShort: $routeParams.label.replace(/ /g, ''),
				organization: $routeParams.organization
			},
			step0: {
				title: {
					main: $translate.getString('Type'),
					heading: $translate.getString('Choose wallet type')
				},
				selectLedger: function () {
					self.feedMultisigModel.values.hardwareWallet = true;
					self.feedMultisigModel.values.hardwareWalletType = 'ledgernanos';
					self.feedMultisigModel.values.accept = false;	
					WizardHandler.wizard('feedMultisig').reset();
					$timeout(() => { WizardHandler.wizard('feedMultisig').next(); });
				},
				selectMnemonic: function () {
					self.feedMultisigModel.values.hardwareWallet = false;
					self.feedMultisigModel.values.hardwareWalletType = 'none';
					self.feedMultisigModel.values.accept = false;	
					WizardHandler.wizard('feedMultisig').reset();
					$timeout(() => { WizardHandler.wizard('feedMultisig').next(); });
				}
			},
			step1Passphrase: {
				title: {
					main: $translate.getString('Passphrase'),
					heading: $translate.getString('Generate a random passphrase')
				},
				previous: function () {
					WizardHandler.wizard('feedMultisig').previous();
				},
				renewMnemonic: function () {
					self.feedMultisigModel.values.mnemonic = $bitcoin.generateMnemonic();
				},
				printMnemonic: function () {
					const oldtitle = document.title;
					document.title = 'helperbit_passphrase_' + self.feedMultisigModel.username + '.pdf';
					$window.print();
					document.title = oldtitle;
				},
				next: function () {
					self.feedMultisigModel.step2Passphrase.error.type = '';
					const mn2 = self.feedMultisigModel.values.mnemonic.split(' ');
					const el1 = Math.floor(Math.random() * 4);
					const el2 = Math.floor(Math.random() * 4);
					const el3 = Math.floor(Math.random() * 4);
					self.feedMultisigModel.values.mnemonicConfirmChallenge = [
						{ index: el1 + 1, correct: mn2[el1], insert: '' },
						{ index: el2 + 5, correct: mn2[4 + el2], insert: '' },
						{ index: el3 + 9, correct: mn2[8 + el3], insert: '' }
					];

					WizardHandler.wizard('feedMultisig').next();
				}
			},
			step1HardwareWallet: {
				loading: false,
				error: {
					type: 'error',
					text: null,
					error: null
				},
				ledgerWaitStatus: {
					phase: 0,
					status: 'wait',
					exec: () => {}
				},
				title: {
					main: $translate.getString('Hardware Wallet'),
					heading: $translate.getString('Pair your hardware wallet')
				},
				previous: function () {
					WizardHandler.wizard('feedMultisig').previous();
				},
				pairHardwareWallet: function () {
					const ledgerWaitCallback = (phase, status) => { 
						$timeout(() => {
							self.feedMultisigModel.step1HardwareWallet.ledgerWaitStatus.phase = phase; 
							self.feedMultisigModel.step1HardwareWallet.ledgerWaitStatus.status = status; 
						});
					};

					self.feedMultisigModel.step1HardwareWallet.loading = true;

					if (self.feedMultisigModel.values.hardwareWalletType == 'ledgernanos') {
						$bitcoinLedger.getPublicKey(ledgerWaitCallback).then (pk => {							
							return $timeout(function () { 
								self.feedMultisigModel.step1HardwareWallet.loading = false;
								self.feedMultisigModel.values.hardwareWalletPublicKey = pk;
								self.feedMultisigModel.values.accept = true;	
								self.feedMultisigModel.step1HardwareWallet.error.text = $translate.getString('Hardware Wallet successfully paired');
								self.feedMultisigModel.step1HardwareWallet.error.type = 'success';
							});
						}).catch (err => {							
							return $timeout(function () { 
								self.feedMultisigModel.values.hardwareWalletPublicKey = null;
								self.feedMultisigModel.step1HardwareWallet.loading = false;
								// self.feedMultisigModel.step1HardwareWallet.error.error = 'XHW1';
								// self.feedMultisigModel.step1HardwareWallet.error.type = 'error';
								console.log('Error:', err);
							});
						});
					} else {
						self.feedMultisigModel.step1HardwareWallet.loading = false;
					}
				},
				next: function () {
					self.feedMultisigModel.step3.feed();
				}
			},
			step2Passphrase: {
				error: {
					type: 'error',
					error: null
				},
				title: {
					main: $translate.getString('Confirm'),
					heading: $translate.getString('Prove you have written down your passphrase')
				},
				previous: function () {
					WizardHandler.wizard('feedMultisig').previous();
				},
				next: function () {
					self.feedMultisigModel.step2Passphrase.error.error = '';

					for (let i = 0; i < self.feedMultisigModel.values.mnemonicConfirmChallenge.length; i++) {
						if (self.feedMultisigModel.values.mnemonicConfirmChallenge[i].correct != self.feedMultisigModel.values.mnemonicConfirmChallenge[i].insert) {
							return $timeout(function () { 
								self.feedMultisigModel.step2Passphrase.error.error = 'XM1';
								self.feedMultisigModel.step2Passphrase.error.type = 'error';
							});
						}
					}
					WizardHandler.wizard('feedMultisig').next();					
				}
			},
			step3: {
				passwordVisibility: 'password',
				loading: false,
				error: {
					type: 'error',
					error: null
				},
				title: {
					main: $translate.getString('Backup'),
					heading: $translate.getString('Create a signature backup file')
				},
				feed: function () {
					self.feedMultisigModel.step3.loading = true;
			
					// First key, generated from mnemonic
					let key1: any = {};
					if (self.feedMultisigModel.values.hardwareWallet) {
						key1 = { public: self.feedMultisigModel.values.hardwareWalletPublicKey, private: '' };
					} else {
						key1 = $bitcoin.mnemonicToKeys(self.feedMultisigModel.values.mnemonic);
					}
					
					// Feed the wallet
					$api.wallet.multisig.feed($routeParams.wallet, key1.public, self.feedMultisigModel.values.hardwareWallet, self.feedMultisigModel.values.hardwareWalletType).then(function (res) {
						self.feedMultisigModel.step3.error.error = '';		
						self.feedMultisigModel.step3.loading = false;
						self.feedMultisigModel.step3.downloadedBackup = false;

						if (!self.feedMultisigModel.values.hardwareWallet) {
							const ee = $bitcoin.encryptKeys(key1.private, self.feedMultisigModel.values.backupPassword);				

							self.feedMultisigModel.values.file = JSON.stringify({ 
								user: self.feedMultisigModel.username, 
								scripttype: self.feedMultisigModel.wallet.scripttype, 
								pubkeysrv: res.data.pubkeysrv, 
								encprivkey: ee, 
								pubkey: key1.public, 
								walletid: $routeParams.wallet, 
								label: self.feedMultisigModel.values.label, 
								organization: self.feedMultisigModel.values.organization 
							});
						}

						$rootScope.$emit('notificationUpdate', { from: 'wallet' });
						WizardHandler.wizard('feedMultisig').next();
					}).catch(function (res) {
						res.data.type = 'error';
						if (self.feedMultisigModel.values.hardwareWallet)
							self.feedMultisigModel.step1HardwareWallet.error = res.data;
						else
							self.feedMultisigModel.step3.error = res.data;
					});
				},			
			},
			step4: {
				title: {
					main: $translate.getString('Done'),
					heading: $translate.getString('Done')
				},
				downloadBackup: function () {
					self.feedMultisigModel.values.downloadedBackup = true;
				}
			},
		}
	});
		

	self.$onInit = function () {
		$api.wallet.list().then(function (res) {
			self.feedMultisigModel.values.invalid = false;
			self.feedMultisigModel.wallet = res.data.adminof.filter(w => w._id == $routeParams.wallet)[0];

			if (self.feedMultisigModel.wallet == undefined)	{
				self.feedMultisigModel.values.invalid = true;
			} else if(self.feedMultisigModel.wallet.active || self.feedMultisigModel.wallet.multisig.doneadmins.indexOf($cookies.get('email')) != -1) {
				self.feedMultisigModel.values.invalid = true;
			}
		});

		$scope.$on('wizard:stepChanged',function(event, args) {
			if (args.index == 0)
				self.hideIndicators = true;
			else
				self.hideIndicators = false;
		});
	};
}

MeWalletFeedMultisigCtrl.$inject = ['$scope', '$api', '$cookies', '$routeParams', '$rootScope', '$bitcoin', '$bitcoinLedger', '$window', '$translate', 'WizardHandler', '$timeout', '$browserHelper'];

const MeWalletFeedMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/feedmultisig/feedmultisig.html',
	controller: MeWalletFeedMultisigCtrl
};

export default MeWalletFeedMultisigComponent;