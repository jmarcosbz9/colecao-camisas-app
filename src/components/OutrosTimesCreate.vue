<template>
  <div v-if="open" class="otc-backdrop" @mousedown.self="onBackdropMouseDown">
    <div
      ref="modal"
      class="otc-modal"
      :style="{ top: modalPos.top, left: modalPos.left }"
      role="dialog"
      aria-modal="true"
    >
		<header class="otc-header" @mousedown="startDrag">
		  <h2 class="otc-title">
			<img
			  class="ot-create-title__icon"
			  src="/icones/Pequenos_Rio.png"
			  alt=""
			  aria-hidden="true"
			  draggable="false"
			  @mousedown.stop
			/>
			<span>Nova Camisa</span>
		  </h2>
		  <button type="button" class="otc-close" @click="close" aria-label="Fechar">×</button>
		</header>

      <!-- IMPORTANTE: não deixa ENTER fazer submit implícito no form -->
      <form class="otc-body" @submit.prevent="submitCreate" spellcheck="false">
        
        <!-- Rascunho (Create/Update) -->
        <div v-if="draftOffer.show" class="draft-bar">
          <div class="draft-text">
            Rascunho encontrado.<span v-if="draftOffer.hadPhotos"> Fotos precisarão ser selecionadas novamente.</span>
          </div>
          <div class="draft-actions">
            <button type="button" class="btn ghost sm" @click="applyDraft">Restaurar</button>
            <button type="button" class="btn ghost sm" @click="discardDraft">Descartar</button>
          </div>
        </div>
		<!-- 1ª Linha: Equipe -->
        <div class="row one">
          <div class="field">
            <label class="lbl" for="otc-equipe">Equipe</label>
            <input
              id="otc-equipe"
              ref="equipe"
              v-model.trim="form.Equipe"
              class="inp"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Ex:Grêmio, Milan, Holanda (ou Seleção da Holanda)"
              @keydown.enter.prevent="focusRef('ddFornecedora')"
            />
          </div>
        </div>

        <!-- 2ª linha: Fornecedora e Manga -->
        <div class="row two">
         <div class="field">
		  <label class="lbl">Fornecedora</label>

		  <div class="dd-wrap">
			<div
			  ref="ddFornecedora"
			  class="dd"
			  tabindex="0"
			  @click="toggleDropdown('Fornecedora')"
			  @keydown.enter.prevent="toggleDropdown('Fornecedora')"
			>
			  <span class="dd-val" :class="{ ph: !form.Fornecedora, filled: !!form.Fornecedora }">{{ form.Fornecedora ? form.Fornecedora : '— Selecione —' }}</span>
			  <span :class="['dd-arr', { open: dropdownOpen.Fornecedora }]" aria-hidden="true"></span>
			</div>

			<ul v-if="dropdownOpen.Fornecedora" class="dd-menu">
			  <li v-if="fornecedorasLoading" class="dd-item muted">Carregando…</li>

			  <li
				v-for="opt in fornecedorasOptions"
				:key="'fornec:' + opt.id"
				class="dd-item"
				@click.stop="selectFornecedora(opt)"
			  >{{ opt.nome }}</li>

			  <li v-if="!fornecedorasLoading && fornecedorasOptions.length === 0" class="dd-item muted">
				Nenhuma fornecedora
			  </li>
			</ul>
		  </div>

		  <button
			type="button"
			class="forn-help-link"
			@click.stop="openAddFornec"
		  >
			Não encontrou a fornecedora?
		  </button>
         </div>


          <div class="field">
            <label class="lbl">Manga</label>
            <div class="dd-wrap">
              <div
                ref="ddManga"
                class="dd"
                tabindex="0"
                @click="toggleDropdown('Manga')"
                @keydown.enter.prevent="toggleDropdown('Manga')"
              >
                <span class="dd-val" :class="{ ph: !form.Manga, filled: !!form.Manga }">{{ form.Manga ? form.Manga : '— Selecione —' }}</span>
                <span :class="['dd-arr', { open: dropdownOpen.Manga }]" aria-hidden="true"></span>
              </div>
              <ul v-if="dropdownOpen.Manga" class="dd-menu">
                <li
                  v-for="opt in enumOptions.Manga"
                  :key="'Manga:' + opt"
                  class="dd-item"
                  @click.stop="selectOption('Manga', opt)"
                >{{ opt }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 3ª linha: Conservação e Período -->
        <div class="row two">
          <div class="field">
            <label class="lbl">Conservação</label>
            <div class="dd-wrap">
              <div
                ref="ddConservacao"
                class="dd"
                tabindex="0"
                @click="toggleDropdown('Conservacao')"
                @keydown.enter.prevent="toggleDropdown('Conservacao')"
              >
                <span class="dd-val" :class="{ ph: !form.Conservacao, filled: !!form.Conservacao }">{{ form.Conservacao ? form.Conservacao : '— Selecione —' }}</span>
                <span :class="['dd-arr', { open: dropdownOpen.Conservacao }]" aria-hidden="true"></span>
              </div>
              <ul v-if="dropdownOpen.Conservacao" class="dd-menu">
                <li
                  v-for="opt in enumOptions.Conservacao"
                  :key="'Conservacao:' + opt"
                  class="dd-item"
                  @click.stop="selectOption('Conservacao', opt)"
                >{{ opt }}</li>
              </ul>
            </div>
          </div>

          <div class="field">
            <label class="lbl" for="otc-periodo">Período</label>
            <input
              id="otc-periodo"
              ref="periodo"
              v-model.trim="form.Periodo"
              :class="['inp', { filled: !!form.Periodo }]"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Ex: 1996 ou 2008-2011"
              @keydown.enter.prevent="focusRef('ddModelo')"
            />
          </div>
        </div>

        <!-- Linha: Modelo, Número e Preço (mantém estética, sem mexer no resto) -->
        <div class="row three">
          <div class="field">
            <label class="lbl">Modelo</label>
            <div class="dd-wrap">
              <div
                ref="ddModelo"
                class="dd"
                tabindex="0"
                @click="toggleDropdown('Modelo')"
                @keydown.enter.prevent="toggleDropdown('Modelo')"
              >
                <span class="dd-val" :class="{ ph: !form.Modelo, filled: !!form.Modelo }">{{ form.Modelo ? form.Modelo : '— Selecione —' }}</span>
                <span :class="['dd-arr', { open: dropdownOpen.Modelo }]" aria-hidden="true"></span>
              </div>
              <ul v-if="dropdownOpen.Modelo" class="dd-menu">
                <li
                  v-for="opt in enumOptions.Modelo"
                  :key="'Modelo:' + opt"
                  class="dd-item"
                  @click.stop="selectOption('Modelo', opt)"
                >{{ opt }}</li>
              </ul>
            </div>
          </div>

          <div class="field">
            <label class="lbl" for="otc-numero">Número</label>
            <input
              id="otc-numero"
              ref="numero"
              v-model.trim="form.Numero"
              :class="['inp', { filled: !!form.Numero }]"
              type="text"
              autocomplete="off"
              spellcheck="false"
              @keydown.enter.prevent="focusRef('preco')"
            />
          </div>

          <div class="field">
            <label class="lbl" for="otc-preco">Preço</label>
            <div class="money" :class="{ focus: moneyFocus }">
              <span class="money-prefix">R$</span>
              <input
                id="otc-preco"
                ref="preco"
                v-model="precoDisplay"
                :class="['money-input', { filled: !!precoDisplay }]"
                type="text"
                autocomplete="off"
                inputmode="decimal"
                spellcheck="false"
                @focus="moneyFocus = true"
                @blur="onPrecoBlur"
                @keydown.enter.prevent="onPrecoEnter"
              />
            </div>
            <div v-if="errors.Preco" class="err">{{ errors.Preco }}</div>
          </div>
        </div>

        <!-- Observações -->
        <div class="row one">
          <div class="field">
            <label class="lbl" for="otc-obs">Observações</label>
            <textarea
              id="otc-obs"
              ref="obs"
              v-model.trim="form.Observacoes"
              class="ta"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Fotos -->
        <div class="row one">
          <div class="field">
            <label class="lbl">Fotos</label>

            <div
              class="dz"
              :class="{ over: dzOver, has: photoItems.length > 0 }"
              @dragenter.prevent="dzOver = true"
              @dragover.prevent="dzOver = true"
              @dragleave.prevent="dzOver = false"
              @drop.prevent="onDrop"
              @click="openFilePicker"
            >
              <div v-if="photoItems.length === 0" class="dz-empty">
                Arraste e solte aqui, ou clique para escolher (até 6 fotos)
              </div>

              <div v-else class="dz-grid">
                <div v-for="(it, idx) in photoItems" :key="it.key" class="dz-item">
                  <img class="dz-img" :src="it.url" :alt="it.name" />
                  <div class="dz-name" :title="it.name">{{ it.name }}</div>
                  <button type="button" class="dz-rm" @click.stop="removePhoto(idx)" aria-label="Remover">×</button>
                </div>
              </div>
            </div>

            <input
              ref="fileInput"
              class="file-hidden"
              type="file"
              accept="image/*"
              multiple
              @change="onFilePick"
            />

            <div v-if="errors.Fotos" class="err">{{ errors.Fotos }}</div>
          </div>
        </div>

        <!-- 7ª linha: Botões -->
        <footer class="otc-footer">
          <button type="button" class="btn ghost" @click="close" :disabled="saving">Cancelar</button>
          <button type="submit" class="btn primary" :disabled="saving">
            {{ saving ? 'Salvando…' : 'Salvar' }}
          </button>
        </footer>

        <div v-if="errors._" class="err bottom">{{ errors._ }}</div>
      </form>

      <!-- Mini-modal: + Adicionar fornecedora -->
      <div v-if="addFornecOpen" class="mini-backdrop" @mousedown.self="closeAddFornec">
        <div class="mini-modal" role="dialog" aria-modal="true">
          <div class="mini-title">Adicionar fornecedora</div>
          <input
            ref="addFornecInput"
            v-model.trim="addFornecNome"
            class="mini-inp"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Ex: Adidas"
            @keydown.enter.prevent="confirmAddFornec"
          />
          <div v-if="addFornecError" class="err">{{ addFornecError }}</div>
          <div class="mini-actions">
            <button type="button" class="btn ghost sm" @click="closeAddFornec" :disabled="addingFornec">Cancelar</button>
            <button type="button" class="btn primary sm" @click="confirmAddFornec" :disabled="addingFornec">{{ addingFornec ? 'Adicionando…' : 'Adicionar' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/lib/http";

export default {
  name: "OutrosTimesCreate",
  props: {
    open: { type: Boolean, default: false },
    mode: { type: String, default: "create" }, // "create" | "update"
    recordId: { type: [Number, String], default: null }
  },
  emits: ["close", "success"],

  data() {
    return {
      saving: false,
      errors: {},

      form: {
        Equipe: "",
        Fornecedora: "",
        fornecedora_id: null,
        Manga: "",
        Conservacao: "",
        Periodo: "",
        Modelo: "",
        Numero: "",
        Observacoes: ""
      },

      // preço
      precoDisplay: "",
      moneyFocus: false,

      // enums
      enumOptions: {
        Fornecedora: [],
        Manga: [],
        Conservacao: [],
        Modelo: []
      },
      dropdownOpen: {
        Fornecedora: false,
        Manga: false,
        Conservacao: false,
        Modelo: false
      },

      // fornecedoras (API normalizada)
      fornecedorasOptions: [],
      fornecedorasLoading: false,

      // mini-modal: adicionar fornecedora
      addFornecOpen: false,
      addFornecNome: "",
      addFornecError: "",
      addingFornec: false,

      // fotos
      photoItems: [],
      dzOver: false,

      // drag modal
      modalPos: { top: "80px", left: "calc(50vw - 390px)" },
      dragging: false,
      dragStart: null,
      _mm: null,
      _mu: null,

      // close dropdown on outside click
      _docDown: null
    };
  },

  watch: {
    open(val) {
      if (val) {
        this.resetForm();
        this.loadEnumOptions();
        this.loadFornecedoras();
        this.attachDocDown();
        this.checkDraft();
        this.$nextTick(() => this.focusRef("equipe"));
      } else {
        this.detachDocDown();
        this.resetForm();
      }
    }
  },

  beforeUnmount() {
    this.detachDocDown();
    this.stopDrag();
    this.revokeAllObjectUrls();
  
    if (this._draftTimer) {
      clearTimeout(this._draftTimer);
      this._draftTimer = null;
    }
},

  methods: {
    
    /* ---------- Draft (rascunho) ---------- */
    _getUserId() {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        return u && u.id != null ? String(u.id) : "anon";
      } catch (e) {
        return "anon";
      }
    },

    _getDraftKey() {
      const uid = this._getUserId();
      const mode = (this.mode || "create").toLowerCase();
      if (mode === "update") {
        const rid = this.recordId != null ? String(this.recordId) : "unknown";
        return "draft_outros_times_update_" + rid + "_u" + uid;
      }
      return "draft_outros_times_create_u" + uid;
    },

    _readDraft() {
      try {
        const raw = localStorage.getItem(this._getDraftKey());
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    _writeDraft(payload) {
      try { localStorage.setItem(this._getDraftKey(), JSON.stringify(payload)); } catch (e) {}
    },

    _clearDraft() {
      try { localStorage.removeItem(this._getDraftKey()); } catch (e) {}
    },

    _hasMeaningfulDraft(d) {
      if (!d || !d.form) return false;
      const f = d.form;
      const keys = ["Equipe","Fornecedora","fornecedora_id","Manga","Conservacao","Periodo","Modelo","Numero","Observacoes"];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (f[k] && String(f[k]).trim() !== "") return true;
      }
      if (d.precoDisplay && String(d.precoDisplay).trim() !== "") return true;
      return false;
    },

    checkDraft() {
      const d = this._readDraft();
      if (this._hasMeaningfulDraft(d)) {
        this.draftOffer = { show: true, hadPhotos: !!d.hadPhotos, payload: d };
      } else {
        this.draftOffer = { show: false, hadPhotos: false, payload: null };
      }
    },

    applyDraft() {
      const d = this.draftOffer && this.draftOffer.payload ? this.draftOffer.payload : null;
      if (!d) return;

      this._draftApplying = true;
      try {
        const f = d.form || {};
        const keys = ["Equipe","Fornecedora","fornecedora_id","Manga","Conservacao","Periodo","Modelo","Numero","Observacoes"];
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (typeof f[k] !== "undefined") this.form[k] = f[k];
        }
        if (typeof d.precoDisplay !== "undefined") this.precoDisplay = d.precoDisplay || "";
      } finally {
        this._draftApplying = false;
      }

      this.draftOffer = { show: false, hadPhotos: false, payload: null };
      this._scheduleDraftSave();
      if (!this.form.Equipe) this.focusRef("equipe");
    },

    discardDraft() {
      this._clearDraft();
      this.draftOffer = { show: false, hadPhotos: false, payload: null };
    },

    _scheduleDraftSave() {
      if (!this.open) return;
      if (this._draftApplying) return;
      if (this._draftTimer) clearTimeout(this._draftTimer);
      this._draftTimer = setTimeout(() => this._saveDraftNow(), 800);
    },

    _saveDraftNow() {
      if (!this.open) return;
      if (this._draftApplying) return;

      const payload = {
        ts: Date.now(),
        mode: (this.mode || "create").toLowerCase(),
        recordId: this.recordId,
        userId: this._getUserId(),
        form: { ...this.form },
        precoDisplay: this.precoDisplay,
        hadPhotos: Array.isArray(this.photoItems) && this.photoItems.length > 0
      };

      if (this._hasMeaningfulDraft(payload)) this._writeDraft(payload);
      else this._clearDraft();
    },
focusRef(refName) {
      this.$nextTick(() => {
        const el = this.$refs[refName];
        if (el && el.focus) el.focus();
      });
    },

    close() {
      this.$emit("close");
      this.resetForm();
    },

    onBackdropMouseDown() {
      this.close();
    },

    attachDocDown() {
      if (this._docDown) return;
      const self = this;
      this._docDown = function (ev) {
        try {
          const inside = ev.target && ev.target.closest && ev.target.closest(".dd-wrap");
          if (!inside) self.closeAllDropdowns();
        } catch (e) {}
      };
      document.addEventListener("mousedown", this._docDown, true);
    },

    detachDocDown() {
      if (this._docDown) {
        document.removeEventListener("mousedown", this._docDown, true);
        this._docDown = null;
      }
    },

    closeAllDropdowns() {
      this.dropdownOpen.Fornecedora = false;
      this.dropdownOpen.Manga = false;
      this.dropdownOpen.Conservacao = false;
      this.dropdownOpen.Modelo = false;
    },

    toggleDropdown(field) {
      const willOpen = !this.dropdownOpen[field];
      this.closeAllDropdowns();
      this.dropdownOpen[field] = willOpen;
    },

    selectOption(field, value) {
      this.form[field] = value;
      this.dropdownOpen[field] = false;

      if (field === "Fornecedora") this.focusRef("ddManga");
      else if (field === "Manga") this.focusRef("ddConservacao");
      else if (field === "Conservacao") this.focusRef("periodo");
      else if (field === "Modelo") this.focusRef("numero");
    },

    async loadEnumOptions() {
      try {
        const r = await axios.get(
          "/api/schema/enums/outros_times?columns=Manga,Conservacao,Modelo"
        );
        const cols = r && r.data && r.data.columns ? r.data.columns : null;
        if (cols) {
this.enumOptions.Manga = Array.isArray(cols.Manga) ? cols.Manga : [];
          this.enumOptions.Conservacao = Array.isArray(cols.Conservacao) ? cols.Conservacao : [];
          this.enumOptions.Modelo = Array.isArray(cols.Modelo) ? cols.Modelo : [];
          return;
        }
      } catch (e) {}

      try {
        const r2 = await axios.get("/api/outros_times/filters");
        const j = r2 && r2.data ? r2.data : {};
this.enumOptions.Manga = Array.isArray(j.Manga) ? j.Manga : [];
        this.enumOptions.Conservacao = Array.isArray(j.Conservacao) ? j.Conservacao : [];
        this.enumOptions.Modelo = Array.isArray(j.Modelo) ? j.Modelo : [];
      } catch (e2) {}
    },

    async loadFornecedoras() {
      this.fornecedorasLoading = true;
      try {
        const r = await axios.get('/api/fornecedoras', { params: { contexto: 'outros_times' } });
        this.fornecedorasOptions = Array.isArray(r && r.data) ? r.data : [];
      } catch (e) {
        this.fornecedorasOptions = [];
      } finally {
        this.fornecedorasLoading = false;
      }
    },

    selectFornecedora(opt) {
      if (!opt) return;
      this.form.fornecedora_id = opt.id != null ? opt.id : null;
      this.form.Fornecedora = opt.nome != null ? opt.nome : '';
      this.dropdownOpen.Fornecedora = false;
      this.focusRef('ddManga');
    },

    openAddFornec() {
      this.addFornecError = '';
      this.addFornecNome = '';
      this.addFornecOpen = true;
      this.dropdownOpen.Fornecedora = false;
      this.$nextTick(() => {
        const el = this.$refs.addFornecInput;
        if (el && el.focus) el.focus();
      });
    },

    closeAddFornec() {
      this.addFornecOpen = false;
      this.addFornecNome = '';
      this.addFornecError = '';
      this.addingFornec = false;
      this.$nextTick(() => this.focusRef('ddFornecedora'));
    },

    async confirmAddFornec() {
      if (this.addingFornec) return;
      const nome = (this.addFornecNome || '').trim();
      if (!nome) {
        this.addFornecError = 'Informe o nome.';
        return;
      }

      this.addingFornec = true;
      this.addFornecError = '';
      try {
        const r = await axios.post('/api/fornecedoras', { nome: nome, contexto: 'outros_times' });
        const created = r && r.data ? r.data : null;
        await this.loadFornecedoras();

        // seleciona automaticamente (novo ou existente)
        if (created && created.id != null) {
          for (let i = 0; i < this.fornecedorasOptions.length; i++) {
            const it = this.fornecedorasOptions[i];
            if (it && String(it.id) === String(created.id)) {
              this.selectFornecedora(it);
              break;
            }
          }
        } else if (created && created.nome) {
          this.form.Fornecedora = created.nome;
          this.form.fornecedora_id = created.id != null ? created.id : null;
        }

        this.addFornecOpen = false;
      } catch (e) {
        const d = e && e.response && e.response.data ? e.response.data : null;
        this.addFornecError = (d && (d.message || d.error)) ? (d.message || d.error) : 'Falha ao adicionar.';
      } finally {
        this.addingFornec = false;
      }
    },


    /* ---------- preço ---------- */
    onPrecoEnter() {
      this.commitPreco();
      this.focusRef("obs");
    },
    onPrecoBlur() {
      this.moneyFocus = false;
      this.commitPreco();
    },
    commitPreco() {
      const fixed = this.normalizeMoneyToFixed(this.precoDisplay);
      if (fixed === null) return;

      try {
        this.precoDisplay = Number(fixed).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } catch (e) {
        this.precoDisplay = fixed.replace(".", ",");
      }
    },
    normalizeMoneyToFixed(s) {
      if (s === null || s === undefined) return null;
      let v = String(s).trim();
      if (!v) return null;

      v = v.replace(/^R\$\s*/i, "");
      v = v.replace(/\s+/g, "");
      v = v.replace(/[^\d.,-]/g, "");

      let num = null;

      if (v.indexOf(",") >= 0) {
        v = v.replace(/\./g, "");
        v = v.replace(",", ".");
        num = parseFloat(v);
      } else if (v.indexOf(".") >= 0) {
        const lastDot = v.lastIndexOf(".");
        const decimals = v.length - lastDot - 1;
        if (decimals === 1 || decimals === 2) num = parseFloat(v);
        else num = parseFloat(v.replace(/\./g, ""));
      } else {
        if (!/^\d+$/.test(v)) return null;
        num = parseInt(v, 10);
      }

      if (num === null || isNaN(num)) return null;
      return (Math.round(num * 100) / 100).toFixed(2);
    },

    /* ---------- fotos ---------- */
    openFilePicker() {
      if (this.$refs.fileInput) this.$refs.fileInput.click();
    },
    onFilePick(ev) {
      const files = (ev && ev.target && ev.target.files) ? Array.prototype.slice.call(ev.target.files) : [];
      this.addFiles(files);
      try { ev.target.value = ""; } catch (e) {}
    },
    onDrop(ev) {
      this.dzOver = false;
      const files = (ev && ev.dataTransfer && ev.dataTransfer.files)
        ? Array.prototype.slice.call(ev.dataTransfer.files)
        : [];
      this.addFiles(files);
    },
    addFiles(files) {
      if (!files || !files.length) return;

      const remaining = 6 - this.photoItems.length;
      if (remaining <= 0) {
        this.errors.Fotos = "Limite de 6 fotos atingido.";
        return;
      }

      let added = 0;
      for (let i = 0; i < files.length && added < remaining; i++) {
        const f = files[i];
        if (!f) continue;
        if (f.type && String(f.type).indexOf("image/") !== 0) continue;

        let url = "";
        try { url = URL.createObjectURL(f); } catch (e) { url = ""; }

        this.photoItems.push({
          key: "p_" + Date.now() + "_" + Math.random().toString(16).slice(2),
          file: f,
          name: f.name,
          url: url
        });
        added++;
      }

      this.errors.Fotos = "";
    },
    removePhoto(idx) {
      if (idx < 0 || idx >= this.photoItems.length) return;
      const it = this.photoItems[idx];
      if (it && it.url) {
        try { URL.revokeObjectURL(it.url); } catch (e) {}
      }
      this.photoItems.splice(idx, 1);
    },
    revokeAllObjectUrls() {
      for (let i = 0; i < this.photoItems.length; i++) {
        const it = this.photoItems[i];
        if (it && it.url) {
          try { URL.revokeObjectURL(it.url); } catch (e) {}
        }
      }
    },

    /* ---------- submit ---------- */
    async submitCreate() {
      this.saving = true;
      this.errors = {};
      this.closeAllDropdowns();

      try {
        this.commitPreco();
        const fixed = this.normalizeMoneyToFixed(this.precoDisplay);

        const payload = {
          Equipe: this.form.Equipe ? this.form.Equipe : null,
          Fornecedora: this.form.Fornecedora ? this.form.Fornecedora : null,
          fornecedora_id: this.form.fornecedora_id != null ? this.form.fornecedora_id : null,
          Manga: this.form.Manga ? this.form.Manga : null,
          Conservacao: this.form.Conservacao ? this.form.Conservacao : null,
          Periodo: this.form.Periodo ? String(this.form.Periodo).trim() : null,
          Modelo: this.form.Modelo ? this.form.Modelo : null,
          Numero: this.form.Numero ? String(this.form.Numero).trim() : null,
          Preco: fixed === null ? null : fixed,
          Observacoes: this.form.Observacoes ? this.form.Observacoes : null
        };

        const fd = new FormData();
        fd.append("payload", JSON.stringify(payload));
        for (let i = 0; i < this.photoItems.length; i++) fd.append("fotos", this.photoItems[i].file);

        await axios.post("/api/outros_times", fd);

        this.$emit("success");
        this.close();
      } catch (e) {
        const data = e && e.response && e.response.data ? e.response.data : null;
        if (data && data.fields) this.errors = data.fields;
        else this.errors._ = "Erro ao salvar. Verifique os campos.";
      } finally {
        this.saving = false;
      }
    },

    resetForm() {
      this.saving = false;
      this.errors = {};
      this.closeAllDropdowns();

      this.form = {
        Equipe: "",
        Fornecedora: "",
        fornecedora_id: null,
        Manga: "",
        Conservacao: "",
        Periodo: "",
        Modelo: "",
        Numero: "",
        Observacoes: ""
      };

      this.precoDisplay = "";
      this.moneyFocus = false;

      this.revokeAllObjectUrls();
      this.photoItems = [];
      this.dzOver = false;
    },

    /* ---------- drag modal ---------- */
    startDrag(ev) {
      if (!ev || ev.button !== 0) return;

      const tag = ev.target && ev.target.tagName ? ev.target.tagName.toUpperCase() : "";
      if (tag === "BUTTON") return;

      const modalEl = this.$refs.modal;
      if (!modalEl) return;

      this.dragging = true;
      const rect = modalEl.getBoundingClientRect();
      this.dragStart = { mx: ev.clientX, my: ev.clientY, top: rect.top, left: rect.left };

      const self = this;
      this._mm = function (mv) { self.onDragMove(mv); };
      this._mu = function () { self.stopDrag(); };

      window.addEventListener("mousemove", this._mm);
      window.addEventListener("mouseup", this._mu, { once: true });
    },
    onDragMove(ev) {
      if (!this.dragging) return;
      const dx = ev.clientX - this.dragStart.mx;
      const dy = ev.clientY - this.dragStart.my;

      const top = Math.max(6, this.dragStart.top + dy);
      const left = Math.max(6, this.dragStart.left + dx);

      this.modalPos = { top: top + "px", left: left + "px" };
    },
    stopDrag() {
      this.dragging = false;
      if (this._mm) window.removeEventListener("mousemove", this._mm);
      this._mm = null;
      this._mu = null;
    }
  }
};
</script>

<style scoped>

.otc-backdrop{ position: fixed; inset: 0; background: rgba(0,0,0,.70); z-index: 4000; }

.otc-modal{
  position: fixed;
  width: 780px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  background: #fff;
  border-radius: 14px;
  border: 1px solid #b0c4f0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 40px rgba(6,26,64,.65);
  overflow: hidden;
}

.otc-header{
  display:flex;
  justify-content: space-between;
  align-items:center;
  padding: 12px 16px;
  background: linear-gradient(to bottom, #061a40, #184b95);
  border-bottom: 1px solid #061a40;
  cursor: grab;
  user-select: none;
}
.otc-header:active{ cursor: grabbing; }
.otc-close{ border:none; background:transparent; color:#fff; font-size: 22px; cursor:pointer; }

.otc-body{ padding: 14px 16px 10px; overflow-y:auto; background:#fff; }

.row{ display:grid; gap: 12px; margin-bottom: 12px; }
.row.one{ grid-template-columns: 1fr; }
.row.two{ grid-template-columns: 1fr 1fr; }
/* Modelo (mais largo) + Número (mais estreito) + Preço (mais estreito) */
.row.three{ grid-template-columns: 1.35fr 0.65fr 1fr; }

@media (max-width: 860px){
  .row.three{ grid-template-columns: 1fr 1fr; }
  .row.three .field:nth-child(3){ grid-column: 1 / -1; }
}
@media (max-width: 640px){ .row.two{ grid-template-columns: 1fr; } .row.three{ grid-template-columns: 1fr; } }

.lbl{ display:block; font-size: 14px; color: #0b2340; font-weight: 800; margin-bottom: 6px; }

.lbl-row{ display:flex; align-items:center; justify-content: space-between; margin-bottom: 6px; }
.lbl-row .lbl{ margin-bottom: 0; }

.forn-help{
  border:0;
  background:transparent;
  padding:0;
  margin:0;
  font-size:12px;
  font-weight:800;
  color:#0b2340;
  text-decoration:underline;
  cursor:pointer;
  line-height:1;
}
.forn-help:hover{ color:#000; }
.forn-help:focus{ outline:2px solid rgba(11,35,64,0.35); outline-offset:2px; border-radius:6px; }

.btn-add{
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(11,35,64,.25);
  background: #e5e7eb;
  color: #0b2340;
  font-weight: 900;
  cursor: pointer;
  line-height: 1;
}
.btn-add:hover{ filter: brightness(.98); }
.dd-item.muted{ opacity: .85; cursor: default; }

.mini-backdrop{
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.40);
  display:flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
}
.mini-modal{
  width: 360px;
  max-width: calc(100% - 24px);
  border-radius: 12px;
  border: 1px solid rgba(11,35,64,.25);
  background: #fff;
  box-shadow: 0 18px 40px rgba(6,26,64,.45);
  padding: 12px 12px 10px;
}
.mini-title{ font-size: 14px; font-weight: 900; color:#0b2340; margin-bottom: 8px; }
.mini-inp{
  width: 100%;
  border-radius: 10px;
  border: 1px solid #c5cbe8;
  padding: 8px 10px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}
.mini-inp:focus{ border-color:#0b2340; box-shadow: 0 0 0 3px rgba(11,35,64,.10); }
.mini-actions{ display:flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }


.inp{
  width: 100%;
  background: #0b2340;
  border-radius: 8px;
  border: 1px solid #c5cbe8;
  padding: 8px 10px;
  font-size: 14px;
  color: #fff;
  outline: none;
  box-sizing: border-box;
}
.ta{
  width: 100%;
  background: #fff;
  color: #111;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,.18);
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.inp:focus, .ta:focus{ border-color: #0b2340; box-shadow: 0 0 0 3px rgba(11,35,64,.10); }
.inp.filled{ font-size: 15px; font-weight: 800; }
#otc-equipe{ min-height: 42px; padding-top: 10px; padding-bottom: 10px; }

.dd-wrap{ position: relative; }
.dd{
  display:flex;
  justify-content: space-between;
  align-items:center;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #c5cbe8;
  background: #0b2340;
  font-size: 14px;
  color:#fff;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
}


.dd-val{
  /* Valor exibido no dropdown (selecionado ou placeholder) */
  color: #fff;
  font-weight: 400;
}
.dd-val.ph{
  /* Placeholder “— Selecione —” no mesmo tom dos hints */
  color: rgba(255,255,255,.75);
  font-weight: 400;
}
.dd-val.filled{
  /* Valor selecionado: branco em negrito (sem afetar opções do menu) */
  color: #fff;
  font-weight: 900;
  font-size: 15px;
}

.dd:focus{ border-color:#0b2340; box-shadow: 0 0 0 3px rgba(11,35,64,.10); outline: none; }

.dd-menu{
  position:absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 100%;
  max-height: 220px;
  overflow-y:auto;
  border-radius: 10px;
  border: 1px solid #061a40;
  background: #0a2a66;
  z-index: 50;
  padding: 6px 0;
}
.dd-item{ padding: 8px 12px; font-size: 14px; color:#fff; cursor:pointer; }
.dd-item:hover{ background:#061a40; }

.money{
  display:flex;
  align-items:center;
  background:#0b2340;
  border-radius: 8px;
  border: 1px solid #c5cbe8;
  box-sizing: border-box;
}
.money.focus{ border-color:#0b2340; box-shadow: 0 0 0 3px rgba(11,35,64,.10); }
.money-prefix{ padding: 0 10px; font-size: 14px; font-weight: 800; color:#fff; }
.money-input{ border:none; outline:none; background:transparent; padding: 8px 10px 8px 0; margin:0; width:100%; color:#fff; font-size: 14px; }
.money-input.filled{ font-size: 15px; font-weight: 800; }

.dz{
  margin-top: 2px;
  padding: 14px 12px;
  border-radius: 12px;
  border: 2px dashed #0a2a66;
  background: rgba(120,190,255,.18);
  cursor: pointer;
  box-sizing: border-box;
}
.dz.over{ border-color:#061a40; background: rgba(120,190,255,.28); }
.dz-empty{ text-align:center; font-size: 13px; color:#0b2340; font-weight: 700; }
.dz-grid{ display:flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
.dz-item{ width: 120px; display:flex; flex-direction: column; gap: 6px; position: relative; }
.dz-img{ width: 120px; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(11,35,64,.25); background:#fff; }
.dz-name{ font-size: 12px; color:#0b2340; line-height: 1.2; max-width: 120px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.dz-rm{
  position:absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.15);
  background:#fff;
  color:#0b2340;
  font-weight: 900;
  cursor:pointer;
}
.file-hidden{ display:none; }

.otc-footer{
  display:flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0 6px;
  border-top: 1px solid #dbe3f7;
  margin-top: 4px;
}
.btn{ border-radius: 10px; padding: 8px 16px; font-size: 14px; font-weight: 900; border: 1px solid transparent; cursor: pointer; }
.btn.ghost{ background:#e5e7eb; color:#111; border-color:#d1d5db; }
.btn.primary{ background:#0b2340; color:#fff; border-color:#0b2340; }
.btn:disabled{ opacity:.7; cursor:not-allowed; }

.err{ margin-top: 6px; color: #d32f2f; font-weight: 800; font-size: 12px; }
.err.bottom{ margin-top: 10px; }

/* placeholders visíveis no fundo azul */
.inp::placeholder, .ta::placeholder, .money-input::placeholder{
  color: rgba(255,255,255,.75);
}

/* setinha (chevron) nos dropdowns — desenhado em CSS + animação */
.dd-arr{
  position: relative;
  display: inline-flex;          /* de inline-block → inline-flex */
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  color: #fff;                   /* mantém branco */
  transform: rotate(0deg);       /* fechado = para baixo */
  transition: transform 520ms cubic-bezier(.2,.8,.2,1), background-color 140ms ease, box-shadow 140ms ease;
  border-radius: 6px
}

/* Box no hover do caret */
.dd-arr:hover{
  background-color: rgba(35, 75, 125, 0.80);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
}

/* hastes */
.dd-arr::before,
.dd-arr::after{
  content: '';
  position: absolute;
  top: 50%;
  margin-top: 3px; 
  width: 10px;
  height: 3px;
  background: currentColor;
  border-radius: 2px;
}

/* fechado: ˅ */
.dd-arr::before{
  left: 50%;
  transform-origin: 100% 50%;
  transform: translate(-100%, -50%) rotate(45deg);
}
.dd-arr::after{
  left: 50%;
  transform-origin: 0% 50%;
  transform: translate(0, -50%) rotate(-45deg);
}

/* aberto: ˄ */
.dd-arr.open{
  transform: rotate(-180deg);   /* anti-horário */
}

@media (prefers-reduced-motion: reduce){
  .dd-arr{ transition: none; }
}
/* Draft bar (rascunho) */
.draft-bar{
  display:flex;
  justify-content: space-between;
  align-items:center;
  gap: 10px;
  padding: 10px 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(11,35,64,.18);
  border-radius: 10px;
  background: rgba(229,231,235,.55);
}
.draft-text{
  font-size: 13px;
  font-weight: 800;
  color: #0b2340;
}
.draft-actions{ display:flex; gap: 8px; }
.btn.sm{ padding: 6px 10px; font-size: 12px; border-radius: 10px; }

/* Link abaixo do campo Fornecedora, canto inferior direito */
.forn-help-link{
  display:block;
  width:100%;
  text-align:right;
  margin-top:4px;
  padding:0;
  border:0;
  background:transparent;
  font-size:12px;     /* menor que a legenda */
  font-weight: 900;
  cursor:pointer;
  text-decoration:none; /* sem sublinhado */
}

.forn-help-link:hover,
.forn-help-link:focus{
  text-decoration:none;
  opacity:0.85;
}

/* Título do header: */
.otc-title{
  margin:0;
  display: inline-flex;
  align-items: center;
  gap: 15px;
  padding-left: 6px;
  font-size: 23px;
  color:#fff;
  font-weight: 900;
  letter-spacing: .2px;
  white-space: nowrap;
}

.otc-title > span{
  display: inline-block;
  white-space: nowrap;
}

.ot-create-title__icon{
  height: 60px;
  width: auto;
  object-fit: contain;
  display:block;
  flex: 0 0 auto;
}

</style>
