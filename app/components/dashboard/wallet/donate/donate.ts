import * as angular from 'angular';
import * as $ from 'jquery';

function MeWalletDonateCtrl($routeParams, $api, $uibModal, $translate, $location) {
	if ($routeParams.restype == 'project' || $routeParams.restype == 'user') {
		let additionalParams = '';
		if ($routeParams.campaign) 
			additionalParams += `&campaign=${$routeParams.campaign}`;
		if ($routeParams.giftmessage && $routeParams.giftname) {
			additionalParams += `&giftmessage=${$routeParams.giftmessage}`;
			additionalParams += `&giftname=${$routeParams.giftname}`;
			if(!$routeParams.campaign) {
				additionalParams += `&giftemail=${$routeParams.giftemail}`;
			}
		}
		
		$api.donation.donate($routeParams.restype, $routeParams.resid, $routeParams.amount, additionalParams).then(function (res) {
			const modalI = $uibModal.open({
				component: 'meWalletWithdrawComponent',
				resolve: {
					modalData: function () {
						return {
							address: $routeParams.wallet,
							destination: res.data.address,
							donation: res.data.donation,
							mtype: 'wdonation',
							value: $routeParams.amount,
							description: $translate.getString("Sending donation") // to project") + ': \"' + $filter ('stranslate')($scope.toObject.title) + '\"'
						};
					}
				}
			});

			modalI.result.then(function (txid) {
				$location.path('/' + $routeParams.restype + '/' + $routeParams.resid);
				//$location.path ('/donation/' + txid);
			}, function () {
				$location.path('/' + $routeParams.restype + '/' + $routeParams.resid);
			});
		}).catch(function (res) {
			$('#errorModal').modal('show');
		});
	} else if ($routeParams.restype == 'event') {
		const modalI = $uibModal.open({
			component: 'meWalletWithdrawComponent',
			resolve: {
				modalData: function () {
					return {
						address: $routeParams.wallet,
						mtype: 'eventdonation',
						value: $routeParams.amount,
						event: $routeParams.resid,
						distribution: JSON.parse(decodeURIComponent($routeParams.distribution))
					};
				}
			}
		});

		modalI.result.then(function (txid) {
			$location.path('/' + $routeParams.restype + '/' + $routeParams.resid);
			//$location.path ('/donation/' + txid);
		}, function () {
			$location.path('/' + $routeParams.restype + '/' + $routeParams.resid);
		});
	}
}

MeWalletDonateCtrl.$inject = ['$routeParams', '$api', '$uibModal', '$translate', '$location'];

const MeWalletDonateComponent = {
	templateUrl: 'components/dashboard/wallet/donate/donate.html',
	controller: MeWalletDonateCtrl
};

export default MeWalletDonateComponent;