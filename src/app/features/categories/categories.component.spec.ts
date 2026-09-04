import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriesComponent } from './categories.component';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/categories').flush([]);
  });

  afterEach(() => http.verify());

  it('marca inválido quando o nome é só espaços em branco', () => {
    component.categoryForm.name().value.set('   ');
    expect(component.categoryForm.name().valid()).toBeFalse();
  });

  it('mantém válido com um nome de verdade', () => {
    component.categoryForm.name().value.set('Academia');
    expect(component.categoryForm.name().valid()).toBeTrue();
  });
});
