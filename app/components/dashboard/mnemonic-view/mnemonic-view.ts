import * as angular from 'angular';

/** Mnemonic visualization */
function MnemonicViewController () {
	const self = this;

	/* FIELDS */

	angular.extend(self, {
		services: {},
		responseMessage: {},
		amnemonic: null
	});

	/* METHODS */

	//bindings change methods

	function updateBindingMenmonic () {
		self.amnemonic = self.mnemonic.split(' ');
	};

	/* EVENTS */

	/* CHANGES */

	self.$onChanges = function (changes) {
		if(changes.mnemonic && changes.mnemonic.currentValue && !changes.mnemonic.isFirstChange())
			updateBindingMenmonic();
	};
	
	/* INITIALIZATION */

	self.$onInit = function () {
		if(self.mnemonic)
			updateBindingMenmonic();
	};
};

const MnemonicViewComponent = {
	templateUrl: 'components/dashboard/mnemonic-view/mnemonic-view.html',
	controller: MnemonicViewController,
	bindings: {
		mnemonic: '='
	}
};

export default MnemonicViewComponent;