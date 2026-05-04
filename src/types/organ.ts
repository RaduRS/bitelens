export type OrganKey =
  | 'heart' | 'brain' | 'bones' | 'gut'
  | 'immune' | 'eyes' | 'muscle' | 'skin';

export interface OrganBenefit {
  organ: OrganKey;
  priority: number;
}
