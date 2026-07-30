import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface CheckboxOption {
  id: string;
  label: string;
}

/*
 * A compact, scrollable multi-select used by the role form for picking
 * employees, modules and sites.
 */
export function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
  isLoading,
  emptyText = 'Nothing available.',
  error,
}: {
  legend: string;
  options: CheckboxOption[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  isLoading?: boolean;
  emptyText?: string;
  error?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">
        {legend}
        {selected.length > 0 && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{selected.length} selected</span>
        )}
      </legend>

      <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-md border p-2.5">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && options.length === 0 && <p className="text-xs text-muted-foreground">{emptyText}</p>}
        {options.map((option) => {
          const id = `${legend}-${option.id}`;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(option.id)}
                onCheckedChange={(checked) => onToggle(option.id, checked === true)}
              />
              <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                {option.label}
              </Label>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}
