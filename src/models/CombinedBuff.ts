// A single bonus after buffs have been merged by type. These are grouped into a
// map keyed by the field they apply to (e.g. 'attackMod', 'damageMod', 'str'),
// i.e. Record<string, Array<CombinedBuff>>.
export interface CombinedBuff {
    name: string;
    value: number | string;
    type?: string;
    stacks?: boolean;
    nested?: boolean;
};
