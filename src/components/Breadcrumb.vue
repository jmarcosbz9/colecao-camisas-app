<template>
  <nav
    class="bc-bar"
    :class="themeClass"
    :style="{
      left: barPos.left + 'px',
      width: barPos.width + 'px',
      marginTop: gapTop + 'px',
      marginBottom: gapBottom + 'px'
    }"
    aria-label="breadcrumb"
  >
    <!-- Lado esquerdo: casa / raiz / segmentos -->
    <div class="bc-left" :style="{ marginLeft: leftPad + 'px' }">
      <!-- Casa -->
      <a class="bc-home" :href="homeHref" title="Home">
        <img :src="houseIcon" alt="Home" />
      </a>

      <span class="bc-sep">/</span>

      <!-- Raiz (abre menu) -->
      <div
        class="bc-item bc-root"
        @mouseenter="openMenuWithIntent(true, $event)"
        @mouseleave="scheduleClose(true)"
      >
        <span class="bc-link">{{ rootLabel }}</span>

        <!-- Dropdown raiz -->
        <ul
          v-if="menus.root.visible"
          class="bc-dropdown"
          :class="themeMenuClass"
          :style="{
            ...menus.root.style,
            minWidth: menuWidth + 'px',
            width: menuWidth + 'px'
          }"
          @mouseenter="hovering.menu.root = true"
          @mouseleave="leaveMenu(true)"
        >
          <li @click="emitNav('graficos')">Gráficos</li>
          <li @click="emitNav('formularios')">Formulários</li>
          <li @click="emitNav('estatisticas')">Estatísticas</li>
        </ul>
      </div>

      <!-- Níveis adicionais (opcionais) -->
      <template v-for="(seg, i) in tailSegments" :key="i">
        <span class="bc-sep">/</span>
        <span class="bc-item bc-tail">{{ seg }}</span>
      </template>
    </div>

    <!-- Lado direito: contador -->
    <div class="bc-right" :style="{ marginRight: rightPad + 'px' }">
      <span class="bc-counter">
        Exibindo {{ visibleRecords }} de {{ totalRecords }} registros
      </span>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Breadcrumb',
  props: {
    // contexto visual
    context: { type: String, default: 'flamengo' }, // 'flamengo' | 'outros'

    // onde medir a largura da barra: borda esquerda dos filtros até fim do grid
    leftSelector:  { type: String, default: '.filters-left, .filters, [data-bc-left]' },
    rightSelector: { type: String, default: '.grid-wrap, .grid, [data-bc-right]' },

    // respiros vertical/horizontal da barra
    gapTop:    { type: Number, default: 12 },
    gapBottom: { type: Number, default: 12 },
    leftPad:   { type: Number, default: 0 },
    rightPad:  { type: Number, default: 0 },

    // segmentos textuais (ex.: ['Gráficos'])
    segments:  { type: Array,  default: () => [] },
    homeHref:  { type: String, default: '/' },

    // contadores dinâmicos
    visibleRecords: { type: Number, default: 0 },
    totalRecords:   { type: Number, default: 0 },

    // ajustes finos de largura da barra
    offsetLeft:  { type: Number, default: 0 },
    offsetRight: { type: Number, default: 0 },

    // posicionamento do menu (drop) e anti-bleeding
    menuAnchorX:        { type: Number, default: 0.55 }, // 0..1 (fração da largura do item)
    menuOffsetX:        { type: Number, default: -6 },   // px
    menuOffsetY:        { type: Number, default: -6 },   // px (negativo sobrepõe)
    menuEstimatedWidth: { type: Number, default: 200 },  // controla LARGURA
    menuClamp:          { type: Boolean, default: true } // evita sangria nas bordas
  },
  data () {
    return {
      barPos: { left: 16, width: 960 },
      menus: {
        root: {
          visible: false,
          style: { left: '0px', top: '0px', position: 'fixed', zIndex: 9999 } // usa viewport
        }
      },
      timers: { root: null },
      hovering: { trigger: { root: false }, menu: { root: false } }
    }
  },
  computed: {
    themeClass ()     { return this.context === 'outros' ? 'bc-outros' : 'bc-flamengo' },
    themeMenuClass () { return this.context === 'outros' ? 'theme-outros' : 'theme-flamengo' },
    houseIcon ()      { return this.context === 'outros'
                          ? '/icones/casa_branca.png'
                          : '/icones/casa_vermelha.png' },
    rootLabel ()      { return this.context === 'outros' ? 'Outros Times' : 'O Manto Sagrado' },
    tailSegments ()   { return Array.isArray(this.segments) ? this.segments : [] },

    // largura efetiva do menu (pode ser ajustada por página)
    menuWidth ()      { return Math.max(120, Number(this.menuEstimatedWidth) || 200) }
  },
  mounted () {
    this.recomputeBar()
    window.addEventListener('resize', this.recomputeBar, { passive: true })
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.recomputeBar)
  },
  methods: {
    // calcula left/width do breadcrumb entre filtros e grid
    recomputeBar () {
      const leftEl  = document.querySelector(this.leftSelector)
      const rightEl = document.querySelector(this.rightSelector)

      if (leftEl && rightEl) {
        const l = leftEl.getBoundingClientRect()
        const r = rightEl.getBoundingClientRect()
        const scrollX = window.scrollX || window.pageXOffset || 0

        const left  = Math.max(0, Math.round(l.left + scrollX + this.offsetLeft))
        const right = Math.round(r.right + scrollX + this.offsetRight)
        const width = Math.max(280, right - left)

        this.barPos = { left, width }
        return
      }

      // fallback (tela cheia com padding básico)
      const pad = 16
      const vw = document.documentElement.clientWidth
      this.barPos = { left: pad, width: Math.max(320, vw - pad * 2) }
    },

    // abre o menu na posição “ancorada” ao item
    openMenuWithIntent (isRoot, evt) {
      if (!isRoot) return
      this.hovering.trigger.root = true

      const target = evt?.currentTarget
      if (!target) return

      const rect = target.getBoundingClientRect()

      // horizontal: fração da largura + offset fino
      let left = Math.round(rect.left + rect.width * this.menuAnchorX + this.menuOffsetX)
      // vertical: base no bottom, offset (negativo sobrepõe um pouco)
      let top  = Math.round(rect.bottom + this.menuOffsetY)

      // anti-bleeding opcional (usa a largura pedida)
      if (this.menuClamp) {
        const vw = window.innerWidth || document.documentElement.clientWidth
        const estW = this.menuWidth
        const margin = 8
        if (left + estW > vw - margin) left = Math.max(margin, vw - estW - margin)
        if (left < margin) left = margin
      }

      clearTimeout(this.timers.root)
      this.menus.root.style = {
        position: 'fixed', // usa viewport — não muda ao rolar
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 9999
      }
      this.menus.root.visible = true
    },

    scheduleClose (isRoot) {
      if (!isRoot) return
      this.hovering.trigger.root = false
      clearTimeout(this.timers.root)
      this.timers.root = setTimeout(() => {
        if (!this.hovering.trigger.root && !this.hovering.menu.root) {
          this.menus.root.visible = false
        }
      }, 180)
    },

    leaveMenu (isRoot) {
      if (!isRoot) return
      this.hovering.menu.root = false
      this.scheduleClose(true)
    },

    emitNav (to) {
      this.$emit('navigate', to)
      this.menus.root.visible = false
    }
  }
}
</script>

