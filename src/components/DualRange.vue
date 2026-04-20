<!-- frontend/src/components/DualRange.vue -->
<template>
  <div class="dual-range">
    <div class="dual-range__values">
      {{ unit }}{{ display(left) }} — {{ unit }}{{ display(right) }}
    </div>
    <div class="dual-range__track">
      <!-- inputs invisíveis capturam o drag -->
      <input class="range-input left" type="range"
             :min="min" :max="max" :step="step"
             :value="left" @input="onLeftInput" @change="$emit('change')" />
      <input class="range-input right" type="range"
             :min="min" :max="max" :step="step"
             :value="right" @input="onRightInput" @change="$emit('change')" />

      <div class="track-bg"></div>
      <div class="track-fill" :style="{ left: leftPct + '%', width: (rightPct - leftPct) + '%' }"></div>
      <div class="thumb left-thumb" :style="{ left: 'calc(' + leftPct + '% - 8px)' }"></div>
      <div class="thumb right-thumb" :style="{ left: 'calc(' + rightPct + '% - 8px)' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, watch, ref } from 'vue';

const props = defineProps<{
  min: number; max: number; step?: number; unit?: string;
  minValue: number; maxValue: number;
}>();
const emit = defineEmits<{
  (e:'update:minValue', v:number): void
  (e:'update:maxValue', v:number): void
  (e:'input'): void
  (e:'change'): void
}>();

const min = toRef(props, 'min');
const max = toRef(props, 'max');
const step = computed(()=> props.step ?? 1);
const unit = computed(()=> props.unit ?? '');

const left = ref(props.minValue);
const right = ref(props.maxValue);
watch(() => props.minValue, v => { left.value = v; });
watch(() => props.maxValue, v => { right.value = v; });

const range = computed(()=> Math.max(max.value - min.value, 1));
const leftPct  = computed(()=> ((left.value  - min.value) / range.value) * 100);
const rightPct = computed(()=> ((right.value - min.value) / range.value) * 100);

function onLeftInput(e: Event){
  const v = Number((e.target as HTMLInputElement).value);
  left.value = Math.min(v, right.value);
  emit('update:minValue', left.value);
  emit('input');
}
function onRightInput(e: Event){
  const v = Number((e.target as HTMLInputElement).value);
  right.value = Math.max(v, left.value);
  emit('update:maxValue', right.value);
  emit('input');
}
function display(v:number){
  const s = step.value ?? 1;
  return s >= 1 ? String(Math.round(v)) : v.toFixed(2);
}
</script>

<style scoped>
:root{
  --accent: #ff0000;
  --gray-300: #e5e5e5;
}
.dual-range{ display:flex; flex-direction:column; gap:8px; }
.dual-range__values{ text-align:center; font-size:13px; color:#333; }
.dual-range__track{ position:relative; height:24px; }
.range-input{
  position:absolute; inset:0; appearance:none; background:transparent; margin:0; cursor:pointer; height:24px;
}
.range-input::-webkit-slider-thumb{ -webkit-appearance:none; width:0; height:0; }
.range-input::-moz-range-thumb{ width:0; height:0; border:0; }
.range-input::-webkit-slider-runnable-track{ background:transparent; height:24px; }
.range-input::-moz-range-track{ background:transparent; height:24px; }
.track-bg{
  position:absolute; left:0; right:0; top:50%; height:6px; transform:translateY(-50%);
  background:#dcdcdc; border-radius:999px;
}
.track-fill{
  position:absolute; top:50%; height:6px; transform:translateY(-50%);
  background: var(--accent); border-radius:999px;
}
.thumb{
  position:absolute; top:50%; width:16px; height:16px; transform:translate(-0, -50%);
  background:#000; border:2px solid var(--accent); border-radius:50%;
  box-shadow: 0 1px 2px rgba(0,0,0,.2);
  pointer-events:none;
}
.left-thumb{ z-index:3; } .right-thumb{ z-index:3; }
</style>
