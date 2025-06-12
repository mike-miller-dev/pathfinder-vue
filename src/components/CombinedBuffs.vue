<template>
    <div v-if="character">
        -------------------
        <BonusList :bonuses="character.partyBuffs" @changed="this.selectedPartyBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.selfBuffs" @changed="this.selectedSelfBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.weaponBuffs" @changed="this.selectedWeaponBuffs = $event" :select-one="true" />
        -------------------
        <BonusList :bonuses="character.actions" @changed="this.selectedActions = $event" />
        -------------------
        <TemporaryBonuses @changed="this.temporaryBuffs = $event" />
        -------------------
    </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import Bonus from '@/models/Bonus.vue';
  import BonusList from './BonusList.vue';
  import TemporaryBonuses from './TemporaryBonuses.vue';
  export default defineComponent({
    name: 'CombinedBuffs',
    emits: ["changed"],
    components: {
      BonusList,
      TemporaryBonuses
    },
    props : {
      character : {
        type: Object,
        required: true
      },
      selectedAttack : {
        type: Object,
        required: true
      },
    },
    data() {
      return {
        selectedSelfBuffs: [],
        selectedPartyBuffs: [],
        selectedWeaponBuffs: [],
        selectedActions: [],
        temporaryBuffs: []
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
        return this.selectedBuffs.filter(b => b.conditions != null).flatMap(b => b.conditions);
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
        let combined = {};

        for (var buffIndex in this.allBonuses) {
          let buff = this.allBonuses[buffIndex];
          //example buff: { name: 'bulls strength', selected: true, bonuses: [{ strength: 4, type: 'enh'}] }

          for (var bonusIndex in buff.bonuses) {
            let bonus = buff.bonuses[bonusIndex];
            //example bonus: { strength: 4, type: 'enh'}

            for (var bonusField in bonus) {
              if (bonusField == 'type') {
                continue;
              }

              let combinedType = bonusField;
              if (this.isDamageMod(combinedType)) {
                if (this.isApplicableDamageMod(combinedType)) {
                  combinedType = 'damageMod';
                } else {
                  // it is a damage mod, but not one applicable to their selected weapon
                  continue;
                }
              }

              if (this.isAttackMod(combinedType)) {
                if (this.isApplicableAttackMod(combinedType)) {
                  combinedType = 'attackMod';
                } else {
                  continue;
                }
              }


              let bonusValue = bonus[bonusField];
              //example bonusValue: 4

              let newBuff = {
                'name': buff.name,
                'value': bonusValue,
                'type': bonus.type,
                'stacks': bonus.stacks,
                'nested': bonus.nested
              };

              if (combined.hasOwnProperty(combinedType)) {
                let existingBuffs = combined[combinedType];
                let existingIndex = existingBuffs.findIndex((existingBuff: Bonus) => bonus.type && existingBuff.type === bonus.type);

                if (existingIndex >= 0) {
                  let existingBuff = existingBuffs[existingIndex];

                  if (bonus.stacks || existingBuff.stacks) {
                    //increase the value of the existing buff
                    newBuff.value += existingBuff.value;
                    combined[combinedType][existingIndex] = newBuff;
                  } else if (bonusValue > existingBuff.value) {
                    //replace with the newer larger buff
                    combined[combinedType][existingIndex] = newBuff;
                  }
                } else {
                  //add a new type to the existing buffs
                  combined[combinedType].push(newBuff);
                }

              } else {
                //push a new type with the new buff
                combined[combinedType] = [newBuff];
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
    },
    methods: {
      isLarger(oldVal: Number, newVal: Number) {
        return newVal > oldVal
      },
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
  