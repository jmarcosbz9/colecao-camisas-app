<template>
  <!-- Painel de Filtros Outros Times (âncora ESQUERDA p/ breadcrumb) -->
  <aside class="filters-panel" data-bc-left>
    <div class="filters-wrapper">
      <!-- Botão Limpar Filtros -->
      <button
        class="btn-clear"
        :class="{ enabled: hasAnyFilter }"
        :disabled="!hasAnyFilter"
        @click="$emit('clear-all')"
      >
        Limpar Filtros
      </button>

      <!-- Box externo que agrupa os cartões de filtro -->
      <div class="filters-stack">
        <!-- CHECKBOXES (sem Equipe) -->
        <div class="filter-card is-checkbox" v-for="key in checkboxKeys" :key="key">
          <div class="pill-title">{{ labelFor(key) }}</div>

          <div class="checklist">
            <label v-for="val in filters[key] || []" :key="key + ':' + val" class="checkline">
              <input
                type="checkbox"
                :value="val"
                :checked="isChecked(key, val)"
                @change="onToggleCheckbox(key, val, $event.target.checked)"
              />
              <span>{{ val }}</span>
            </label>

            <div v-if="!filters[key] || filters[key].length === 0" class="empty-note">
              Sem opções registradas.
            </div>
          </div>
        </div>

        <!-- SLIDER: Período (AnoInicio) -->
        <div class="filter-card">
          <div class="pill-title">Período</div>

          <div class="range-values">
            <strong>{{ ranges.AnoInicio.min }}</strong>
            <span>—</span>
            <strong>{{ ranges.AnoInicio.max }}</strong>
          </div>

          <div class="slider-box">
            <div class="slider-row">
              <div class="range-track"></div>
              <div class="range-fill" :style="rangeFillStyle('AnoInicio')"></div>

              <input
                type="range"
                class="range left"
                :min="filters.AnoInicio?.min || 0"
                :max="filters.AnoInicio?.max || 0"
                :step="1"
                v-model.number="localRanges.AnoInicio.min"
                @input="onRangeInput"
              />

              <input
                type="range"
                class="range right"
                :min="filters.AnoInicio?.min || 0"
                :max="filters.AnoInicio?.max || 0"
                :step="1"
                v-model.number="localRanges.AnoInicio.max"
                @input="onRangeInput"
              />
            </div>
          </div>
        </div>

        <!-- SLIDER: Preço -->
        <div class="filter-card">
          <div class="pill-title">Preço</div>

          <div class="range-values nowrap">
            <strong>R$ {{ formatPriceInt(ranges.Preco.min) }}</strong>
            <span>—</span>
            <strong>R$ {{ formatPriceInt(ranges.Preco.max) }}</strong>
          </div>

          <div class="slider-box">
            <div class="slider-row">
              <div class="range-track"></div>
              <div class="range-fill" :style="rangeFillStyle('Preco')"></div>

              <input
                type="range"
                class="range left"
                :min="filters.Preco?.min || 0"
                :max="filters.Preco?.max || 0"
                :step="10"
                v-model.number="localRanges.Preco.min"
                @input="onRangeInput"
              />

              <input
                type="range"
                class="range right"
                :min="filters.Preco?.min || 0"
                :max="filters.Preco?.max || 0"
                :step="10"
                v-model.number="localRanges.Preco.max"
                @input="onRangeInput"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'OutrosTimesFiltros',

  props: {
    filters: {
      type: Object,
      default: () => ({
        Fornecedora: [],
        Modelo: [],
        Manga: [],
        Conservacao: [],
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      }),
    },
    selected: {
      type: Object,
      default: () => ({
        Fornecedora: new Set(),
        Modelo: new Set(),
        Manga: new Set(),
        Conservacao: new Set(),
      }),
    },
    ranges: {
      type: Object,
      default: () => ({
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      }),
    },
  },

  emits: ['update:selected', 'update:ranges', 'clear-all'],

  data() {
    return {
      localRanges: {
        AnoInicio: { ...this.ranges.AnoInicio },
        Preco: { ...this.ranges.Preco },
      },
    }
  },

  computed: {
    checkboxKeys() {
      return ['Fornecedora', 'Modelo', 'Manga', 'Conservacao']
    },

    hasAnyFilter() {
      const ck = this.checkboxKeys.some((k) => this.selected[k]?.size > 0)
      const r =
        this.ranges.AnoInicio.min !== this.filters.AnoInicio.min ||
        this.ranges.AnoInicio.max !== this.filters.AnoInicio.max ||
        this.ranges.Preco.min !== this.filters.Preco.min ||
        this.ranges.Preco.max !== this.filters.Preco.max
      return ck || r
    },
  },

  watch: {
    ranges: {
      deep: true,
      handler(newVal) {
        this.localRanges = {
          AnoInicio: { ...newVal.AnoInicio },
          Preco: { ...newVal.Preco },
        }
      },
    },
  },

  methods: {
    labelFor(key) {
      const map = {
        Modelo: 'Modelo',
        Fornecedora: 'Fornecedora',
        Manga: 'Manga',
        Conservacao: 'Conservação',
      }
      return map[key] || key
    },

    isChecked(key, val) {
      return this.selected[key]?.has(val)
    },

    onToggleCheckbox(key, val, checked) {
      const newSelected = { ...this.selected }
      if (!newSelected[key]) newSelected[key] = new Set()
      else newSelected[key] = new Set(newSelected[key])

      if (checked) newSelected[key].add(val)
      else newSelected[key].delete(val)

      this.$emit('update:selected', newSelected)
    },
    onRangeInput() {
      // Garante min <= max (e evita valores "invertidos" ao cruzar os thumbs)
      if (this.localRanges.AnoInicio.min > this.localRanges.AnoInicio.max) {
        ;[this.localRanges.AnoInicio.min, this.localRanges.AnoInicio.max] = [
          this.localRanges.AnoInicio.max,
          this.localRanges.AnoInicio.min,
        ]
      }
      if (this.localRanges.Preco.min > this.localRanges.Preco.max) {
        ;[this.localRanges.Preco.min, this.localRanges.Preco.max] = [
          this.localRanges.Preco.max,
          this.localRanges.Preco.min,
        ]
      }

      // Normaliza para número inteiro (evita floats escaparem para a querystring)
      this.localRanges.AnoInicio.min = Math.round(Number(this.localRanges.AnoInicio.min || 0))
      this.localRanges.AnoInicio.max = Math.round(Number(this.localRanges.AnoInicio.max || 0))
      this.localRanges.Preco.min = Math.round(Number(this.localRanges.Preco.min || 0))
      this.localRanges.Preco.max = Math.round(Number(this.localRanges.Preco.max || 0))

      // Emite SEM compartilhar referências internas (deep copy)
      this.$emit('update:ranges', {
        AnoInicio: { ...this.localRanges.AnoInicio },
        Preco: { ...this.localRanges.Preco },
      })
    },

    rangeFillStyle(kind) {
      const base = this.filters?.[kind] || { min: 0, max: 0 }
      const cur = this.localRanges?.[kind] || { min: 0, max: 0 }

      const total = Math.max(1, base.max - base.min)
      const curMinClamped = Math.max(base.min, Math.min(base.max, cur.min))
      const curMaxClamped = Math.max(base.min, Math.min(base.max, cur.max))

      const left = ((curMinClamped - base.min) / total) * 100
      const width = ((curMaxClamped - curMinClamped) / total) * 100

      return {
        left: `${Math.max(0, Math.min(100, left))}%`,
        width: `${Math.max(0, Math.min(100, width))}%`,
      }
    },

    formatPriceInt(v) {
      if (v == null) return '0'
      const n = Math.round(Number(v))
      return n.toLocaleString('pt-BR')
    },
  },
}
</script>

