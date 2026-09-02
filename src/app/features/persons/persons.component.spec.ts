import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PersonsComponent } from './persons.component';

describe('PersonsComponent', () => {
  let component: PersonsComponent;
  let fixture: ComponentFixture<PersonsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/persons').flush([]);
  });

  afterEach(() => http.verify());

  it('marca inválido quando o nome é só espaços em branco', () => {
    component.personForm.name().value.set('   ');
    expect(component.personForm.name().valid()).toBeFalse();
  });

  it('mantém válido com um nome de verdade', () => {
    component.personForm.name().value.set('Bruno');
    expect(component.personForm.name().valid()).toBeTrue();
  });
});
