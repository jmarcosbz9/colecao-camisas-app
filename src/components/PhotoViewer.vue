<template>
  <div v-if="internalOpen" class="pv-overlay" @mousedown.self="close">
    <div
      ref="card"
      class="pv-card"
      :class="{ 'pv-fullscreen': isFullscreen }"
      role="dialog"
      aria-modal="true"
    >
      <div class="pv-topbar">
        <div class="pv-left">
          <div class="pv-counter">Foto {{ displayIndex }} de {{ total }}</div>

          <div v-if="fitReady" class="pv-zoom-hint">
            — Use a roda do mouse para aumentar ou diminuir o Zoom
          </div>
        </div>

        <div class="pv-right">
          <button
            class="pv-fs"
            type="button"
            @click.stop="toggleFullscreen"
            :aria-label="isFullscreen ? 'Sair da tela inteira' : 'Tela inteira'"
            :title="isFullscreen ? 'Sair da tela inteira' : 'Tela inteira'"
          >
            <img
              v-if="!isFullscreen"
              class="pv-fs-img"
              src="/icones/expandir.png"
              alt=""
              draggable="false"
            />
            <img
              v-else
              class="pv-fs-img"
              src="/icones/encolher.png"
              alt=""
              draggable="false"
            />
          </button>

          <button
            class="pv-close"
            type="button"
            @click.stop="close"
            aria-label="Fechar"
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      <div class="pv-stage">
        <button
          class="pv-nav pv-prev"
          type="button"
          :disabled="!canPrev"
          :class="{ disabled: !canPrev }"
          @click="prev"
          aria-label="Foto anterior"
          title="Anterior"
        >
          <svg class="pv-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <polyline points="15,4 7,12 15,20"></polyline>
          </svg>
        </button>

        <div
          ref="viewport"
          class="pv-viewport"
          :class="cursorClass"
          @wheel.prevent="onWheel"
          @mousedown="onMouseDown"
        >
          <div
            class="pv-center"
            :style="centerStyle"
            @mouseenter="onPhotoEnter"
            @mousemove="onPhotoMove"
            @mouseleave="onPhotoLeave"
          >
            <div class="pv-layer" :style="layerStyle">
              <img
                :key="imgKey + '|' + currentSrc"
                ref="img"
                class="pv-img"
                :src="currentSrc"
                alt=""
                draggable="false"
                @load="onImgLoad"
                @error="onImgError"
              />
            </div>
          </div>
        </div>

        <button
          class="pv-nav pv-next"
          type="button"
          :disabled="!canNext"
          :class="{ disabled: !canNext }"
          @click="next"
          aria-label="Próxima foto"
          title="Próxima"
        >
          <svg class="pv-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <polyline points="9,4 17,12 9,20"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoViewer',

  props: {
    open: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array,
      default: function () {
        return []
      },
    },
    startIndex: {
      type: Number,
      default: 0,
    },
  },

  emits: ['close'],

  data() {
    return {
      internalOpen: false,
      idx: 0,

      zoomable: false,
      fitReady: false,

      scale: 1,
      minScale: 1,
      maxScale: 8,
      tx: 0,
      ty: 0,

      baseW: 0,
      baseH: 0,

      naturalW: 0,
      naturalH: 0,

      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragBaseX: 0,
      dragBaseY: 0,

      cursorMode: 'pointer',
      wheelIdleTimer: null,

      hoverOnPhoto: false,

      isFullscreen: false,

      imgKey: 0,

      _onMove: null,
      _onUp: null,
      _onResize: null,
      _measureTimers: [],
    }
  },

  computed: {
    total() {
      return Array.isArray(this.items) ? this.items.length : 0
    },

    displayIndex() {
      return this.total ? this.idx + 1 : 0
    },

    currentItem() {
      var arr = Array.isArray(this.items) ? this.items : []
      return arr[this.idx] || null
    },

    currentSrc() {
      var it = this.currentItem || {}
      return it.fullSrc || it.thumbSrc || ''
    },

    canPrev() {
      return this.idx > 0
    },

    canNext() {
      return this.total > 0 && this.idx < this.total - 1
    },

    isZoomed() {
      return this.scale > 1.001
    },

    centerStyle() {
      var w = this.baseW > 0 ? (this.baseW + 'px') : '1px'
      var h = this.baseH > 0 ? (this.baseH + 'px') : '1px'
      return {
        width: w,
        height: h,
      }
    },

    layerStyle() {
      var t = 'translate3d(' + this.tx + 'px,' + this.ty + 'px,0) scale(' + this.scale + ')'
      return {
        width: '100%',
        height: '100%',
        transform: t,
      }
    },

    cursorClass() {
      // Durante o panning mantemos grabbing independentemente de hoverOnPhoto
      if (this.dragging) return 'pv-cursor-grabbing'

      if (!this.hoverOnPhoto) return 'pv-cursor-default'
      if (!this.fitReady) return 'pv-cursor-default'

      if (this.cursorMode === 'grabbing') return 'pv-cursor-grabbing'
      if (this.cursorMode === 'grab') return 'pv-cursor-grab'
      if (this.cursorMode === 'zoom-in') return 'pv-cursor-zoom-in'
      if (this.cursorMode === 'zoom-out') return 'pv-cursor-zoom-out'

      return 'pv-cursor-default'
    },
  },

  watch: {
    open: function (val) {
      if (val) {
        this.internalOpen = true
        this.openAt(this.startIndex)
      } else {
        this.internalOpen = false
        this.detachDragListeners()
        this.clearMeasureTimers()
        if (this.isFullscreen) this.exitFullscreen()
      }
    },

    startIndex: function (val) {
      if (this.internalOpen) this.openAt(val)
    },

    items: function () {
      if (this.internalOpen) this.openAt(this.startIndex)
    },

    currentSrc: function () {
      if (!this.internalOpen) return

      this.fitReady = false
      this.zoomable = false
      this.baseW = 0
      this.baseH = 0
      this.naturalW = 0
      this.naturalH = 0
      this.resetZoom()
      this.scheduleMeasureFromDom()
    },

    isFullscreen: function () {
      if (!this.internalOpen) return
      this.scheduleMeasureFromDom()
    },
  },

  mounted() {
    var self = this

    if (this.open) {
      this.internalOpen = true
      this.openAt(this.startIndex)
    }

    document.addEventListener('fullscreenchange', this.onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange)

    this._onResize = function () {
      if (!self.internalOpen) return
      self.scheduleMeasureFromDom()
    }
    window.addEventListener('resize', this._onResize)
  },

  beforeUnmount() {
    if (this.wheelIdleTimer) {
      clearTimeout(this.wheelIdleTimer)
      this.wheelIdleTimer = null
    }

    this.detachDragListeners()
    this.clearMeasureTimers()

    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange)

    if (this._onResize) {
      window.removeEventListener('resize', this._onResize)
      this._onResize = null
    }
  },

  methods: {
    close: function () {
      if (this.isFullscreen) this.exitFullscreen()
      this.internalOpen = false
      this.detachDragListeners()
      this.clearMeasureTimers()
      this.$emit('close')
    },

    getFullscreenElement: function () {
      return document.fullscreenElement || document.webkitFullscreenElement || null
    },

    onFullscreenChange: function () {
      this.isFullscreen = !!this.getFullscreenElement()
      this.scheduleMeasureFromDom()
    },

    toggleFullscreen: function () {
      if (this.isFullscreen) this.exitFullscreen()
      else this.enterFullscreen()
    },

    enterFullscreen: function () {
      var el = this.$refs.card
      if (!el) return
      if (el.requestFullscreen) el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    },

    exitFullscreen: function () {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    },

    openAt: function (i) {
      var n = this.total
      if (!n) {
        this.idx = 0
        return
      }

      this.idx = Math.max(0, Math.min(n - 1, Number(i) || 0))
      this.fitReady = false
      this.zoomable = false
      this.imgKey += 1
      this.resetZoom()
      this.scheduleMeasureFromDom()
    },

    prev: function () {
      if (!this.canPrev) return
      this.idx -= 1
      this.imgKey += 1
    },

    next: function () {
      if (!this.canNext) return
      this.idx += 1
      this.imgKey += 1
    },

    onImgError: function () {
      this.close()
    },

    clearMeasureTimers: function () {
      var arr = this._measureTimers || []
      var i = 0

      for (i = 0; i < arr.length; i += 1) {
        clearTimeout(arr[i])
      }

      this._measureTimers = []
    },

    scheduleMeasureFromDom: function () {
      var self = this
      var delays = [0, 40, 120, 260]
      var i = 0

      this.clearMeasureTimers()

      this.$nextTick(function () {
        for (i = 0; i < delays.length; i += 1) {
          (function (delay) {
            var t = setTimeout(function () {
              var img = self.$refs.img
              var vp = self.$refs.viewport

              if (!self.internalOpen || !img || !vp) return

              if (img.complete && img.naturalWidth && img.naturalHeight) {
                self.measureImage()
              }
            }, delay)

            self._measureTimers.push(t)
          })(delays[i])
        }
      })
    },

    onImgLoad: function () {
      this.measureImage()
    },

    measureImage: function () {
      var img = this.$refs.img
      var vp = this.$refs.viewport

      if (!img || !vp) return

      this.naturalW = img.naturalWidth || 0
      this.naturalH = img.naturalHeight || 0

      var rVp = vp.getBoundingClientRect()
      var vpW = rVp.width
      var vpH = rVp.height

      if (!vpW || !vpH || !this.naturalW || !this.naturalH) return

      var ratioW = vpW / this.naturalW
      var ratioH = vpH / this.naturalH
      var fit = Math.min(1, Math.min(ratioW, ratioH))

      this.baseW = Math.max(1, Math.floor(this.naturalW * fit))
      this.baseH = Math.max(1, Math.floor(this.naturalH * fit))

      // Simplificação pedida: toda foto carregada aceita zoom.
      this.zoomable = true

      var need = fit > 0 ? (1 / fit) : 1
      this.maxScale = Math.max(8, Math.min(16, Math.ceil(need * 2)))

      this.fitReady = true
      this.resetZoom()
    },

    resetZoom: function () {
      this.scale = 1
      this.tx = 0
      this.ty = 0
      this.dragging = false
      this.updateCursorIdle()
    },

    onPhotoEnter: function () {
      this.hoverOnPhoto = true
      this.updateCursorIdle()
    },

    onPhotoMove: function () {
      if (!this.hoverOnPhoto) {
        this.hoverOnPhoto = true
      }
      this.updateCursorIdle()
    },

    onPhotoLeave: function () {
      // Não altera hoverOnPhoto enquanto panning estiver ativo;
      // o mouseup no window já cuida de encerrar o drag.
      if (this.dragging) return
      this.hoverOnPhoto = false
    },

    updateCursorIdle: function () {
      if (!this.fitReady || !this.zoomable) {
        this.cursorMode = 'pointer'
        return
      }

      if (!this.isZoomed) this.cursorMode = 'zoom-in'
      else this.cursorMode = 'grab'
    },

    setWheelCursor: function (dir) {
      var self = this

      if (!this.fitReady || !this.zoomable) {
        this.cursorMode = 'pointer'
        return
      }

      if (this.scale >= this.maxScale - 0.001) this.cursorMode = 'zoom-out'
      else if (this.scale <= this.minScale + 0.001) this.cursorMode = 'zoom-in'
      else this.cursorMode = dir < 0 ? 'zoom-in' : 'zoom-out'

      if (this.wheelIdleTimer) clearTimeout(this.wheelIdleTimer)

      this.wheelIdleTimer = setTimeout(function () {
        self.updateCursorIdle()
      }, 260)
    },

    onWheel: function (ev) {
      if (!this.fitReady || !this.zoomable) return
      if (!this.hoverOnPhoto) return

      var dir = ev.deltaY < 0 ? -1 : 1
      var s0 = this.scale
      var factor = dir < 0 ? 1.12 : (1 / 1.12)

      var s1 = s0 * factor
      s1 = Math.max(this.minScale, Math.min(this.maxScale, s1))

      if (s1 <= 1.001) {
        this.scale = 1
        this.tx = 0
        this.ty = 0
      } else {
        var k = s1 / s0
        this.tx = this.tx * k
        this.ty = this.ty * k
        this.scale = s1
        this.clampPan()
      }

      this.setWheelCursor(dir)
    },

    onMouseDown: function (ev) {
      if (!this.fitReady || !this.zoomable) return
      if (!this.isZoomed) return
      if (!this.hoverOnPhoto) return
      if (ev && ev.button !== 0) return

      this.dragging = true
      this.cursorMode = 'grabbing'

      this.dragStartX = ev.clientX
      this.dragStartY = ev.clientY
      this.dragBaseX = this.tx
      this.dragBaseY = this.ty

      this.attachDragListeners()
    },

    attachDragListeners: function () {
      var self = this

      this._onMove = function (mv) {
        if (!self.dragging) return

        var dx = mv.clientX - self.dragStartX
        var dy = mv.clientY - self.dragStartY

        self.tx = self.dragBaseX + dx
        self.ty = self.dragBaseY + dy
        self.clampPan()
      }

      this._onUp = function (upEv) {
        self.dragging = false
        // Verifica se o mouse terminou dentro do viewport para definir o cursor correto
        var vp = self.$refs && self.$refs.viewport
        if (vp && upEv) {
          var r = vp.getBoundingClientRect()
          var inside = upEv.clientX >= r.left && upEv.clientX <= r.right &&
                       upEv.clientY >= r.top  && upEv.clientY <= r.bottom
          self.hoverOnPhoto = inside
          self.cursorMode = inside ? 'grab' : 'pointer'
        } else {
          self.hoverOnPhoto = false
          self.cursorMode = 'grab'
        }
        window.removeEventListener('mousemove', self._onMove)
        window.removeEventListener('mouseup', self._onUp)
      }

      window.addEventListener('mousemove', this._onMove)
      window.addEventListener('mouseup', this._onUp)
    },

    detachDragListeners: function () {
      if (this._onMove) window.removeEventListener('mousemove', this._onMove)
      if (this._onUp) window.removeEventListener('mouseup', this._onUp)

      this._onMove = null
      this._onUp = null
      this.dragging = false
    },

    clampPan: function () {
      var vp = this.$refs.viewport
      if (!vp) return

      var rVp = vp.getBoundingClientRect()
      var vpW = rVp.width
      var vpH = rVp.height

      var scaledW = (this.baseW || 0) * this.scale
      var scaledH = (this.baseH || 0) * this.scale

      var maxX = Math.max(0, (scaledW - vpW) / 2)
      var maxY = Math.max(0, (scaledH - vpH) / 2)

      if (this.tx > maxX) this.tx = maxX
      if (this.tx < -maxX) this.tx = -maxX
      if (this.ty > maxY) this.ty = maxY
      if (this.ty < -maxY) this.ty = -maxY
    },
  },
}
</script>

