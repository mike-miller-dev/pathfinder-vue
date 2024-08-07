<template>
    <div v-if="character">
        -------------------
        <BonusList :bonuses="character.partyBuffs" @changed="this.selectedPartyBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.selfBuffs" @changed="this.selectedSelfBuffs = $event" />
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
        return this.selectedSelfBuffs.concat(this.selectedActions, this.selectedPartyBuffs, this.temporaryBuffs, this.weaponBonuses);
      },
      conditions() {
        return this.selectedBuffs.filter(b => b.conditions != null).flatMap(b => b.conditions);
      },
      appliedConditionals() {
          if(!this.selectedAttack || !this.selectedAttack.conditionalBonuses) {
            return [];
          }
          return this.selectedAttack.conditionalBonuses.filter(c => this.conditions.includes(c.condition));
      },
      allBonuses() {
        return this.selectedBuffs.concat(this.appliedConditionals);
      },
      isMeleeAttack() {
        return this.selectedAttack.type.includes('melee');
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
              if (combinedType == 'damage1h' || combinedType == 'damage2h' || combinedType == 'meleeDamage') {
                if ((combinedType == 'damage1h' && this.selectedAttack.type == 'melee1h')
                  || (combinedType == 'damage2h' && this.selectedAttack.type == 'melee2h')
                  || (combinedType == 'meleeDamage')) {
                  combinedType = 'damageMod';
                } else {
                  continue;
                }
              }

              if (combinedType == 'meleeAttack') {
                if (this.isMeleeAttack) {
                  combinedType = 'attackMod';
                } else {
                  continue;
                }
              }


              let propertyValue = bonus[bonusField];
              //example propertyValue: 4
              
              if (combined.hasOwnProperty(combinedType)) {
                let existingBuffs = combined[combinedType];
                let existingIndex = existingBuffs.findIndex(existingBuff => bonus.type && existingBuff.type === bonus.type);
                if (existingIndex < 0) {
                  //add a new type to the existing buffs
                  combined[combinedType].push({
                    'name': buff.name,
                    'value': propertyValue,
                    'type': bonus.type
                  });
                } else {
                  let existingSameTypeBuff = existingBuffs[existingIndex];
                  if (this.isLarger(existingSameTypeBuff.value, propertyValue)) {
                    //replace with the newer larger buff
                    combined[combinedType][existingIndex] = {
                      'name': buff.name,
                      'value': propertyValue,
                      'type': bonus.type
                    };
                }
                }
              } else {
                //push a new type with the new buff
                combined[combinedType] = [{
                  'name': buff.name,
                  'value': propertyValue,
                  'type': bonus.type
                }];
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
    },
  });
  
  </script>
  