<style>
/* ===== Barra ===== */
.bc-bar{
  position: relative;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* esquerda | direita */
  padding: 6px 10px;
  border-radius: 10px;
  box-sizing: border-box;
  gap: 8px;
}

/* trilha esquerda */
.bc-left{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* contador à direita */
.bc-right{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

/* contador — sem negrito exagerado */
.bc-counter{
  opacity: .95;
  font-weight: 500;
}

/* Tema Flamengo (preto + vermelho) */
.bc-flamengo{
  background: #000;
  color: #e11d2f;
  box-shadow: 0 10px 24px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.18);
}

/* Tema Outros (azul-marinho + branco) */
.bc-outros{
  background: #0b2340;
  color: #fff;
  box-shadow: 0 10px 24px rgba(7,16,32,.22), 0 2px 6px rgba(7,16,32,.18);
}

/* Casa */
.bc-home{
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.bc-home img{
  width: 18px;
  height: 18px;
  display: block;
}

/* Itens */
.bc-item{
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  font-weight: 400;          /* remove “negrito” visual */
}
.bc-root .bc-link{
  cursor: pointer;           /* mãozinha no hover da raiz */
}
.bc-tail{
  opacity: .95;
}

.bc-sep{
  opacity: .6;
  user-select: none;
}

/* Dropdown raiz */
.bc-dropdown{
  position: fixed;           /* acompanha viewport */
  background: #f3f4f6;
  color: #111;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px;
  margin: 0;
  list-style: none;
  /* min-width padrão pequeno; será sobrescrito inline por width/minWidth */
  min-width: 120px;
  box-shadow: 0 12px 28px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.12);
  z-index: 9999;
}
.bc-dropdown li{
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background .12s ease, color .12s ease;
}

/* Hovers por tema */
.theme-flamengo.bc-dropdown li:hover{
  background: #000;
  color: #e11d2f;
}
.theme-outros.bc-dropdown li:hover{
  background: #0b2340;
  color: #fff;
}

/* Responsivo */
@media (max-width: 980px){
  .bc-bar{ height: 34px; padding: 5px 8px; gap: 6px; }
  .bc-dropdown{ min-width: 120px; }
}
@media (max-width: 680px){
  .bc-bar{ height: 32px; padding: 4px 8px; gap: 6px; }
  .bc-dropdown{ min-width: 120px; }
}
</style>
