class TransactionListController {
	in: boolean; //@input
	out: boolean; //@input
	txs: any[]; //@input
	multisig: boolean; //@input
	vtxs: any[];

	constructor() {
		this.vtxs = [];
	}

	directionFilter(tx) {
		if (this.in && tx.in || this.out && !tx.in)
			return true;
		else
			return false;
	}

	$onChanges(changes) {
		if (!changes.txs || !changes.txs.currentValue)
			return;

		if (this.txs)
			this.vtxs = this.txs.filter(e => this.directionFilter(e)).slice(0, 5);
	}
};

const TransactionListComponent = {
	templateUrl: 'components/dashboard/transaction-list/transaction-list.html',
	controller: TransactionListController,
	controllerAs: '$ctrl',
	bindings: {
		in: '<',
		txs: '<',
		out: '<',
		multisig: '<'
	}
};

export default TransactionListComponent;