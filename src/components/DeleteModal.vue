<template>
  <div
    v-if="open"
    class="del-overlay"
    role="presentation"
    tabindex="-1"
    @keydown.esc.prevent="onNo"
    @click.self="onNo"
  >
    <div class="del-card" :class="[variantClass, choiceClass]" role="dialog" aria-modal="true" aria-label="Apagar">
      <div class="del-body">
        <img class="del-icon" :src="iconSrc" alt="" />
        <div class="del-text">
          <div class="del-title">Apagar?</div>
          <div v-if="error" class="del-error">{{ error }}</div>
        </div>
      </div>

      <div class="del-actions">
        <button ref="btnNo" class="btn btn-no" :disabled="busy" @click="onNo">Não</button>
        <button class="btn btn-yes" :disabled="busy" @click="onYes">
          {{ busy ? 'Apagando…' : 'Sim' }}
        </button>
      </div>

      <div v-if="busy" class="del-status">Apagando...</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteModal',
  props: {
    open: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    error: { type: String, default: '' },
    variant: { type: String, default: 'outros' }, // 'outros' | 'fla'
    icon: { type: String, default: '/icones/recycle-bin.png' },
  },
  data() {
    return {
      // default: "Não" destacado
      choice: 'no', // 'no' | 'yes'
    }
  },
  computed: {
    variantClass() {
      return this.variant === 'fla' ? 'del--fla' : 'del--outros'
    },
    choiceClass() {
      return this.choice === 'yes' ? 'del-choice-yes' : 'del-choice-no'
    },
    iconSrc() {
      return this.icon
    },
  },
  watch: {
    open(v) {
      if (v) {
        // toda vez que abre: volta para "Não" ativo
        this.choice = 'no'
        this.$nextTick(this.focusSelf)
      }
    },
  },
  mounted() {
    if (this.open) this.$nextTick(this.focusSelf)
  },
  methods: {
    focusSelf() {
      try {
        // default focus on "Não" (safer default action)
        const btn = this.$refs && this.$refs.btnNo
        if (btn && btn.focus && !btn.disabled) {
          btn.focus()
          return
        }
        const el = this.$el
        if (el && el.focus) el.focus()
      } catch (e) {
        /* noop */
      }
    },
    onNo() {
      this.choice = 'no'
      this.$emit('cancel')
    },
    onYes() {
      // alterna destaque para o "Sim" imediatamente (mesmo que dê 403)
      this.choice = 'yes'
      this.$emit('confirm')
    },
  },
}
</script>


<style scoped>
.del-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.del-card {
  width: min(420px, calc(100vw - 36px));
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  padding: 18px 18px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.del-body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.del-icon {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  object-fit: contain;
}

.del-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 2px;
}

.del-error {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.25;
  color: #000;
  font-weight: 700;
  max-width: 320px;
  word-break: break-word;
}

.del-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}


.del-status {
  margin-top: 10px;
  font-size: 15px;
  font-weight: 800;
  color: #000;
}

/* botões */
.btn {
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 800;
  border: 1px solid transparent;
  cursor: pointer;
  min-width: 92px;
}

.btn:disabled {
  opacity: 0.55;
  cursor: default;
}

/* tema Outros Times (azul) */
.del--outros.del-choice-no .btn-no {
  background: #0a2a66;
  border-color: #0a2a66;
  color: #fff;
}
.del--outros.del-choice-no .btn-yes {
  background: #fff;
  border-color: #0a2a66;
  color: #0a2a66;
}
.del--outros.del-choice-yes .btn-no {
  background: #fff;
  border-color: #0a2a66;
  color: #0a2a66;
}
.del--outros.del-choice-yes .btn-yes {
  background: #0a2a66;
  border-color: #0a2a66;
  color: #fff;
}

/* tema Flamengo (preto/vermelho) */
.del--fla.del-choice-no .btn-no {
  background: #000;
  border-color: #000;
  color: #c00000;
}
.del--fla.del-choice-no .btn-yes {
  background: #fff;
  border-color: #000;
  color: #000;
}
.del--fla.del-choice-yes .btn-no {
  background: #fff;
  border-color: #000;
  color: #000;
}
.del--fla.del-choice-yes .btn-yes {
  background: #000;
  border-color: #000;
  color: #c00000;
}

@media (max-width: 420px) {
  .del-title {
    font-size: 20px;
  }
  .del-icon {
    width: 48px;
    height: 48px;
    flex-basis: 48px;
  }
}
</style>