<style scoped>
/* Tema Outros Times (azul-marinho + branco) */
.filters-panel {
  position: relative;
}

.filters-wrapper {
  position: sticky;
  top: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.btn-clear {
  align-self: center;
  width: auto;
  max-width: 240px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e3e3e3;
  font-weight: 800;
  text-align: center;
}

/* estado desabilitado REAL (atributo disabled) */
.btn-clear:disabled {
  background: #bfbfbf;
  color: #fff;
  cursor: not-allowed;
}

/* estado habilitado visual (classe enabled) */
.btn-clear.enabled {
  background: #0b2340;
  color: #fff;
  cursor: pointer;
}

.filters-stack {
  background: #f4f4f4;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-card {
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 10px;
}

.filter-card.is-checkbox {
  padding-top: 14px;
  padding-bottom: 14px;
}

.filter-card.is-checkbox .checklist {
  margin-top: 12px;
}

.filter-card.is-search {
  padding: 14px 10px;
}

.filter-card .pill-title {
  display: block;
  width: max-content;
  margin: 0 auto 8px;
  padding: 4px 8px;
  background: #0b2340;
  color: #fff;
  font-weight: 700;
  border-radius: 8px;
  line-height: 1.1;
}

/* SEARCH BOX */
.search-box {
  position: relative;
  margin-top: 10px;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 10px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #0b2340;
}

.search-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
}

