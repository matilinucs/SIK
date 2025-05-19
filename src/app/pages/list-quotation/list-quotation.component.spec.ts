import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListQuotationComponent } from './list-quotation.component';

describe('ListQuotationComponent', () => {
  let component: ListQuotationComponent;
  let fixture: ComponentFixture<ListQuotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListQuotationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListQuotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
