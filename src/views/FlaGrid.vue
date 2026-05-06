<template>
<div :class="['grid-page','cm-grid','cm-grid--fla', { 'cm-role-user': !isAdmin }]">
    <!-- Breadcrumb — ajustes finos feitos via props -->
    <Breadcrumb
      context="flamengo"
      left-selector="[data-bc-left]"
      right-selector="[data-bc-right]"
      :gap-top="12"
      :gap-bottom="14"
      :segments="bcSegments"
      :visible-records="visibleRecords"
      :total-records="totalAll"
      @navigate="onBreadcrumbNavigate"
      :offset-left="-36"
      :offset-right="-30"
      :left-pad="12"
      :right-pad="24"
      :menu-anchor-x="0.7"
      :menu-offset-x="-3"
      :menu-offset-y="-14"
      :menu-estimated-width="100"
      :menu-clamp="true"
    />

    <div class="container">
      <!-- Painel de Filtros Modular -->
      <FlaFiltros
        :filters="filters"
        :selected="selected"
        :ranges="ranges"
        @update:selected="onUpdateSelected"
        @update:ranges="onUpdateRanges"
        @clear-all="clearAllFilters"
      />

      <!-- GRID -->
      <section class="grid-panel">
        <!-- Toolbar de ações -->
        <div class="grid-toolbar">
          <button
            class="btn-act btn-new"
            :disabled="hasSelection || !isAdmin"
            @click="onClickNew"
            title="Criar novo registro"
          >
            Nova
          </button>

          <button
            class="btn-act btn-del"
            :disabled="!hasSelection || !isAdmin"
            @click="onClickDelete"
            title="Apagar registros selecionados"
          >
            Apagar Selecionadas
          </button>
        </div>

		<div class="grid-head">
		  <div class="left">
			<div class="meta" v-if="!loading && total === 0">
			  Nenhuma combinação com estes critérios foi encontrada
			</div>
		  </div>

		  <div class="right">
			<select v-model.number="pageSize" @change="onPageSizeChange">
			  <option v-for="opt in pageSizeOptions" :key="opt.value" :value="opt.value">
				{{ opt.label }}
			  </option>
			</select>
		  </div>
		</div>

        <!-- Tabela (âncora DIREITA p/ breadcrumb) -->
        <div class="table-wrap" data-bc-right>
          <table class="grid">
            <thead>
              <tr>
                <!-- Ícones -->
                <th class="th-icon"></th>
                <th class="th-icon"></th>

                <!-- Checkbox master -->
                <th class="th-check" :class="{ 'cb-disabled': !isAdmin }">
                  <input
                    type="checkbox"
                    :checked="allOnPageSelected"
                    :disabled="!isAdmin"
                    @change="toggleAllOnPage($event.target.checked)"
                    aria-label="Selecionar todos desta página"
                  />
                </th>

                <th
                  class="sortable nowrap th-id"
                  @click="toggleSort('id')"
                  :aria-sort="ariaSort('id')"
                  :title="titleSort('Id', 'id')"
								>
				  <span class="sort-hit">
					Id
					<span
					  class="sort-caret"
					  :class="{
						down: sortField === 'id' && sortDir === 'asc',
						up: sortField === 'id' && sortDir === 'desc',
						idle: !(sortField === 'id'),
					  }"
					></span>
				  </span>
                </th>
                <th>Modelo</th>
                <th>Fornecedora</th>
                <th>Manga</th>
                <th>Conservacao</th>
                <th
                  class="sortable nowrap th-periodo"
                  @click="toggleSort('Periodo')"
                  :aria-sort="ariaSort('Periodo')"
                  :title="titleSort('Período', 'Periodo')"
                >
				  <span class="sort-hit">
					Periodo
					<span
					  class="sort-caret"
					  :class="{
						down: sortField === 'AnoInicio' && sortDir === 'asc',
						up: sortField === 'AnoInicio' && sortDir === 'desc',
						idle: sortField !== 'AnoInicio',
					  }"
					></span>
				  </span>
                </th>
                <th class="th-numero">Número</th>
                <th>Observações</th>
                <th
                  class="col-preco nowrap sortable"
                  @click="toggleSort('Preco')"
                  :aria-sort="ariaSort('Preco')"
                  :title="titleSort('Preço', 'Preco')"
                >
				  <span class="sort-hit">
					Preço
					<span
					  class="sort-caret"
					  :class="{
						down: sortField === 'Preco' && sortDir === 'asc',
						up: sortField === 'Preco' && sortDir === 'desc',
						idle: !(sortField === 'Preco'),
					  }"
					></span>
				  </span>
                </th>
                <th>Fotos</th>
              </tr>
            </thead>

            <tbody>
              <!-- Estados -->
              <tr v-if="loading">
                <td :colspan="14" class="loading-row">Carregando…</td>
              </tr>
              <tr v-else-if="data.length === 0">
                <td :colspan="14" class="empty-row">
                  Nenhuma combinação com estes critérios foi encontrada
                </td>
              </tr>

              <!-- Linhas -->
              <tr v-else v-for="row in data" :key="rowKey(row)">
                <!-- Ícones de ação -->
                <td class="cell-icon">
                  <button
                    class="icon-btn"
                    @click="openView(row)"
                    aria-label="Visualizar"
                    title="Visualizar"
                  >
                    <img src="/icones/visualizar.png" alt="Visualizar" />
                  </button>
                </td>
                <td class="cell-icon">
                  <button
                    class="icon-btn"
                    :disabled="!isAdmin"
                    @click="openEdit(row)"
                    aria-label="Editar"
                    title="Editar"
                  >
                    <img src="/icones/editar.png" alt="Editar" />
                  </button>
                </td>

                <!-- Checkbox por linha -->
                <td class="cell-check" :class="{ 'cb-disabled': !isAdmin }">
                  <input
                    type="checkbox"
                    :checked="isRowSelected(row)"
                    :disabled="!isAdmin"
                    @change="toggleRow(row, $event.target.checked)"
                    :aria-label="`Selecionar registro ${rowKey(row)}`"
                  />
                </td>

                <!-- Dados -->
                <td>{{ row.Id ?? row.id ?? row.Codigo }}</td>
                <td v-html="highlightMatch(row.Modelo, currentSearch)"></td>
                <td v-html="highlightMatch(row.Fornecedora, currentSearch)"></td>
                <td v-html="highlightMatch(row.Manga, currentSearch)"></td>
                <td v-html="highlightMatch(row.Conservacao, currentSearch)"></td>
                <td v-html="highlightMatch(periodoText(row), currentSearch)"></td>
                <td class="cell-numero" v-html="highlightMatch(row.Numero, currentSearch)"></td>

                <!-- Observações -->
                <td class="obs-cell">
                  <span v-if="!row.Observacoes" class="obs-empty">—</span>

                  <!-- curto (<=27): mostra puro, sem “Mais” -->
                  <span v-else-if="!isObsLong(row.Observacoes)" class="obs-plain">
                    {{ row.Observacoes }}
                  </span>

                  <!-- longo (>27): trunc + link Mais com tooltip -->
                  <span v-else class="obs-wrap">
                    <span class="obs-trunc">{{ truncateObs27(row.Observacoes) }}</span>
                    <a
                      href="#"
                      class="obs-mais"
                      :data-full="row.Observacoes"
                      @click.prevent
                      @mouseenter="showObsTooltip(row.Observacoes, $event)"
                      @mouseleave="scheduleHideObsTooltip"
                      >Mais</a
                    >
                  </span>
                </td>

                <!-- Preço -->
                <td class="col-preco nowrap">R$ {{ formatPriceInt(row.Preco) }}</td>

                <!-- Thumbs -->
                <td class="fotos-cell">
                    <Thumbs :files="row.Fotos" @open="onThumbOpen" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tooltip Observações -->
        <div
          v-if="obsTip.visible"
          class="obs-tooltip"
          :style="{ left: obsTip.left + 'px', top: obsTip.top + 'px' }"
          @mouseenter="cancelHideObsTooltip"
          @mouseleave="hideObsTooltip"
        >
          {{ obsTip.text }}
        </div>

        <!-- Paginação -->
        <div class="pager" v-if="totalPages > 1">
          <button :disabled="page <= 1" @click="gotoPage(1)">«</button>
          <button :disabled="page <= 1" @click="gotoPage(page - 1)">‹</button>

          <button
            v-for="btn in pageButtons"
            :key="btn.label"
            :disabled="btn.disabled"
            :class="['btn', { active: btn.page === page, ellipsis: btn.ellipsis }]"
            @click="btn.page && gotoPage(btn.page)"
          >
            {{ btn.label }}
          </button>

          <button :disabled="page >= totalPages" @click="gotoPage(page + 1)">›</button>
          <button :disabled="page >= totalPages" @click="gotoPage(totalPages)">»</button>
        </div>
      </section>
    </div>

    <!-- Photo Viewer -->
    <PhotoViewer
      :open="photoOpen"
      :items="photoItems"
      :startIndex="photoIndex"
      @close="photoOpen = false"
    />

    <!-- Modal Create (Nova Camisa) -->
    <FlaCreate
      :open="showCreate"
      @close="showCreate = false"
      @success="onCreateSuccess"
    />

    <!-- Modal Update (Editar Camisa) -->
    <FlaUpdate
      :open="showUpdate"
      :item="editRow"
      @close="showUpdate = false"
      @success="onUpdateSuccess"
    />

    <!-- Modal Delete (Apagar Selecionadas) -->
    <DeleteModal
      :open="deleteOpen"
      :busy="deleteBusy"
      :error="deleteError"
      variant="fla"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
