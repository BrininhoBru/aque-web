import { createLatestRequestGuard } from './latest-request-guard';

describe('createLatestRequestGuard', () => {
  it('o id mais recente é o único considerado atual', () => {
    const guard = createLatestRequestGuard();
    const first = guard.next();
    const second = guard.next();

    expect(guard.isCurrent(first)).toBeFalse();
    expect(guard.isCurrent(second)).toBeTrue();
  });

  it('ids são incrementais e distintos', () => {
    const guard = createLatestRequestGuard();
    const first = guard.next();
    const second = guard.next();
    expect(second).toBeGreaterThan(first);
  });

  it('guards independentes não compartilham estado', () => {
    const guardA = createLatestRequestGuard();
    const guardB = createLatestRequestGuard();

    const idA = guardA.next();
    guardB.next();

    expect(guardA.isCurrent(idA)).toBeTrue();
  });
});
