import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionButtonsComponent } from './action-buttons.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ActionButtonsComponent', () => {
  let component: ActionButtonsComponent;
  let fixture: ComponentFixture<ActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionButtonsComponent, NoopAnimationsModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ActionButtonsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display buttons when provided', () => {
    component.buttons = [
      { action: 'view', tooltip: 'Ver', icon: 'visibility' },
      { action: 'edit', tooltip: 'Editar', icon: 'edit' }
    ];
    fixture.detectChanges();
    
    const buttonElements = fixture.nativeElement.querySelectorAll('button.action-button');
    expect(buttonElements.length).toBe(2);
  });

  it('should emit action event when button is clicked', () => {
    component.buttons = [{ action: 'view', tooltip: 'Ver', icon: 'visibility' }];
    component.data = { id: 1, name: 'Test' };
    
    let emittedAction: any;
    component.action.subscribe(event => {
      emittedAction = event;
    });
    
    fixture.detectChanges();
    
    const buttonElement = fixture.nativeElement.querySelector('button.action-button');
    buttonElement.click();
    
    expect(emittedAction).toBeDefined();
    expect(emittedAction.action).toBe('view');
    expect(emittedAction.data).toEqual({ id: 1, name: 'Test' });
  });
});
