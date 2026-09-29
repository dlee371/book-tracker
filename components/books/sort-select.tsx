"use client";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { SORT_OPTIONS, type LibrarySort } from "@/lib/library-query";

// Submits its form as soon as a new sort is picked, so there's no extra
// "apply" click. This is the only part of the toolbar that needs browser JS.
export function SortSelect({ defaultValue }: { defaultValue: LibrarySort }) {
  return (
    <NativeSelect
      name="sort"
      defaultValue={defaultValue}
      aria-label="Sort by"
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {Object.entries(SORT_OPTIONS).map(([value, label]) => (
        <NativeSelectOption key={value} value={value}>
          {label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
