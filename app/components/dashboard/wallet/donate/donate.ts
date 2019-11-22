import * as $ from 'jquery';
import { TranslateService } from '@ngx-translate/core';
import DonationService from '../../../../models/donation';
import { ModalsConfig } from 'app/shared/components/modal/oldModal/modal';
import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import MeWalletWithdrawComponent from '../withdraw/withdraw';
import { ActivatedRoute } from '@angular/router';


interface DonateRouteParams {
	restype: 'user' | 'project' | 'event';
	resid: string;
	amount: number;
	wallet: string;

	giftmessage?: string;
	giftname?: string;
	campaign?: string;
	giftemail?: string;
	distribution?: string;
}

@Component({
	selector: 'me-wallet-donate-component',
	templateUrl: 'donate.html',
})
export default class MeWalletDonateComponent implements OnInit {
	modals: ModalsConfig;

	constructor(
		private route: ActivatedRoute,
		private donationService: DonationService, 
		private translate: TranslateService, 
		private router: Router,
		private modalService: NgbModal
	) {
		this.modals = {
			error: {
				id: 'modalError'
			}
		};
	}

	ngOnInit() {
		const redirect = () => this.router.navigateByUrl('/' + this.route.snapshot.paramMap.get('restype') + '/' + this.route.snapshot.paramMap.get('resid'));

		if (this.route.snapshot.paramMap.get('restype') == 'project' || this.route.snapshot.paramMap.get('restype') == 'user') {
			let additionalParams = '';
			if (this.route.snapshot.queryParamMap.has('campaign'))
				additionalParams += `&campaign=${this.route.snapshot.queryParamMap.get('campaign')}`;
			if (this.route.snapshot.queryParamMap.has('giftmessage') && this.route.snapshot.queryParamMap.has('giftname')) {
				additionalParams += `&giftmessage=${this.route.snapshot.queryParamMap.get('giftmessage')}`;
				additionalParams += `&giftname=${this.route.snapshot.queryParamMap.get('giftname')}`;
				if (!this.route.snapshot.queryParamMap.has('campaign')) {
					additionalParams += `&giftemail=${this.route.snapshot.queryParamMap.get('giftemail')}`;
				}
			}

			this.donationService.donate(
				(this.route.snapshot.paramMap.get('restype') as any), 
				this.route.snapshot.paramMap.get('resid'), 
				Number(this.route.snapshot.queryParamMap.get('amount')), 
				additionalParams
			).subscribe(donation => {
				const modalRef = this.modalService.open(MeWalletWithdrawComponent, {
					size: 'lg'
				});
				modalRef.componentInstance.config = {
					address: this.route.snapshot.queryParamMap.get('wallet'),
					destination: donation.address,
					donation: donation.donation,
					mtype: 'withdraw', //'wdonation',
					value: this.route.snapshot.queryParamMap.get('amount'),
					description: this.translate.instant("Sending donation") 
				};
				modalRef.result.then((v) => { redirect(); }, () => { redirect(); });
			}, res => {
				$('#modalError').modal('show');
			});
		} else if (this.route.snapshot.paramMap.get('restype') == 'event') {
			const modalRef = this.modalService.open(MeWalletWithdrawComponent, {
				size: 'lg'
			});
			modalRef.componentInstance.config = {
				address: this.route.snapshot.queryParamMap.get('wallet'),
				mtype: 'eventdonation',
				value: this.route.snapshot.queryParamMap.get('amount'),
				event: this.route.snapshot.paramMap.get('resid'),
				distribution: JSON.parse(decodeURIComponent(this.route.snapshot.queryParamMap.get('distribution')))
			};
			modalRef.result.then((v) => { redirect(); }, () => { redirect(); });
		}
	}
}