</div>
</template>

<script>
/*
  FlaGrid.vue
  ------------------------------------------------------------
  View consolidada do Flamengo:
  - Usa FlaFiltros.vue (componente modular)
  - Integra Breadcrumb.vue (tema Flamengo)
  - Grid com seleção, ordenação, paginação
  - Observações truncadas com tooltip
  - Modal de thumbs
*/
import Breadcrumb from '@/components/Breadcrumb.vue'
import Thumbs from '@/components/Thumbs.vue'
import PhotoViewer from '@/components/PhotoViewer.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import FlaFiltros from '@/components/FlaFiltros.vue'
import FlaCreate from '@/components/FlaCreate.vue'
import FlaUpdate from '@/components/FlaUpdate.vue'
import axios from '@/lib/http'
import { getUser } from '@/utils/auth'

export default {
  name: 'FlaGrid',

  components: {Breadcrumb, Thumbs, FlaFiltros, FlaCreate, FlaUpdate, DeleteModal, PhotoViewer},

  // Busca global vinda do Header/AppLayout.
  // Observação: também lemos this.$route.query.q como fallback.
  props: {
    searchTerm: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      // estado
      loading: false,
      filtersLoaded: false,

      // auth (role)
      userRole: 'user',

      // Grid nasce ordenado por Id (Crescente)
      // (front envia sortField/sortDir; back ordena no banco)
      sortField: 'id', // 2.1
      sortDir: 'asc', // 2.1

      // dados do grid
      data: [],
      total: 0,
      from: 0,
      to: 0,
      page: 1,
      pageSize: 20,
      pageSizeOptions: [
        { label: '20 por página', value: 20 },
        { label: '50 por página', value: 50 },
        { label: '100 por página', value: 100 },
      ],

      // filtros recebidos do backend
      filters: {
        Modelo: [],
        Fornecedora: [],
        Manga: [],
        Conservacao: [],
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      },

      // seleção de checkboxes (filtros)
      selected: {
        Modelo: new Set(),
        Fornecedora: new Set(),
        Manga: new Set(),
        Conservacao: new Set(),
      },

      // sliders
      ranges: {
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      },

      // seleção de linhas do grid
      selectedIds: [],

      // Tooltip de observações (ancorado)
      obsTip: { visible: false, text: '', left: 0, top: 0 },
      _obsHideTimer: null,

      // Photo Viewer (clique na thumb)
      photoOpen: false,
      photoItems: [],
      photoIndex: 0,


      // modal de thumbs


      // modal create
      showCreate: false,

      // modal update
      showUpdate: false,
      editRow: null,
      // ====== Breadcrumb (NOVO) ======
      bcSegments: [], // ex.: ['Gráficos'] quando estiver nessa seção
      visibleRecords: 0, // N (quantidade exibida agora)
      totalAll: 0, // X (total geral vindo do backend /count)

      // Busca "on the fly" (vem do Header/AppLayout via prop ou querystring)
      q: '',

      // --- Modal Delete (Apagar Selecionadas) ---
      deleteOpen: false,
      deleteBusy: false,
      deleteError: '',

    }
  },

  watch: {
    // Quando o layout repassar o termo (prop), aplicamos na busca do backend.
    searchTerm(newVal) {
      this.q = String(newVal || '').trim()
      if (this.filtersLoaded) {
        this.page = 1
        this.fetchData()
      }
    },

    // Fallback: se o AppLayout preferir controlar por querystring.
    '$route.query.q': function (newVal) {
      // Evita loop se o AppLayout usar prop
      const next = String(newVal || '').trim()
      if (next === this.q) return
      this.q = next
      if (this.filtersLoaded) {
        this.page = 1
        this.fetchData()
      }
    },
  },

  computed: {
    // Termo efetivo usado pela lista para:
    // - mandar ao backend (q)
    // - realçar (highlight) no grid
    currentSearch() {
      return String(this.q || '').trim()
    },

    checkboxKeys() {
      return ['Modelo', 'Fornecedora', 'Manga', 'Conservacao']
    },

    isAdmin() {
      return String(this.userRole || '').toLowerCase() === 'admin'
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },

    pageButtons() {
      const pages = []
      const max = this.totalPages
      const cur = this.page
      const push = (label, page, disabled = false, ellipsis = false) =>
        pages.push({ label, page, disabled, ellipsis })

      if (max <= 9) {
        for (let i = 1; i <= max; i++) push(String(i), i)
      } else {
        push('1', 1)
        if (cur > 4) push('…', null, true, true)
        const start = Math.max(2, cur - 2)
        const end = Math.min(max - 1, cur + 2)
        for (let i = start; i <= end; i++) push(String(i), i)
        if (cur < max - 3) push('…', null, true, true)
        push(String(max), max)
      }
      return pages
    },

    hasSelection() {
      return this.selectedIds && this.selectedIds.length > 0
    },

    hasAnyFilter() {
      const ck = this.checkboxKeys.some((k) => this.selected[k].size > 0)
      const r =
        this.ranges.AnoInicio.min !== this.filters.AnoInicio.min ||
        this.ranges.AnoInicio.max !== this.filters.AnoInicio.max ||
        this.ranges.Preco.min !== this.filters.Preco.min ||
        this.ranges.Preco.max !== this.filters.Preco.max
      return ck || r
    },

    allOnPageSelected() {
      const ids = this.data.map(this.rowKey)
      return ids.length > 0 && ids.every((id) => this.selectedIds.includes(id))
    },
  },

  mounted() {
    // Role do usuário (admin x user)
    this.refreshRole()
    window.addEventListener('user-updated', this.onUserUpdated)

    // Inicializa termo de busca
    this.q = String(this.searchTerm || (this.$route && this.$route.query && this.$route.query.q) || '').trim()

    // Carrega filtros, depois dados; em paralelo pega total geral (X)
    this.fetchFilters()
      .then(() => {
        if (this.filters?.AnoInicio) this.ranges.AnoInicio = { ...this.filters.AnoInicio }
        if (this.filters?.Preco) this.ranges.Preco = { ...this.filters.Preco }
        this.filtersLoaded = true
      })
      .then(() => Promise.all([this.fetchData(), this.fetchTotalAll()]))
      .catch((err) => console.error(err))
  },

  beforeUnmount() {
    window.removeEventListener('user-updated', this.onUserUpdated)
  },

  methods: {
    /* ---------- Auth / Role ---------- */
    refreshRole() {
      var u = null
      try {
        u = getUser && getUser()
      } catch (e) {
        u = null
      }
      this.userRole = (u && u.role) ? String(u.role) : 'user'

      // Se não é admin, zera qualquer seleção (evita “apagar selecionadas”)
      if (String(this.userRole).toLowerCase() !== 'admin') {
        this.selectedIds = []
      }
    },

    onUserUpdated(_e) {
      this.refreshRole()
    },

    /* ---------- Breadcrumb (navegação) ---------- */
    onBreadcrumbNavigate(to) {
      // 'graficos' | 'formularios' | 'estatisticas'
      // implemente a navegação conforme sua arquitetura de rotas
      console.log('Breadcrumb navigate:', to)
    },

    /* ---------- UI helpers ---------- */
    labelFor(key) {
      const map = {
        Modelo: 'Modelo',
        Fornecedora: 'Fornecedora',
        Manga: 'Manga',
        Conservacao: 'Conservação',
      }
      return map[key] || key
    },

    isObsLong(txt) {
      const s = String(txt || '')
      return s.length > 27
    },

    truncateObs27(txt) {
      const s = String(txt || '')
      if (s.length <= 27) return s
      return s.slice(0, 27) + '...'
    },

    formatPriceInt(v) {
      if (v == null) return '0'
      const n = Math.round(Number(v))
      return n.toLocaleString('pt-BR')
    },
    getJwtToken() {
      // Tenta achar o JWT salvo pelo login (localStorage/sessionStorage)
      try {
        var isJwt = function (t) {
          return (
            typeof t === 'string' &&
            /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)
          )
        }

        var pick = function (st) {
          if (!st) return ''
          var t =
            st.getItem('access_token') ||
            st.getItem('token') ||
            st.getItem('jwt') ||
            st.getItem('accessToken')
          if (isJwt(t)) return t

          // varre chaves contendo "token" (fallback)
          for (var i = 0; i < st.length; i++) {
            var k = st.key(i)
            if (!k) continue
            if (String(k).toLowerCase().indexOf('token') === -1) continue
            var v = st.getItem(k)
            if (isJwt(v)) return v
          }
          return ''
        }

        return pick(window.localStorage) || pick(window.sessionStorage) || ''
      } catch (e) {
        return ''
      }
    },


    openView(row) {
  // Ícone "Visualizar": abre a 1ª foto do registro (se existir)
  const items = this.buildPhotoItemsFromFotos(row ? row.Fotos : null)
  if (!items.length) return
  this.photoItems = items
  this.photoIndex = 0
  this.photoOpen = true
},


    openEdit(_row) {
      if (!this.isAdmin) return
      this.editRow = _row || null
      this.showUpdate = !!this.editRow
    },

    
