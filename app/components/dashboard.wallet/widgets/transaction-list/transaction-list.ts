import { Component, Input, OnChanges } from '@angular/core';

@Component({
	selector: 'transaction-list',
	templateUrl: 'transaction-list.html'
})
export class TransactionListComponent implements OnChanges {
	@Input() in: boolean;
	@Input() out: boolean;
	@Input() txs: any[];
	@Input() multisig: boolean;
	vtxs: any[];

	constructor() {
		this.vtxs = [];
	}

	private directionFilter(tx) {
		if (this.in && tx.in || this.out && !tx.in)
			return true;
		else
			return false;
	}

	ngOnChanges(changes) {
		if (!changes.txs || !changes.txs.currentValue)
			return;

		if (this.txs)
			this.vtxs = this.txs.filter(e => this.directionFilter(e)).slice(0, 5);
	}
}
