<template>
  <div v-for="bonus in bonuses">
    <input type="checkbox" :key="bonus.name" :value="bonus" :id="bonus.name" v-model="selectedBuffs">
    <label :for="bonus.name">{{bonus.name}}</label>
  </div>

</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'BonusList',
  emits: ["changed"],
  props : {
    bonuses : {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedBuffs: []
    }
  },  
  watch: {
    selectedBuffs: function (newVal, oldVal) {
      this.$emit('changed', newVal);
    }
  },
});

</script>
