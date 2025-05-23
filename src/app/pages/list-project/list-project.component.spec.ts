import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListProjectComponent } from './list-project.component';

describe('ListProjectComponent', () => {
  let component: ListProjectComponent;
  let fixture: ComponentFixture<ListProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
