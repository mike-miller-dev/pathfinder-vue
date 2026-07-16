<template>
    <div v-if="character">
        -------------------
        <BonusList :bonuses="character.partyBuffs" @changed="selectedPartyBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.selfBuffs" @changed="selectedSelfBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.weaponBuffs" @changed="selectedWeaponBuffs = $event" :select-one="true" />
        -------------------
        <BonusList :bonuses="character.actions" @changed="selectedActions = $event" />
        -------------------
        <TemporaryBonuses @changed="temporaryBuffs = $event" />
        -------------------
    </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import BonusList from './BonusList.vue';
  import TemporaryBonuses from './TemporaryBonuses.vue';
  import type { Bonus } from "@/models/Bonus";
  import type { Buff } from "@/models/Buff";
  import type { Character } from '@/models/Character';
  import type { CharacterAttack } from '@/models/CharacterAttack';
  export default defineComponent({
    name: 'CombinedBuffs',
    emits: ["changed", "conditions-changed"],
    components: {
      BonusList,
      TemporaryBonuses
    },
    props : {
      character : {
        type: Object as Character,
        required: true
      },
      selectedAttack : {
        type: Object as CharacterAttack,
        required: true
      },
    },
    data() {
      return {
        selectedSelfBuffs: [] as Array<Buff>,
        selectedPartyBuffs: [] as Array<Buff>,
        selectedWeaponBuffs: [] as Array<Buff>,
        selectedActions: [] as Array<Buff>,
        temporaryBuffs: [] as Array<Buff>
      }
    },
    computed: {
      weaponBonuses() {
        return {
          bonuses: this.selectedAttack.bonuses
        };
      },
      selectedBuffs() {
        return this.selectedSelfBuffs.concat(this.selectedActions, this.selectedPartyBuffs, this.selectedWeaponBuffs, this.temporaryBuffs, this.weaponBonuses);
      },
      conditions() {
        return this.selectedBuffs.filter((b: Buff) => b.conditions != null).flatMap((b: Buff) => b.conditions);
      },
      appliedConditionals() {
          if(!this.selectedAttack || !this.selectedAttack.conditionalBonuses) {
            return [];
          }
          return this.selectedAttack.conditionalBonuses.filter((c: Bonus) => this.conditions.includes(c.condition));
      },
      allBonuses() {
        return this.selectedBuffs.concat(this.appliedConditionals);
      },
      isMeleeAttack() {
        return this.selectedAttack.type.toLowerCase().includes('melee');
      },
      isRangedAttack() {
        return this.selectedAttack.type.toLowerCase().includes('range');
      },
      combinedBonuses() {
        const combined = {};

        for (const buff of this.allBonuses) {
          //example buff: { name: 'bulls strength', selected: true, bonuses: [{ strength: 4, type: 'enh'}] }
          for (const bonus of buff.bonuses || []) {
            //example bonus: { strength: 4, type: 'enh'}
            for (const bonusField in bonus) {
              if (bonusField == 'type') {
                continue;
              }

              // Map weapon-specific mods to a shared bucket, skipping ones that
              // don't apply to the selected weapon.
              let combinedType = bonusField;
              if (this.isDamageMod(combinedType)) {
                if (!this.isApplicableDamageMod(combinedType)) {
                  continue;
                }
                combinedType = 'damageMod';
              }
              if (this.isAttackMod(combinedType)) {
                if (!this.isApplicableAttackMod(combinedType)) {
                  continue;
                }
                combinedType = 'attackMod';
              }

              const bonusValue = bonus[bonusField];
              const newBuff = {
                'name': buff.name,
                'value': bonusValue,
                'type': bonus.type,
                'stacks': bonus.stacks,
                'nested': bonus.nested
              };

              const existingBuffs = combined[combinedType];
              if (!existingBuffs) {
                //first buff of this type
                combined[combinedType] = [newBuff];
                continue;
              }

              const existingIndex = existingBuffs.findIndex((existingBuff: Bonus) => bonus.type && existingBuff.type === bonus.type);
              if (existingIndex < 0) {
                //add a new type to the existing buffs
                existingBuffs.push(newBuff);
              } else if (bonus.stacks || existingBuffs[existingIndex].stacks) {
                //increase the value of the existing buff
                newBuff.value += existingBuffs[existingIndex].value;
                existingBuffs[existingIndex] = newBuff;
              } else if (bonusValue > existingBuffs[existingIndex].value) {
                //replace with the newer larger buff
                existingBuffs[existingIndex] = newBuff;
              }
            }
          }
        }
        return combined;
      }
    },
    async mounted() {
      if (this.combinedBonuses) {
        //trigger initial emit using permanent weapon buffs, before any button is clicked
        this.$emit('changed', this.combinedBonuses)
      }
    },
    watch: {
      combinedBonuses: function (newVal) {
        this.$emit('changed', newVal);
      },
      conditions: function (newVal) {
        this.$emit('conditions-changed', newVal);
      }
    },
    methods: {
      isAttackMod(combinedType: string) {
        return ['meleeAttack', 'rangedAttack', 'attackMod'].includes(combinedType);
      },
      isDamageMod(combinedType: string) {
        return ['damage1h', 'damage2h', 'damageMod', 'meleeDamage', 'rangedDamage'].includes(combinedType);
      },
      isApplicableAttackMod(combinedType: string) {
        return (combinedType == 'attackMod')
          || (this.isMeleeAttack && combinedType == 'meleeAttack')
          || (this.isRangedAttack && combinedType == 'rangedAttack');
      },
      isApplicableDamageMod(combinedType: string) {
        return (combinedType == 'damageMod')
          || (combinedType == 'damage1h' && this.selectedAttack.type == 'melee1h')
          || (combinedType == 'damage2h' && this.selectedAttack.type == 'melee2h')
          || (this.isMeleeAttack && combinedType == 'meleeDamage')
          || (this.isRangedAttack && combinedType == 'rangedDamage');
      },
    },
  });
  
  </script>
  