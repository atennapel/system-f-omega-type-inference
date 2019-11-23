import { Name } from './names';
import { Kind } from './kinds';
import { Type, TMeta } from './types';
import { terr } from './util';

export type TMetaId = number;
export type TMetaSolution
  = { tag: 'Unsolved', name: Name, kind: Kind }
  | { tag: 'Solved' };

const Unsolved = (name: Name, kind: Kind): TMetaSolution =>
  ({ tag: 'Unsolved', name, kind });
const Solved = (): TMetaSolution =>
  ({ tag: 'Solved' });

let tmetas: TMetaSolution[] = [];

export const resetTMetas = () => { tmetas = [] };

export const freshTMeta = (name: Name, kind: Kind): Type => {
  const id = tmetas.length;
  tmetas[id] = Unsolved(name, kind);
  return TMeta(id);
};

export const getTMeta = (id: TMetaId): TMetaSolution => {
  const m = tmetas[id];
  if (!m) return terr(`tmeta not found: ${id}`);
  return m;
};

export const solveTMeta = (id: TMetaId) => {
  getTMeta(id);
  tmetas[id] = Solved();
};