/* ---------- UI: Fotos (thumbs) ---------- */
onThumbOpen(payload) {
  // payload: { index, items } vindo do Thumbs.vue
  this.photoIndex = (payload && typeof payload.index === 'number') ? payload.index : 0
  this.photoItems = Array.isArray(payload && payload.items) ? payload.items.slice() : []
  this.photoOpen = this.photoItems.length > 0
},

buildPhotoItemsFromFotos(raw) {
  const arr = this.parseFotos(raw)
  if (!arr.length) return []
  const base = '/uploads'
  const out = []
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i] || {}
    const thumbPath = f.thumbnail || f.thumb || ''
    const fullPath = f.name || f.file || f.full || ''
    const thumbSrc = thumbPath ? this.makeUploadsUrl(base, thumbPath) : ''
    const fullSrc = fullPath ? this.makeUploadsUrl(base, fullPath) : (thumbSrc || '')
    if (!thumbSrc && !fullSrc) continue
    out.push({ thumbSrc: thumbSrc || fullSrc, fullSrc: fullSrc || thumbSrc, raw: f })
  }
  return out
},

parseFotos(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') return [raw]
  if (typeof raw === 'string') {
    let s = raw.trim()
    if ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"')) {
      s = s.slice(1, -1)
    }
    try {
      const parsed = JSON.parse(s)
      return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
    } catch (e) {
      return []
    }
  }
  return []
},

