import { Component, Output, Input, EventEmitter } from '@angular/core';
import { WithdrawFees } from '../../../../models/wallet';

@Component({
	selector: 'fee-selector',
	templateUrl: 'fee-selector.html',
	styles: [`.summary-table td { text-align: center; }`]
})
export default class FeeSelectorComponent {
	@Input() fees: WithdrawFees;
	@Output() change: EventEmitter<string> = new EventEmitter();
	private profile = 'fastest';

	changedFeeProfile() {
		this.change.emit(this.profile);
	}
}