<style scoped>
.pv-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.72);
  z-index:9999;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:18px;
}

.pv-card{
  position:relative;
  width:min(1180px, calc(100vw - 28px));
  height:min(820px, calc(100vh - 28px));
  background:rgba(15,15,15,.92);
  border:1px solid rgba(255,255,255,.12);
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 18px 60px rgba(0,0,0,.55);
  display:flex;
  flex-direction:column;
}

.pv-card.pv-fullscreen{
  width:100vw;
  height:100vh;
  max-width:none;
  max-height:none;
  border-radius:0;
}

.pv-topbar{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  padding:10px 12px;
  border-bottom:1px solid rgba(255,255,255,.10);
}

.pv-left{
  display:flex;
  align-items:baseline;
  gap:12px;
  min-width:0;
}

.pv-right{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:6px;
}

.pv-counter{
  font-size:18px;
  font-weight:700;
  color:rgba(255,255,255,.92);
  white-space:nowrap;
}

.pv-zoom-hint{
  font-size:18px;
  color:rgba(255,255,255,.72);
  white-space:nowrap;
}

.pv-close{
  width:34px;
  height:34px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(0,0,0,.25);
  color:rgba(255,255,255,.92);
  font-size:24px;
  line-height:28px;
  margin-left:6px;
  margin-right:6px;
  cursor:pointer;
}

