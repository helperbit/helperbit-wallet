import * as angular from 'angular';
import * as $ from 'jquery';
import TranslateService from '../../../../services/translate';
import { IModalService } from 'angular-ui-bootstrap';
import DonationService from '../../../../models/donation';

class MeWalletDonateCtrl {
	$donationService: DonationService;
	$uibModal: IModalService;
	$translate: TranslateService;
	$location: angular.ILocationService;
	$routeParams: {
		restype: 'user' | 'project' | 'event';
		resid: string;
		amount: number;
		wallet: string;

		giftmessage?: string;
		giftname?: string;
		campaign?: string;
		giftemail?: string;
		distribution?: string;
	};

	constructor($routeParams, $donationService, $uibModal, $translate, $location) {
		this.$routeParams = $routeParams;
		this.$donationService = $donationService;
		this.$uibModal = $uibModal;
		this.$location = $location;
		this.$translate = $translate;
	}

	$onInit() {
		const redirect = () => this.$location.path('/' + this.$routeParams.restype + '/' + this.$routeParams.resid);

		if (this.$routeParams.restype == 'project' || this.$routeParams.restype == 'user') {
			let additionalParams = '';
			if (this.$routeParams.campaign)
				additionalParams += `&campaign=${this.$routeParams.campaign}`;
			if (this.$routeParams.giftmessage && this.$routeParams.giftname) {
				additionalParams += `&giftmessage=${this.$routeParams.giftmessage}`;
				additionalParams += `&giftname=${this.$routeParams.giftname}`;
				if (!this.$routeParams.campaign) {
					additionalParams += `&giftemail=${this.$routeParams.giftemail}`;
				}
			}

			this.$donationService.donate(this.$routeParams.restype, this.$routeParams.resid, this.$routeParams.amount, additionalParams).then(donation => {
				this.$uibModal.open({
					component: 'meWalletWithdrawComponent',
					resolve: {
						modalData: () => {
							return {
								address: this.$routeParams.wallet,
								destination: donation.address,
								donation: donation.donation,
								mtype: 'wdonation',
								value: this.$routeParams.amount,
								description: this.$translate.getString("Sending donation") 
							};
						}
					}
				}).result.then((txid) => redirect(), () => redirect());
			}).catch((res) => {
				$('#errorModal').modal('show');
			});
		} else if (this.$routeParams.restype == 'event') {
			this.$uibModal.open({
				component: 'meWalletWithdrawComponent',
				resolve: {
					modalData: () => {
						return {
							address: this.$routeParams.wallet,
							mtype: 'eventdonation',
							value: this.$routeParams.amount,
							event: this.$routeParams.resid,
							distribution: JSON.parse(decodeURIComponent(this.$routeParams.distribution))
						};
					}
				}
			}).result.then((txid) => redirect(), () => redirect());
		}
	}

	static get $inject() { return ['$routeParams', '$donationService', '$uibModal', '$translate', '$location']; }
}

const MeWalletDonateComponent = {
	templateUrl: 'components/dashboard/wallet/donate/donate.html',
	controller: MeWalletDonateCtrl
};

export default MeWalletDonateComponent;