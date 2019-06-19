import * as angular from 'angular';
import * as $ from 'jquery';

function MeWalletNewMultisigCtrl($rootScope, $api, $translate, WizardHandler, $utils) {
	const self = this;

	angular.extend(self, {
		backRedirect: $utils.backRedirect,
		pageHeader: {
			description: {
				title: $translate.getString('multisig wallet creation'),
				subTitle: $translate.getString('Create a new multisig wallet to send and receive Bitcoin')
			}
		},
		newWalletMultisigModel: {
			values: {
				n: 3,
				label: '',
				admins: [],
				adminscheck: {},
				scripttype: 'p2sh-p2wsh'
			},
			step1: {
				error: { type: null, error: null },
				title: {
					main: $translate.getString('Create'),
					heading: $translate.getString('Edit multisig wallet settings')
				},
				evaluteMultisigType: function() {
					let m = 1;

					for (const ad in self.newWalletMultisigModel.values.adminscheck)
						if (self.newWalletMultisigModel.values.adminscheck[ad])
							m++;

					const n = parseInt(self.newWalletMultisigModel.values.n);
					return n + ' of ' + m;
				},
				create: function () {
					const admins = [];

					for (const ad in self.newWalletMultisigModel.values.adminscheck)
						if (self.newWalletMultisigModel.values.adminscheck[ad]) admins.push(ad);

					$api.wallet.multisig.create(self.newWalletMultisigModel.values.scripttype, self.newWalletMultisigModel.values.label, self.newWalletMultisigModel.values.n, admins)
						.then(function (res) {
							$rootScope.$emit('reloadWallets', {});
							$rootScope.$emit('notificationUpdate', { from: 'wallet' });
							WizardHandler.wizard('newWalletMultisig').next();	
						}).catch(function (res) {
							res.data.type = 'error';
							self.newWalletMultisigModel.step1.error = res.data;
						});
				}
			},
			step2: {
				title: {
					main: $translate.getString('Done'),
					heading: $translate.getString('Done')
				},

			}
		}
	});


	self.$onInit = function () {
		$api.admin.list().then(function (res) {
			if (res.data.admins.length === 0)
				return $('#noadminModal').modal('show');

			self.newWalletMultisigModel.values.admins = res.data.admins;
			for (let i = 0; i < res.data.admins.length; i++)
				self.newWalletMultisigModel.values.adminscheck[res.data.admins[i]] = true;

			$rootScope.$emit('notificationUpdate', { from: 'wallet' });
		});
	};
};

MeWalletNewMultisigCtrl.$inject = ['$rootScope', '$api', '$translate', 'WizardHandler', '$utils'];

const MeWalletNewMultisigComponent = {
	templateUrl: 'components/dashboard/wallet/newmultisig/newmultisig.html',
	controller: MeWalletNewMultisigCtrl
};

export default MeWalletNewMultisigComponent;