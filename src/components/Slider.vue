<template>
    <div class="toggle-panel">
        <label class="toggle">
        <input class="toggle-input" type="checkbox" v-model="localValue"/>
            <span class="toggle-label" data-off="Single Attack" data-on="Full Attack"></span>
            <span class="toggle-handle"></span>
        </label>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'Slider',
  emits: ["changed"],
  props : {
      value : {
        type: Boolean,
        default: false,
        required: false
      }
    },
  data() {
    return {
      localValue: this.value,
    };
  },
  watch: {
    localValue: function (newVal, oldVal) {
      this.$emit('changed', newVal);
    }
  },
});
</script>
<style scoped>
  .toggle-panel {
    width: 125px;
  }
  .toggle {
        position: relative;
        display: block;
        width: 125px;
        height: 40px;
        padding: 3px;
        margin: auto;
        border-radius: 50px;
        cursor: pointer;
    }
      .toggle-input {
         position: absolute;
         top: 0;
         left: 0;
         opacity: 0;
      }
      .toggle-label {
         position: relative;
         display: block;
         height: inherit;
         font-size: 12px;
         background: red;
         border-radius: inherit;
         box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12), inset 0 0 3px
         rgba(0, 0, 0, 0.15);
      }
      .toggle-label:before,
      .toggle-label:after {
         position: absolute;
         top: 50%;
         color: black;
         margin-top: -.5em;
         line-height: 1;
      }
      .toggle-label:before {
         content: attr(data-off);
         right: 11px;
         color: #fff;
         text-shadow: 0 1px rgba(255, 255, 255, 0.5);
      }
      .toggle-label:after {
         content: attr(data-on);
         left: 11px;
         color: #fff;
         text-shadow: 0 1px rgba(0, 0, 0, 0.2);
         opacity: 0;
      }
      .toggle-input:checked~.toggle-label {
         background: green;
      }
      .toggle-input:checked~.toggle-label:before {
         opacity: 0;
      }
      .toggle-input:checked~.toggle-label:after {
         opacity: 1;
      }
      .toggle-handle {
         position: absolute;
         top: 4px;
         left: 4px;
         width: 38px;
         height: 38px;
         background: linear-gradient(to bottom, #FFFFFF 40%, #f0f0f0);
         border-radius: 50%;
      }
      .toggle-handle:before {
         position: absolute;
         top: 50%;
         left: 50%;
         margin: -6px 0 0 -6px;
         width: 16px;
         height: 16px;
      }
      .toggle-input:checked~.toggle-handle {
         left: 89px;
         box-shadow: -1px 1px 5px rgba(0, 0, 0, 0.2);
      }

      /* Transition*/
      .toggle-label,
      .toggle-handle {
         transition: All 0.3s ease;
         -webkit-transition: All 0.3s ease;
         -moz-transition: All 0.3s ease;
         -o-transition: All 0.3s ease;
      }
</style>
