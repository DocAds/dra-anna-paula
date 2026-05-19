"use client";

type State = { open: boolean; source: string; message?: string };

const listeners = new Set<(s: State) => void>();
let state: State = { open: false, source: "", message: undefined };

function emit() {
  for (const l of listeners) l(state);
}

export const leadModal = {
  open(source: string, message?: string) {
    state = { open: true, source, message };
    emit();
  },
  close() {
    state = { open: false, source: "", message: undefined };
    emit();
  },
  subscribe(l: (s: State) => void) {
    listeners.add(l);
    l(state);
    return () => listeners.delete(l);
  },
  get() {
    return state;
  },
};
