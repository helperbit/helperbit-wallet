import { generateMnemonicPhrase, createMnemonicChallenge, checkMnemonicChallenge, MnemonicChallenge, mnemonicToKeys } from "./mnemonic";

describe('Mnemonic generation, challenge creation and verification', () => {
	let mnemonic: string;
	let mnemonicSplit: string[];
	let challenge: MnemonicChallenge;

	beforeEach(() => {
		mnemonic = generateMnemonicPhrase();
		mnemonicSplit = mnemonic.split(' ');
		expect(mnemonicSplit.length).toBe(12);
		challenge = createMnemonicChallenge(mnemonic);
		expect(challenge.length).toBe(3);
	});

	it('should generate a valid challenge', () => {
		for(const ch of challenge) {
			expect(mnemonic.indexOf(ch.correct) != -1).toBeTrue();
			expect(mnemonicSplit.indexOf(ch.correct) + 1).toBe(ch.index);
		}		
	});

	it('should convert mnemonic to keys', () => {
		expect(mnemonicToKeys(mnemonic)).toBeDefined();
	});

	it('should detect wrong challenge (empty challenge)', () => {
		expect(checkMnemonicChallenge(challenge)).toBeFalse();
	});

	it('should detect wrong challenge (wrong words)', () => {
		challenge[0].insert = challenge[0].correct + 'a';
		challenge[1].insert = challenge[1].correct + 'b';
		challenge[2].insert = challenge[2].correct + 'c';
		expect(checkMnemonicChallenge(challenge)).toBeFalse();
	});

	it('should detect wrong challenge (wrong last word)', () => {
		challenge[0].insert = challenge[0].correct;
		challenge[1].insert = challenge[1].correct;
		challenge[2].insert = challenge[2].correct + 'c';
		expect(checkMnemonicChallenge(challenge)).toBeFalse();
	});

	it('should detect correct challenge', () => {
		challenge[0].insert = challenge[0].correct;
		challenge[1].insert = challenge[1].correct;
		challenge[2].insert = challenge[2].correct;
		expect(checkMnemonicChallenge(challenge)).toBeTrue();
	});
});


describe('BitcoinService', () => {

});