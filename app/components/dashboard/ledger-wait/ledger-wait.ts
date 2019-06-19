import * as angular from 'angular';

function LedgerWaitController () {
	const self = this;

	/* FIELDS */

	angular.extend(self, {
		services: {},
		responseMessage: {},
		started: false,
		phases: [ 'wait', 'none', 'none' ],
		retryShow: false,
		button: true
	});

	/* METHODS */
	
	self.retry = () => {
		self.started = true;
		self.retryShow = false;
		self.phases = [ 'wait', 'none', 'none' ];
		self.exec();
	};

	//bindings change methods

	function updateBindingConfig () {
		const configParsed = JSON.parse(self.config);

		if ('button' in configParsed)
			self.button = configParsed.button;

		if (typeof(configParsed.phase) != 'number')
			return;

		for (let i = 0; i < configParsed.phase; i++)
			self.phases[i] = 'success';

		self.phases[configParsed.phase] = configParsed.status;
		if (configParsed.status == 'error') 
			self.retryShow = true;

		for (let i = configParsed.phase + 1; i < self.phases.length; i++)
			self.phases[i] = 'none';
	};

	/* EVENTS */

	/* CHANGES */

	self.$onChanges = function (changes) {
		if(changes.config && changes.config.currentValue && !changes.config.isFirstChange())
			updateBindingConfig();
	};
	
	/* INITIALIZATION */

	self.$onInit = function () {
		if(self.config)
			updateBindingConfig();
	};
};

const LedgerWaitComponent = {
	templateUrl: 'components/dashboard/ledger-wait/ledger-wait.html',
	controller: LedgerWaitController,
	bindings: {
		config: '@',
		exec: '='
	}
};

export default LedgerWaitComponent;