makeUploadsUrl(base, path) {
  const p = String(path || '').trim()
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  const clean = p.replace(/^\/+/, '')
  const b = String(base || '').replace(/\/+$/, '')
  return (b ? b + '/' : '/') + clean
},
/* ---------- Busca (highlight) ---------- */
    // HTML-escape mínimo para v-html (evita injetar tags se algum campo vier sujo)
    escapeHtml(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },

    // Realça a primeira ocorrência do termo dentro do texto.
    highlightMatch(text, search) {
      const rawText = String(text ?? '')
      const rawSearch = String(search ?? '').trim()
      if (!rawSearch) return this.escapeHtml(rawText)
      if (!rawText) return ''

      const tLower = rawText.toLowerCase()
      const sLower = rawSearch.toLowerCase()
      const idx = tLower.indexOf(sLower)
      if (idx < 0) return this.escapeHtml(rawText)

      const before = rawText.slice(0, idx)
      const match = rawText.slice(idx, idx + rawSearch.length)
      const after = rawText.slice(idx + rawSearch.length)

      return (
        this.escapeHtml(before) +
        '<span class="cm-hl">' +
        this.escapeHtml(match) +
        '</span>' +
        this.escapeHtml(after)
      )
    },

    // Exibição do período no grid: mostra o texto do campo Periodo (banco).
    // AnoInicio é um derivado (p/ filtros/ordenação) e entra só como fallback.
    periodoText(row) {
      const p = row?.Periodo
      if (p != null && String(p).trim() !== '') return String(p)

      const a = row?.AnoInicio
      return a != null ? String(a) : ''
    },

    /* ---------- Seleção de linhas (grid) ---------- */
    rowKey(row) {
      return row?.Id ?? row?.id ?? row?.Codigo ?? null
    },

    isRowSelected(row) {
      const id = this.rowKey(row)
      return id != null && this.selectedIds.includes(id)
    },

    toggleRow(row, checked) {
      if (!this.isAdmin) return
      const id = this.rowKey(row)
      if (id == null) return
      if (checked) {
        if (!this.selectedIds.includes(id)) this.selectedIds.push(id)
      } else {
        this.selectedIds = this.selectedIds.filter((x) => x !== id)
      }
    },

    toggleAllOnPage(checked) {
      if (!this.isAdmin) return
      const pageIds = this.data.map(this.rowKey).filter((x) => x != null)
      if (checked) {
        const set = new Set(this.selectedIds)
        pageIds.forEach((id) => set.add(id))
        this.selectedIds = [...set]
      } else {
        const pageSet = new Set(pageIds)
        this.selectedIds = this.selectedIds.filter((id) => !pageSet.has(id))
      }
    },

    /* ---------- Callbacks do FlaFiltros ---------- */
    onUpdateSelected(newSelected) {
      this.selected = newSelected
      this.page = 1
      this.fetchData()
    },

    onUpdateRanges(newRanges) {
      this.ranges = newRanges
      this.page = 1
      this.fetchData()
    },

    clearAllFilters() {
      this.checkboxKeys.forEach((k) => (this.selected[k] = new Set()))
      if (this.filters?.AnoInicio) {
        this.ranges.AnoInicio = { ...this.filters.AnoInicio }
      }
      if (this.filters?.Preco) {
        this.ranges.Preco = { ...this.filters.Preco }
      }
      this.page = 1
      this.fetchData()
    },

    /* ---------- Backend ---------- */
    async fetchFilters() {
      const res = await axios.get('/api/flamengo/filters')
      const j = res.data

      // checkbox arrays
      this.filters.Modelo = j.Modelo || []
      this.filters.Fornecedora = j.Fornecedora || []
      this.filters.Manga = j.Manga || []
      this.filters.Conservacao = j.Conservacao || []

      // ranges
      this.filters.AnoInicio = j.AnoInicio || { min: 0, max: 0 }
      this.filters.Preco = j.Preco || { min: 0, max: 0 }
    },

    buildQuery() {
      const params = new URLSearchParams()

      // ===== Busca (q) =====
      const q = String(this.q || '').trim()
      if (q) params.set('q', q)

      // checkboxes
      this.checkboxKeys.forEach((k) => {
        ;[...this.selected[k]].forEach((v) => params.append(k, v))
      })

      // sliders (só após filtros carregados)
      if (this.filtersLoaded) {
        params.set('AnoInicio_min', String(this.ranges.AnoInicio.min))
        params.set('AnoInicio_max', String(this.ranges.AnoInicio.max))
        params.set('Preco_min', String(this.ranges.Preco.min))
        params.set('Preco_max', String(this.ranges.Preco.max))
      }

      // paginação
      params.set('page', String(this.page))
      params.set('pageSize', String(this.pageSize))

      // ===== Ordenação (2.2) =====
      params.set('sortField', this.sortField)
      params.set('sortDir', this.sortDir)

      return params.toString()
    },

    async fetchData() {
      if (!this.filtersLoaded) return
      this.loading = true
      try {
        const qs = this.buildQuery()
        const res = await axios.get(`/api/flamengo?${qs}`)
        const j = res.data

        // dados
        this.data = Array.isArray(j.data) ? j.data : []

        // normaliza fotos
        this.data = this.data.map((row) => {
          if (row.Fotos && typeof row.Fotos === 'string') {
            try {
              row.Fotos = JSON.parse(row.Fotos)
            } catch {
              row.Fotos = []
            }
          }
          return row
        })

        // paginação (totais do conjunto filtrado/paginado)
        this.total = Number(j.total || 0)
        this.from = Number(j.from || 0)
        this.to = Number(j.to || 0)
        this.page = Number(j.page || this.page)
        this.pageSize = Number(j.pageSize || this.pageSize)

        // ===== contador do breadcrumb (N) =====
        this.visibleRecords = this.data.length
      } catch (e) {
        console.error(e)
        this.data = []
        this.total = 0
        this.from = 0
        this.to = 0
        this.visibleRecords = 0
      } finally {
        this.loading = false
      }
    },

    // total geral (X) — endpoint de contagem global
    async fetchTotalAll() {
      try {
        const res = await axios.get('/api/flamengo/count')
        const j = res.data
        // aceite { total: number } ou number puro
        this.totalAll = typeof j === 'number' ? j : Number(j.total || 0)
      } catch (err) {
        console.error(err)
        this.totalAll = 0
      }
    },

    /* ---------- Tooltip Observações (hover) ---------- */
    showObsTooltip(text, ev) {
      this.cancelHideObsTooltip()

      const s = String(text ?? '').trim()
      if (!s) return

      const el = ev.currentTarget
      const r = el.getBoundingClientRect()

      const OFFSET_X = 8
      const OFFSET_Y = 6
      let left = r.left + OFFSET_X
      let top = r.bottom + OFFSET_Y

      const VW = window.innerWidth
      const VH = window.innerHeight
      const EST_W = 480
      const EST_H = 160

      if (left + EST_W > VW - 8) left = Math.max(8, VW - EST_W - 8)
      if (top + EST_H > VH - 8) top = Math.max(8, r.top - EST_H - OFFSET_Y)

      this.obsTip = { visible: true, text: s, left, top }
    },

    scheduleHideObsTooltip() {
      this.cancelHideObsTooltip()
      this._obsHideTimer = setTimeout(() => this.hideObsTooltip(), 120)
    },

    cancelHideObsTooltip() {
      if (this._obsHideTimer) {
        clearTimeout(this._obsHideTimer)
        this._obsHideTimer = null
      }
    },

    hideObsTooltip() {
      this.cancelHideObsTooltip()
      this.obsTip.visible = false
      this.obsTip.text = ''
    },

    onClickNew() {
      if (!this.isAdmin) return
      this.showCreate = true
    },


    onCreateSuccess() {
      // Fecha modal e atualiza grid sem refresh manual
      this.showCreate = false
      this.fetchData()
      this.fetchTotalAll()
    },

    onUpdateSuccess() {
      // Fecha modal e atualiza grid
      this.showUpdate = false
      this.editRow = null
      this.fetchData()
      this.fetchTotalAll()
    },

    onClickDelete() {
      if (!this.isAdmin) return
      if (!this.hasSelection) return
      this.deleteError = ''
      this.deleteOpen = true
    },

    cancelDelete() {
      // “Não”: fecha e desmarca tudo
      this.deleteOpen = false
      this.deleteError = ''
      this.selectedIds = []
    },

    async confirmDelete() {
      if (!this.isAdmin) return
      if (!this.hasSelection || this.deleteBusy) return

      this.deleteBusy = true
      this.deleteError = ''

      try {
        const ids = this.selectedIds.slice(0)
        const token = this.getJwtToken && this.getJwtToken()
        if (!token) {
          this.deleteError = 'Sessão expirada. Faça login novamente.'
          return
        }
        const resp = await axios.post('/api/flamengo/delete', { ids }, { headers: { Authorization: 'Bearer ' + token } })
        // delay curto pra ver "Apagando..." + troca de cor do botão
        await new Promise(function (resolve) { setTimeout(resolve, 1300) })
		// ok -> fecha, limpa seleção e recarrega grid
        this.deleteOpen = false
        this.selectedIds = []
        await Promise.all([this.fetchData(), this.fetchTotalAll()])
        return resp
      } catch (err) {
        const r = err && err.response
        const status = r && r.status
        const msg =
          (r && r.data && (r.data.message || r.data.msg || r.data.detail || r.data.error)) ||
          (err && err.message) ||
          'Falha ao apagar.'

        if (status === 401) {
          this.deleteError = 'Sessão expirada. Faça login novamente.'
        } else {
          // 403 (não-admin) ou outros erros
          this.deleteError = String(msg)
        }
      } finally {
        this.deleteBusy = false
      }
    },

    onPageSizeChange() {
      this.page = 1
      this.fetchData()
    },

    gotoPage(p) {
      if (p < 1 || p > this.totalPages) return
      this.page = p
      this.fetchData()
    },

    // ===== Ordenação (2.1/2.2) =====
    // Mapeia 'Periodo' (cabeçalho) para 'AnoInicio' (campo real no back)
    toggleSort(field) {
      var realField = field === 'Periodo' ? 'AnoInicio' : field

      if (this.sortField === realField) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = realField
        this.sortDir = 'asc'
      }

      this.page = 1 // reinicia paginação
      this.fetchData() // recarrega dados
    },

    ariaSort(field) {
      var realField = field === 'Periodo' ? 'AnoInicio' : field
      if (this.sortField === realField) {
        return this.sortDir === 'asc' ? 'ascending' : 'descending'
      }
      return 'none'
    },

    // A11y + UX: tooltip visual (title) nos cabeçalhos ordenáveis
    titleSort(labelVisivel, field) {
      var realField = field === 'Periodo' ? 'AnoInicio' : field
      var ehAtual = this.sortField === realField
      var proxima = ehAtual ? (this.sortDir === 'asc' ? 'decrescente' : 'crescente') : 'crescente'
      return 'Clique para ordenar por ' + labelVisivel + ' (' + proxima + ')'
    },
  },
}
</script>

