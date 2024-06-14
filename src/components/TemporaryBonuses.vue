<template>
    <div>
        <h4>Temporary Bonuses</h4>
        <div v-for="(bonus, index) in bonuses">
            <input type="text" v-model="bonus.value" placeholder="Value">
            <select v-model="bonus.appliesTo">
                <option v-for="option in options" :value="option">
                    {{ option }}
                </option>
            </select>
            <input type="text" v-model="bonus.type" placeholder="morale, competence, etc">
            <button @click="removeRow(index)">x</button>
        </div>
        <div>
            <button @click="addRow()">+</button>
        </div>
        
    </div>
    
  
  </template>
  <script lang="ts">
  import { defineComponent } from 'vue'
  export default defineComponent({
    name: 'TemporaryBonuses',
    emits: ["changed"],
    data() {
      return {
        bonuses : [],
        options: [
          'attackMod',
          'damageMod',
          'meleeAttack',
          'damage1h',
          'damage2h',
          'extraAttacks',
          'damageDice'
        ]
      }
    },
    computed: {
        formattedBonuses() {
            return {
                name: "temporary",
                bonuses: this.bonuses
                .filter(b => b.value != null)
                .filter(b => b.appliesTo != null)
                .map(b => {
                    var mappedBonus = {};
                    mappedBonus[b.appliesTo] = b.value;
                    mappedBonus['type'] = b.type;
                    return mappedBonus;
                })
            }
        },
    },
    methods: {
        addRow() {
            this.bonuses.push({
                value: null,
                appliesTo: null,
                type: null
            });
        },
        removeRow(index) {
            this.bonuses.splice(index, 1);
        },
    },
    watch: {
        formattedBonuses: function (newVal) {
            this.$emit('changed', newVal);
        }
    },
  });
  
  </script>
  <style scoped>
    input {
      margin-right: 3px;
    }
  </style>