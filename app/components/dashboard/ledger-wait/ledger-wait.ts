export type LedgerWaitConfig = {
	phase: number;
	status: string;
	button?: boolean;
	exec?: () => void;
};

class LedgerWaitController {
	started: boolean;
	phases: string[];
	retryShow: boolean;

	exec: () => void; // input
	config: LedgerWaitConfig; // input

	constructor() {
		this.started = false;
		this.phases = ['wait', 'none', 'none'];
		this.retryShow = false;
	}

	retry() {
		this.started = true;
		this.retryShow = false;
		this.phases = ['wait', 'none', 'none'];
		this.exec();
	}

	$onChanges(changes) {
		if (!changes.config || !changes.config.currentValue)
			return;

		for (let i = 0; i < this.config.phase; i++)
			this.phases[i] = 'success';

		this.phases[this.config.phase] = this.config.status;
		if (this.config.status == 'error')
			this.retryShow = true;

		for (let i = this.config.phase + 1; i < this.phases.length; i++)
			this.phases[i] = 'none';
	}
}

const LedgerWaitComponent = {
	templateUrl: 'components/dashboard/ledger-wait/ledger-wait.html',
	controller: LedgerWaitController,
	bindings: {
		config: '<',
		exec: '='
	}
};

export default LedgerWaitComponent;