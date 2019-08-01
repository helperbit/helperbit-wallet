/** Mnemonic visualization */
class MnemonicViewController {
	amnemonic?: string[];
	mnemonic: string; //@Input

	constructor() {
		this.amnemonic = null;
	}

	$onChanges(changes) {
		this.amnemonic = this.mnemonic.split(' ');
	}
}

const MnemonicViewComponent = {
	templateUrl: 'components/dashboard/mnemonic-view/mnemonic-view.html',
	controller: MnemonicViewController,
	controllerAs: '$ctrl',
	bindings: {
		mnemonic: '<'
	}
};

export default MnemonicViewComponent;