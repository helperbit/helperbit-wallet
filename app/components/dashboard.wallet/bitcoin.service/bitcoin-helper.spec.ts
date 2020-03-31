import { decryptKeys, randomBytes, encryptKeys, randomKeys, toByteArray, toHexString, BackupFile, decryptBackup, checkBitcoinAddress } from "./bitcoin-helper";
import { networks } from 'bitcoinjs-lib';

describe('Bitcoin keys encryption / decryption', () => {
	it('should return the same data after encryp => decrypt', () => {
		const key = randomKeys();
		const password = 'password';
		expect(decryptKeys(encryptKeys(key.private, password), password)).toEqual(key);
	});

	it('should fail decryption', () => {
		expect(decryptKeys('castiglio', 'pino')).toBeNull();
	});

	it('should decrypt backup and fail with wrong data', () => {
		const key = randomKeys();
		const password = 'password';
		const keyEnc = encryptKeys(key.private, password);
		const backup: BackupFile = {
			encprivkey: keyEnc,
			pubkey: key.public,
			address: '123',
			walletid: '123',
			label: '',
			organization: '',
			scripttype: 'p2sh',
			user: 'dakk',
			pubkeysrv: key.public
		};
		expect(decryptBackup(backup, password)).toEqual(key);
		expect(() => decryptBackup(null, password)).toThrow();
		expect(() => decryptBackup({ ...backup, ...{ encprivkey: undefined } }, password)).toThrow();
		expect(() => decryptBackup({ ...backup, ...{ pubkey: undefined } }, password)).toThrow();
		// expect(() => decryptBackup({ ...backup, ...{ address: undefined } }, password)).toThrow();
		// expect(() => decryptBackup({ ...backup, ...{ walletid: undefined } }, password, true)).toThrow();
		expect(() => decryptBackup({ ...backup, ...{ pubkey: 'ciao' } }, password, true)).toThrow();
	});
});

describe('CheckBitcoinAddress()', () => {
	it('should detect valid address', () => {
		expect(checkBitcoinAddress('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy', networks.testnet)).toBeTrue();
		expect(checkBitcoinAddress('tb1q9yqzjcywvuy9lz2vuvv6xmkhe7zg9kkp35mdrn', networks.testnet)).toBeTrue();
	});

	it('should detect invalid address', () => {
		expect(checkBitcoinAddress('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKsh1y', networks.testnet)).toBeFalse();
	});
});

describe('RandomBytes()', () => {
	it('should fail on invalid size', () => {
		expect(() => randomBytes(65537)).toThrow();
	});

	it('should generate correct size buffer', () => {
		expect(randomBytes(64).length).toBe(64);
		expect(randomBytes(64)).toBeInstanceOf(Buffer);
	})
});


describe('Hex strings conversion', () => {
	it('should transform hex string to buffer', () => {
		const data = toByteArray('caccac');
		expect(data).toBeInstanceOf(Buffer);
		expect(data.length).toBe(3);
		expect(data[0]).toBe(0xca);
		expect(data[1]).toBe(0xcc);
		expect(data[2]).toBe(0xac);
	});

	it('should transform buffer to hex string', () => {
		const data = toHexString(Buffer.from([0xca, 0xcc, 0xac]));
		expect(data).toBeInstanceOf(String);
		expect(data.length).toBe(6);
		expect(data).toBe('caccac');
	});

	it('should transform hex string to buffer and then to hex string', () => {
		expect(toHexString(toByteArray('c09fff'))).toBe('c09fff');
	});
});