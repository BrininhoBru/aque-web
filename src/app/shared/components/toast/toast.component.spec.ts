import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('não deve renderizar nada sem toasts', () => {
    const items = fixture.nativeElement.querySelectorAll('.animate-slide-in');
    expect(items.length).toBe(0);
  });

  it('deve renderizar um item por toast, com mensagem e ícone corretos', () => {
    toastService.success('Salvo com sucesso!');
    toastService.error('Algo deu errado.');
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.animate-slide-in');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Salvo com sucesso!');
    expect(items[0].textContent).toContain('✓');
    expect(items[1].textContent).toContain('Algo deu errado.');
    expect(items[1].textContent).toContain('✕');
  });

  it('deve remover o toast ao clicar no botão de fechar', () => {
    toastService.success('Salvo!');
    fixture.detectChanges();

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.animate-slide-in button');
    closeButton.click();
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.animate-slide-in').length).toBe(0);
  });

  it('deve renderizar um botão de ação quando o toast tem action, e chamar onClick + dismiss ao clicar', () => {
    const onClick = jasmine.createSpy('onClick');
    toastService.actionable('Excluído.', 'warning', { label: 'Desfazer', onClick });
    fixture.detectChanges();

    const actionButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.animate-slide-in button.toast-action',
    );
    expect(actionButton).not.toBeNull();
    expect(actionButton.textContent).toContain('Desfazer');

    actionButton.click();
    fixture.detectChanges();

    expect(onClick).toHaveBeenCalled();
    expect(toastService.toasts().length).toBe(0);
  });

  it('não deve renderizar botão de ação quando o toast não tem action', () => {
    toastService.success('Salvo!');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.animate-slide-in button.toast-action')).toBeNull();
  });

  describe('toastClass()', () => {
    it('deve retornar uma classe distinta por tipo', () => {
      const success = component.toastClass({ id: 1, message: '', type: 'success' });
      const error = component.toastClass({ id: 2, message: '', type: 'error' });
      const warning = component.toastClass({ id: 3, message: '', type: 'warning' });

      expect(success).not.toBe(error);
      expect(error).not.toBe(warning);
    });
  });

  describe('toastIcon()', () => {
    it('deve retornar o ícone correto por tipo', () => {
      expect(component.toastIcon('success')).toBe('✓');
      expect(component.toastIcon('error')).toBe('✕');
      expect(component.toastIcon('warning')).toBe('⚠');
      expect(component.toastIcon('desconhecido')).toBe('•');
    });
  });
});