.pv-close:hover{ background:rgba(255,255,255,.10); }

.pv-fs{
  width:34px;
  height:34px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(0,0,0,.25);
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0;
  margin-right:18px;
  margin-left:0px;
}

.pv-fs:hover{ background:rgba(255,255,255,.10); }

.pv-fs-img{
  width:20px;
  height:20px;
  display:block;
  image-rendering:auto;
}

.pv-stage{
  flex:1;
  min-height:0;
  display:grid;
  grid-template-columns:78px 1fr 78px;
  align-items:center;
}

.pv-viewport{
  position:relative;
  min-height:0;
  width:100%;
  height:100%;
  overflow:hidden;
  display:flex;
  align-items:center;
  justify-content:center;
  user-select:none;
}

.pv-center{
  position:relative;
  flex:0 0 auto;
  pointer-events:auto;
}

.pv-layer{
  width:100%;
  height:100%;
  transform-origin:center center;
  will-change:transform;
}

.pv-img{
  display:block !important;
  width:100% !important;
  height:100% !important;
  max-width:none !important;
  max-height:none !important;
  object-fit:contain !important;
  user-select:none;
  pointer-events:none;
}

.pv-nav{
  position:relative;
  --pv-nav-size:54px;
  width:var(--pv-nav-size);
  height:var(--pv-nav-size);
  justify-self:center;
  align-self:center;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(0,0,0,.25);
  box-shadow:0 10px 24px rgba(0,0,0,.25);
  display:flex;
  align-items:center;
  justify-content:center;
  user-select:none;
  color:rgba(255,255,255,.95);
  cursor:pointer;
  transition: background 140ms ease, border-color 140ms ease, color 120ms ease, opacity 120ms ease;
}

.pv-chev{
  width:26px;
  height:26px;
  display:block;
}

.pv-chev polyline{
  fill:none;
  stroke:currentColor;
  stroke-width:2.2;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.pv-nav:not(.disabled):hover{
  background:rgba(255,255,255,.10);
  color:rgba(255,255,255,1);
}

.pv-nav.disabled{
  opacity:.28;
  cursor:not-allowed;
}

.pv-nav.disabled:hover{
  background:rgba(0,0,0,.25);
  color:rgba(255,255,255,.95);
}

.pv-cursor-default{ cursor:default; }
.pv-cursor-zoom-in{ cursor:zoom-in; }
.pv-cursor-zoom-out{ cursor:zoom-out; }
.pv-cursor-grab{ cursor:grab; }
.pv-cursor-grabbing{ cursor:grabbing; }

@media (max-width:900px){
  .pv-card{
    width:calc(100vw - 18px);
    height:calc(100vh - 18px);
  }

  .pv-stage{ grid-template-columns:58px 1fr 58px; }
  .pv-nav{ --pv-nav-size:44px; }
  .pv-chev{ width:22px; height:22px; }

  .pv-counter,
  .pv-zoom-hint{
    font-size:14px;
  }
}
</style>
