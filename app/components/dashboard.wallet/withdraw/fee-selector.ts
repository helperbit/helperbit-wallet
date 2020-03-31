import { Component, Output, Input, EventEmitter } from '@angular/core';
import { WithdrawFees } from '../../../models/wallet';

@Component({
	selector: 'fee-selector',
	templateUrl: 'fee-selector.html',
	styles: [`.summary-table td { text-align: center; }`]
})
export class FeeSelectorComponent {
	@Input() fees: WithdrawFees;
	@Output() changedProfile: EventEmitter<string> = new EventEmitter();
	public profile = 'fastest';

	changedFeeProfile() {
		this.changedProfile.emit(this.profile);
	}
}