<style scoped>
/* ============================================================
   LAYOUT GERAL DA PÁGINA
   ============================================================ */
.grid-page {
  padding-left: 2vw;
  padding-right: 1vw;
}

.container {
  display: grid;
  grid-template-columns: 14% 84%; /* filtros | grid */
  gap: 16px;
}

/* ============================================================
   PAINEL DE FILTROS + BOTÃO LIMPAR
   ============================================================ */
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
  border: 1px solid #e1e1e1;
  font-weight: 800;
  text-align: center;
  background: #e3e3e3;
  color: #fff;
  cursor: not-allowed;
}

.btn-clear.enabled {
  background: #000;
  color: #c00000;
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

.filter-card .pill-title {
  display: block;
  width: max-content;
  margin: 0 auto 8px;
  padding: 4px 8px;
  background: #000;
  color: #c00000;
  font-weight: 700;
  border-radius: 8px;
  line-height: 1.1;
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

/* ============================================================
   CHECKBOXES (FLAMENGO)
   ============================================================ */
.checkline input[type='checkbox'],
tbody .cell-check input[type='checkbox'] {
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

.checkline input[type='checkbox']:focus-visible,
tbody .cell-check input[type='checkbox']:focus-visible {
  outline: 2px solid #c00000;
  outline-offset: 2px;
}

.checkline input[type='checkbox']:hover,
tbody .cell-check input[type='checkbox']:hover {
  border-color: #000;
}

.checkline input[type='checkbox']:checked,
tbody .cell-check input[type='checkbox']:checked {
  background: #000;
  border-color: #000;
}

.checkline input[type='checkbox']:checked::after,
tbody .cell-check input[type='checkbox']:checked::after {
  content: '✔';
  color: #c00000;
  font-size: 14px;
  line-height: 1;
  font-weight: 800;
}

thead .th-check input[type='checkbox'] {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 2px solid #c00000;
  border-radius: 4px;
  background: #fff;
  display: inline-grid;
  place-content: center;
  cursor: pointer;
  position: relative;
}

thead .th-check input[type='checkbox']:checked {
  background: #fff;
  border-color: #c00000;
}

thead .th-check input[type='checkbox']:checked::after {
  content: '✔';
  color: #c00000;
  font-size: 14px;
  line-height: 1;
  font-weight: 800;
}

/* ============================================================
   SLIDERS (DUPLO RANGE)
   ============================================================ */
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
  background: linear-gradient(90deg, #8a0000 0%, #c00000 40%, #ff2a2a 100%);
  box-shadow: inset 0 0 0 1px rgba(192, 0, 0, 0.15);
  transition:
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.slider-row:has(.range:active) .range-fill,
.slider-row:has(.range:focus-visible) .range-fill {
  box-shadow:
    inset 0 0 0 1px rgba(192, 0, 0, 0.25),
    0 0 8px rgba(192, 0, 0, 0.35);
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
  background: #000;
  border: 2px solid #c00000;
}

.range::-moz-range-thumb {
  pointer-events: auto;
  cursor: pointer;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #000;
  border: 2px solid #c00000;
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

/* ============================================================
   GRID (TABELA)
   ============================================================ */
.grid-panel .title {
  margin: 0 0 4px;
}

.grid-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 10px;
}

table.grid {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  position: sticky;
  top: 0;
  background: #000;
  color: #c00000;
  text-align: left;
  padding: 14px 8px;
  border-bottom: 2px solid #2b0000;
  font-weight: 700;
}

.th-icon {
  width: 30px;
}

.th-check {
  width: 44px;
  text-align: center;
}

tbody td {
  padding: 8px;
  border-top: 1px solid #f1f1f1;
}

td.cell-icon {
  padding: 0 2px;
}



/* Respiro interno nas bordas (sem criar "retângulo dentro da box") */
table.grid thead th:first-child,
table.grid tbody td:first-child{
  padding-left: 12px;
}

/* primeira célula é ícone e tinha padding 0 2px; garante respiro à esquerda */
table.grid tbody td.cell-icon:first-child{
  padding-left: 12px;
}

table.grid thead th:last-child,
table.grid tbody td:last-child{
  padding-right: 12px;
}

.cell-icon {
  text-align: center;
}

.cell-check {
  text-align: center;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.icon-btn img {
  width: 28px;
  height: 28px;
  display: inline-block;
}


/* ============================================================
   UX (role=user)
   - Cursor custom no checkbox desabilitado (delete futuro)
   - Esmaecimento "cinza bonito" do disabled
   - Evita alternância de cursor ao percorrer a coluna
   - Ícone editar desabilitado “esmaecido”
   ============================================================ */
.cb-disabled{
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed;
}

/* Regra geral (admin): mão */
.th-check input:not(:disabled),
.cell-check input:not(:disabled){
  cursor: pointer;
}

/* Role user: input disabled não "rouba" o cursor do TH/TD */
.cb-disabled input,
.cb-disabled input[type='checkbox'],
.cb-disabled input[type='checkbox']:disabled{
  cursor: inherit !important;
  pointer-events: none;
}

/* Disabled checkbox visuals (Fla) */
thead .th-check input[type='checkbox']:disabled,
tbody .cell-check input[type='checkbox']:disabled{
  border-color: #9a9a9a !important;
  background: #e9e9e9 !important;
  opacity: 1;
  cursor: inherit !important;
  pointer-events: none;
}

thead .th-check input[type='checkbox']:disabled:hover,
tbody .cell-check input[type='checkbox']:disabled:hover{
  border-color: #9a9a9a;
}

thead .th-check input[type='checkbox']:disabled:checked,
tbody .cell-check input[type='checkbox']:disabled:checked{
  background: #d9d9d9 !important;
  border-color: #9a9a9a !important;
}

thead .th-check input[type='checkbox']:disabled:checked::after,
tbody .cell-check input[type='checkbox']:disabled:checked::after{
  color: #777;
}

.icon-btn:disabled{
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed !important;
}
.icon-btn:disabled img{
  opacity: 0.35;
  filter: grayscale(100%);
}


.th-numero,
.cell-numero {
  text-align: center;
}

.col-preco {
  min-width: 120px;
  text-align: left;
  white-space: nowrap;
}

tbody tr:nth-child(odd) {
  background: #fff;
}

tbody tr:nth-child(even) {
  background: #f7f7f7;
}

.obs-cell {
  max-width: 280px;
}

.obs-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.obs-trunc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
}

.obs-plain {
  white-space: pre-wrap;
}

.obs-empty {
  color: #999;
}

.obs-tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 480px;
  min-width: 320px;
  background: #fff;
  color: #000;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  padding: 12px 14px;
  font-size: 16px;
  line-height: 1.45;
  white-space: pre-wrap;
  pointer-events: auto;
}

.pager {
  display: flex;
  gap: 4px;
  margin-top: 10px;
}

.pager .btn {
  min-width: 32px;
}

.pager .active {
  font-weight: bold;
}

/* ============================================================
   AJUSTE HD (1366 ~ 1440): enxuga grid para reduzir scroll horizontal
   ============================================================ */
@media (max-width: 1400px) and (min-width: 1001px){

  /* tabela mais “compacta” */
  table.grid{
    font-size: inherit;
  }

  thead th{
    padding: 10px 6px; /* era 14px 8px */
  }

  tbody td{
    padding: 6px 6px;  /* era 8px */
  }

  /* ícones um pouco menores */
  .icon-btn img{
    width: 24px;
    height: 24px;
  }

  .th-icon{
    width: 26px; /* era 30 */
  }

  /* colunas que costumam forçar largura */
  .col-preco{
    min-width: 96px; /* era 120 */
  }

  .obs-cell{
    max-width: 240px; /* era 280 */
  }

  .obs-trunc{
    max-width: 170px; /* era 200 */
  }
}

/* ============================================================
   AJUSTE FHD+: dá um pouco mais de largura ao grid
   ============================================================ */
@media (min-width: 1600px){
  .container{
    grid-template-columns: 13% 85%;
  }
}

@media (max-width: 1000px) {
  .container {
    grid-template-columns: 1fr;
  }
  thead th {
    top: 0;
  }
}

/* ============================================================
   TOOLBAR (ACIMA DO GRID)
   ============================================================ */
.grid-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px; /* respiro do breadcrumb */
  margin-bottom: 12px;
}

.btn-act {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 800;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    opacity 0.15s ease;
}

.btn-new {
  background: #000;
  color: #c00000;
  border-color: #1b1b1b;
}

.btn-new:disabled {
  background: #bfbfbf;
  color: #ffffff;
  border-color: #e3e3e3;
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed !important;
  opacity: 0.9;
}

.btn-del {
  background: #000;
  color: #c00000;
  border-color: #1b1b1b;
}

.btn-del:disabled {
  background: #bfbfbf;
  color: #ffffff;
  border-color: #e3e3e3;
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed !important;
  opacity: 0.9;
}

.btn-act:not(:disabled):hover {
  filter: brightness(1.05);
}

.btn-act:not(:disabled):active {
  filter: brightness(0.95);
}

/* ====================================
   ORDENAÇÃO: UX E ÍCONES (CARETS)
   ==================================== */
.sortable {
  cursor: pointer;
  user-select: none;
}

.sort-hit:hover {
  opacity: 1;
  background-color: rgba(70, 70, 70, 0.75);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.sort-hit{
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 8px;
  transition: background-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
}

/* ===== Sort caret layout fix (não quebrar linha entre label e ▲/▼) ===== */
th.sortable {
  white-space: nowrap;
}
th.th-id {
  min-width: 56px;
}
th.th-periodo {
  min-width: 92px;
}


/* --- Carets e animação --- */
.sort-caret{
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 3px;


  /* base = down */
  transform: rotate(0deg);
  transition: transform 520ms cubic-bezier(.2,.8,.2,1);
  /*transition: transform 180ms ease;   */

  /* limpa heranças do glyph antigo */
  font-size: 0;
  line-height: 0;
  font-weight: normal;
  border: 0;
}

/* hastes */
.sort-caret::before,
.sort-caret::after{
  content: '';
  position: absolute;
  top: calc(50% + 2px);
  width: 10px;
  height: 3px;
  background: currentColor;
  border-radius: 2px;
}

/* formato ˅ */
.sort-caret::before{
  left: 50%;
  transform-origin: 100% 50%;
  transform: translate(-100%, -50%) rotate(45deg);
}
.sort-caret::after{
  left: 50%;
  transform-origin: 0% 50%;
  transform: translate(0, -50%) rotate(-45deg);
}

/* direção */
.sort-caret.up{ transform: rotate(-180deg); } /* anti-horário */
.sort-caret.down{ transform: rotate(0deg); }
.sort-caret.idle{ transform: rotate(0deg); }

/* cores (mantém seu padrão) */
.sort-caret.up,
.sort-caret.down{ color: #c00000; }
.sort-caret.idle{ color: #9aa0a6; }

@media (prefers-reduced-motion: reduce){
  .sort-caret{ transition: none; }
}

/* Realce da busca no grid */
:deep(.cm-hl) {
  color: #dc2626;
  font-weight: 700;
}
</style>