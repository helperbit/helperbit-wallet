import { Component, Input, EventEmitter, OnChanges, Output } from '@angular/core';

export interface LedgerWaitConfig {
	phase: number;
	status: string;
	button?: boolean;
}

@Component({
	selector: 'ledger-wait',
	templateUrl: 'ledger-wait.html',
	styleUrls: ['ledger-wait.scss']
})
export default class LedgerWaitComponent implements OnChanges {
	@Output() exec: EventEmitter<void> = new EventEmitter();
	@Input() config: LedgerWaitConfig; // input

	started: boolean;
	phases: string[];
	retryShow: boolean;

	constructor() {
		this.started = false;
		this.phases = ['wait', 'none', 'none'];
		this.retryShow = false;
	}

	retry() {
		this.started = true;
		this.retryShow = false;
		this.phases = ['wait', 'none', 'none'];
		this.exec.emit();
	}

	ngOnChanges(changes) {
		if (!changes.config || !changes.config.currentValue)
			return;

		for (let i = 0; i < this.config.phase; i++)
			this.phases[i] = 'success';

		this.phases[this.config.phase] = this.config.status;
		if (this.config.status == 'error')
			this.retryShow = true;
		else
			this.retryShow = false;

		for (let i = this.config.phase + 1; i < this.phases.length; i++)
			this.phases[i] = 'none';
	}
}
