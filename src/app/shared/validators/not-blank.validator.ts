import { pattern, PathKind, SchemaPath, SchemaPathRules } from '@angular/forms/signals';

// Signal Forms `required()` só rejeita string vazia — "   " passa. Isso cobre o buraco.
export function notBlank<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  config?: { message?: string },
): void {
  pattern(path, /\S/, { message: config?.message ?? 'Não pode conter só espaços em branco' });
}
