import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('deve criar o serviço sem toasts', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  describe('success() / error() / warning()', () => {
    it('deve adicionar um toast do tipo correspondente', () => {
      service.success('Salvo!');
      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0]).toEqual(jasmine.objectContaining({ message: 'Salvo!', type: 'success' }));

      service.error('Erro!');
      expect(service.toasts()[1]).toEqual(jasmine.objectContaining({ message: 'Erro!', type: 'error' }));

      service.warning('Atenção!');
      expect(service.toasts()[2]).toEqual(jasmine.objectContaining({ message: 'Atenção!', type: 'warning' }));
    });

    it('deve dar ids incrementais e distintos pra cada toast', () => {
      service.success('a');
      service.success('b');
      const [first, second] = service.toasts();
      expect(first.id).not.toBe(second.id);
    });
  });

  describe('actionable()', () => {
    it('deve criar um toast com a ação preenchida', () => {
      const onClick = jasmine.createSpy('onClick');
      service.actionable('Excluído.', 'warning', { label: 'Desfazer', onClick });

      expect(service.toasts()[0]).toEqual(
        jasmine.objectContaining({
          message: 'Excluído.',
          type: 'warning',
          action: { label: 'Desfazer', onClick },
        }),
      );
    });

    it('success()/error()/warning() continuam sem ação', () => {
      service.success('a');
      expect(service.toasts()[0].action).toBeUndefined();
    });
  });

  describe('dismiss()', () => {
    it('deve remover apenas o toast com o id informado', () => {
      service.success('a');
      service.success('b');
      const idToRemove = service.toasts()[0].id;

      service.dismiss(idToRemove);

      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0].message).toBe('b');
    });
  });

  describe('auto-dismiss', () => {
    it('deve remover o toast automaticamente após 4 segundos', () => {
      jasmine.clock().install();
      try {
        service.success('some');
        expect(service.toasts().length).toBe(1);

        jasmine.clock().tick(4000);

        expect(service.toasts().length).toBe(0);
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
