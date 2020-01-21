import { Component, Input, OnChanges } from '@angular/core';

@Component({
	selector: 'mnemonic-view',
	templateUrl: 'mnemonic-view.html',
	styleUrls: ['mnemonic-view.scss']
})
export class MnemonicViewComponent implements OnChanges {
	@Input() mnemonic: string;
	amnemonic?: string[];

	constructor() {
		this.amnemonic = null;
	}

	ngOnChanges() {
		this.amnemonic = this.mnemonic.split(' ');
	}
}