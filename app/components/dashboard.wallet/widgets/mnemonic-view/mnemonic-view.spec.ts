import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MnemonicViewComponent } from './mnemonic-view';
import { OrdinalPipe } from 'app/shared/filters/ordinal';

const mockMnemonic = 'casa parco vela gianni sedia bottiglia telefono presa sigaretta cavo divano gatto';

describe('MnemonicViewComponent (isolated test)', () => {
	let component: MnemonicViewComponent;

	beforeEach(() => {
		component = new MnemonicViewComponent();
	});

	it('should instantiate', () => {
		expect(component).toBeDefined();
	});
});



describe('MnemonicViewComponent (shallow test)', () => {
	let component: MnemonicViewComponent;
	let fixture: ComponentFixture<MnemonicViewComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [MnemonicViewComponent, OrdinalPipe],
			providers: [],
			imports: [TranslateModule.forRoot()]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(MnemonicViewComponent);
		component = fixture.componentInstance;
	});

	it('should instantiate', () => {
		expect(component).toBeDefined();
	});

	it('should display every mnemonic word', async () => {
		let inspected = 0;
		component.mnemonic = mockMnemonic;
		component.ngOnChanges();
		fixture.detectChanges();
		expect(component.amnemonic).toEqual(mockMnemonic.split(' '));

		fixture.debugElement.nativeElement.querySelectorAll('.word-box').forEach((w, i) => {
			expect(w.innerHTML).toContain(mockMnemonic.split(' ')[i]);
			inspected += 1;
		});

		expect(inspected).toBe(12);
	});
});


