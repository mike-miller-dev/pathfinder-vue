<template>
    <div v-if="character">
        -------------------
        <BonusList :bonuses="character.partyBuffs" @changed="this.selectedPartyBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.selfBuffs" @changed="this.selectedSelfBuffs = $event" />
        -------------------
        <BonusList :bonuses="character.conditionals" @changed="this.selectedConditionals = $event" />
        -------------------
    </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import BonusList from './BonusList.vue';
  export default defineComponent({
    name: 'CombinedBuffs',
    emits: ["changed"],
    components: {
      BonusList
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
        selectedConditionals: []
      }
    },
    computed: {
      allBonuses() {
        return this.selectedSelfBuffs.concat(this.selectedConditionals, this.selectedPartyBuffs);
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
    
    watch: {
      combinedBonuses: function (newVal, oldVal) {
        this.$emit('changed', newVal);
      }
    },
    methods: {
      isLarger(oldVal, newVal) {
        return this.isNumber(oldVal) && this.isNumber(newVal) && newVal > oldVal
      },
      isNumber(value) {
        return typeof value === 'number' && isFinite(value);
      },
    },
  });
  
  </script>
  