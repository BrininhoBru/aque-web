import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required, minLength } from '@angular/forms/signals';
import { PersonService } from '../../core/services/person.service';
import { ToastService } from '../../shared/services/toast.service';
import { Person } from '../../core/models';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './persons.component.html',
})
export class PersonsComponent implements OnInit {
  private readonly personService = inject(PersonService);
  private readonly toast = inject(ToastService);

  readonly persons = signal<Person[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  private readonly model = signal({ name: '' });

  readonly personForm = form(this.model, (f) => {
    required(f.name, { message: 'Nome obrigatório' });
    minLength(f.name, 2, { message: 'Mínimo 2 caracteres' });
  });

  readonly formValid = computed(() => this.personForm.name().valid());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.personService.getAll().subscribe({
      next: (data) => {
        this.persons.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar pessoas.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.model.set({ name: '' });
    this.showForm.set(true);
  }

  openEdit(person: Person): void {
    this.editingId.set(person.id);
    this.model.set({ name: person.name });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);

    const { name } = this.model();
    const id = this.editingId();

    const request$ = id
      ? this.personService.update(id, { name })
      : this.personService.create({ name });

    request$.subscribe({
      next: () => {
        this.toast.success(id ? 'Pessoa atualizada!' : 'Pessoa criada!');
        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Erro ao salvar pessoa.');
        this.saving.set(false);
      },
    });
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }
  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;

    this.personService.delete(id).subscribe({
      next: () => {
        this.toast.success('Pessoa excluída.');
        this.confirmDeleteId.set(null);
        this.load();
      },
      error: (err) => {
        const msg =
          err.status === 400
            ? 'Não é possível excluir: pessoa vinculada a uma regra de divisão.'
            : 'Erro ao excluir pessoa.';
        this.toast.error(msg);
        this.confirmDeleteId.set(null);
      },
    });
  }
}