.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: #0b2340;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.search-clear:hover {
  background: #1a3a5c;
}

.search-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.search-hint strong {
  color: #0b2340;
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-note {
  font-size: 12px;
  color: #777;
}

/* CHECKBOXES (Outros Times) */
.checkline input[type='checkbox'] {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #555;
  border-radius: 4px;
  background: #fff;
  display: inline-grid;
  place-content: center;
  cursor: pointer;
  position: relative;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.checkline input[type='checkbox']:focus-visible {
  outline: 2px solid #0b2340;
  outline-offset: 2px;
}

.checkline input[type='checkbox']:hover {
  border-color: #0b2340;
}

.checkline input[type='checkbox']:checked {
  background: #0b2340;
  border-color: #0b2340;
}

.checkline input[type='checkbox']:checked::after {
  content: '✔';
  color: #fff;
  font-size: 14px;
  line-height: 1;
  font-weight: 800;
}

/* SLIDERS */
.slider-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-row {
  position: relative;
  height: 36px;
  overflow: visible;
}

.range-track {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 1;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.range-fill {
  position: absolute;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  border-radius: 2px;
  z-index: 2;
  background: linear-gradient(90deg, #0a1d33 0%, #0b2340 40%, #1a3a5c 100%);
  box-shadow: inset 0 0 0 1px rgba(11, 35, 64, 0.15);
  transition:
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.slider-row:has(.range:active) .range-fill,
.slider-row:has(.range:focus-visible) .range-fill {
  box-shadow:
    inset 0 0 0 1px rgba(11, 35, 64, 0.25),
    0 0 8px rgba(11, 35, 64, 0.35);
  filter: saturate(1.05);
}

.range {
  position: absolute;
  left: 0;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
  height: 0;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  z-index: 3;
}

.range.left {
  z-index: 4;
}

.range.right {
  z-index: 5;
}

.range::-webkit-slider-runnable-track {
  background: transparent;
}

.range::-moz-range-track {
  background: transparent;
}

.range::-webkit-slider-thumb {
  pointer-events: auto;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0b2340;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #0b2340;
}

.range::-moz-range-thumb {
  pointer-events: auto;
  cursor: pointer;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0b2340;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #0b2340;
}

/* Thumb: mão "grabbing" enquanto arrasta (mouse down) */
.range:active::-webkit-slider-thumb,
.range::-webkit-slider-thumb:active {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

.range:active::-moz-range-thumb,
.range::-moz-range-thumb:active {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}

.range-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 800;
}

.nowrap {
  white-space: nowrap;
}
</style>
