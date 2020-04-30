// TODO: Can't test this code, since the ledger imports fails the test build. We have to inspect it

// import { ComponentFixture, TestBed, async } from '@angular/core/testing';
// import { WalletService } from 'app/models/wallet';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { MockWalletService, MockTranslateService, MockNgbModalService } from 'app/shared/helpers/mocks';
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
// import { MeWalletWithdrawComponent } from './withdraw';
// import { NotificationService } from 'app/models/notifications';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';



// describe('MeWalletWithdrawComponent (isolated test)', () => {
// 	let component: MeWalletWithdrawComponent;

// 	beforeEach(() => {
// 		component = new MeWalletWithdrawComponent(null, null, null, null);
// 	});

// 	it('should instantiate', () => {
// 		expect(component).toBeDefined();
// 	});
// });



// describe('MeWalletWithdrawComponent (shallow test)', () => {
// 	let component: MeWalletWithdrawComponent;
// 	let fixture: ComponentFixture<MeWalletWithdrawComponent>;

// 	beforeEach(async(() => {
// 		TestBed.configureTestingModule({
// 			declarations: [MeWalletWithdrawComponent],
// 			providers: [
// 				{ provide: WalletService, useClass: MockWalletService },
// 				{ provide: TranslateService, useClass: MockTranslateService },
// 				{ provide: NgbModal, useClass: MockNgbModalService }
// 			],
// 			// schemas: [NO_ERRORS_SCHEMA],
// 			imports: [TranslateModule.forRoot()]
// 		}).compileComponents();
// 	}));

// 	beforeEach(() => {
// 		fixture = TestBed.createComponent(MeWalletWithdrawComponent);
// 		component = fixture.componentInstance;
// 	});

// 	it('should instantiate', () => {
// 		expect(component).toBeDefined();
// 	});
// });



// describe('MeWalletWithdrawComponent (integrated test)', () => {
// 	let component: MeWalletWithdrawComponent;
// 	let fixture: ComponentFixture<MeWalletWithdrawComponent>;
// 	let httpMock: HttpTestingController;

// 	beforeEach(async(() => {
// 		TestBed.configureTestingModule({
// 			declarations: [MeWalletWithdrawComponent],
// 			providers: [WalletService, NotificationService, NgbModal],
// 			imports: [HttpClientTestingModule, TranslateModule.forRoot()]
// 		}).compileComponents();
// 		httpMock = TestBed.get(HttpTestingController);
// 	}));

// 	beforeEach(() => {
// 		fixture = TestBed.createComponent(MeWalletWithdrawComponent);
// 		fixture.detectChanges();
// 	});

// 	it('should instantiate', () => {
// 		expect(component).toBeDefined();
// 	});
// });
