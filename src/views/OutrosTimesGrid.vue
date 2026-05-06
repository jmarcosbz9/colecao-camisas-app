<template>
  <div :class="['grid-page','cm-grid','cm-grid--outros', { 'cm-role-user': !isAdmin }]">
    <!-- Breadcrumb -->
    <Breadcrumb
      context="outros"
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
      :menu-offset-x="-2"
      :menu-offset-y="-14"
      :menu-estimated-width="100"
      :menu-clamp="true"
    />

    <div class="container">
      <!-- Painel de Filtros Modular -->
      <OutrosTimesFiltros
        :filters="filters"
        :selected="selected"
        :ranges="ranges"
        @update:selected="onUpdateSelected"
        @update:ranges="onUpdateRanges"
        @clear-all="clearAllFilters"
      />

      <!-- GRID -->
      <section class="grid-panel grid-col">
        <!-- Toolbar de ações (Nova / Apagar Selecionadas) -->
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
                <th>Equipe</th>
                <th>Fornecedora</th>
                <th>Modelo</th>
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
              <tr v-if="loading">
                <td :colspan="14" class="loading-row">Carregando…</td>
              </tr>
              <tr v-else-if="data.length === 0">
                <td :colspan="14" class="empty-row">
                  Nenhuma combinação com estes critérios foi encontrada
                </td>
              </tr>

              <tr v-else v-for="row in data" :key="rowKey(row)">
                <!-- Ícones -->
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
                <td v-html="highlightMatch(row.Equipe, searchTerm)"></td>
                <td v-html="highlightMatch(row.Fornecedora, searchTerm)"></td>
                <td v-html="highlightMatch(row.Modelo, searchTerm)"></td>
                <td v-html="highlightMatch(row.Manga, searchTerm)"></td>
                <td v-html="highlightMatch(row.Conservacao, searchTerm)"></td>
                <td v-html="highlightMatch(periodoText(row), searchTerm)"></td>
                <td class="cell-numero" v-html="highlightMatch(row.Numero, searchTerm)"></td>

                <!-- Observações -->
                <td class="obs-cell">
                  <span v-if="!row.Observacoes" class="obs-empty">—</span>

                  <span v-else-if="!isObsLong(row.Observacoes)" class="obs-plain">
                    {{ row.Observacoes }}
                  </span>

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
	
	<!-- Modal de Create Modular -->
    <OutrosTimesCreate :open="createOpen" @close="createOpen = false" @success="onCreateSuccess" />

    <!-- Modal de Update Modular -->
    <OutrosTimesUpdate
      :open="updateOpen"
      :item="editRow"
      @close="updateOpen = false"
      @success="onUpdateSuccess"
    />

    <!-- Modal Delete (Apagar Selecionadas) -->
    <DeleteModal
      :open="deleteOpen"
      :busy="deleteBusy"
      :error="deleteError"
      variant="outros"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script>
/*
  OutrosTimesGrid.vue
  ------------------------------------------------------------
  View consolidada de Outros Times:
  - Usa OutrosTimesFiltros.vue (componente modular com search box Equipe)
  - Usa OutrosTimesCreate.vue (modal modular)
  - Integra Breadcrumb.vue (tema Outros Times)
  - Grid com seleção, ordenação, paginação
  - Observações truncadas com tooltip
  - Modal de thumbs
*/
import Breadcrumb from '@/components/Breadcrumb.vue'
import Thumbs from '@/components/Thumbs.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import OutrosTimesFiltros from '@/components/OutrosTimesFiltros.vue'
import OutrosTimesCreate from '@/components/OutrosTimesCreate.vue'
import PhotoViewer from '@/components/PhotoViewer.vue'
import OutrosTimesUpdate from '@/components/OutrosTimesUpdate.vue'
import axios from '@/lib/http'
import { getUser } from '@/utils/auth'

export default {
  name: 'OutrosTimesGrid',
  components: {Breadcrumb, Thumbs, PhotoViewer, OutrosTimesFiltros, OutrosTimesCreate, OutrosTimesUpdate, DeleteModal},
 
  data() {
    return {
      searchTerm: '',

      // auth (role)
      userRole: 'user',

      // estado
      loading: false,
      filtersLoaded: false,

      // controla concorrência de requests (evita resposta antiga sobrescrever a nova)
      _fetchSeq: 0,

      // ===== Estado inicial de ordenação =====
      // Grid nasce ordenado por Id (CRESCENTE).
      sortField: 'id',
      sortDir: 'asc',

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

      // filtros do backend
      filters: {
        Fornecedora: [],
        Modelo: [],
        Manga: [],
        Conservacao: [],
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      },

      // seleção por checkbox (filtros)
      selected: {
        Fornecedora: new Set(),
        Modelo: new Set(),
        Manga: new Set(),
        Conservacao: new Set(),
      },

      // sliders
      ranges: {
        AnoInicio: { min: 0, max: 0 },
        Preco: { min: 0, max: 0 },
      },

      // seleção de linhas
      selectedIds: [],

      // tooltip Observações
      obsTip: { visible: false, text: '', left: 0, top: 0 },
      _obsHideTimer: null,

      // modal thumbs
      thumbsOpen: false,
      currentFotos: [],

      // ====== Breadcrumb ======
      bcSegments: [],
      visibleRecords: 0,
      totalAll: 0,

      // --- Modal Create (componente modular OutrosTimesCreate.vue) ---
      createOpen: false,

      // --- Modal Update (componente modular OutrosTimesUpdate.vue) ---
      updateOpen: false,
      editRow: null,

      // --- Modal Delete (Apagar Selecionadas) ---
      deleteOpen: false,
      deleteBusy: false,
      deleteError: '',
	  
	  // --- PhotoViewer (clique nas thumbs) ---
	  photoOpen: false,
      photoItems: [],
      photoIndex: 0,

    }
  },

  computed: {
    checkboxKeys() {
      // Equipe não é mais checkbox, é search box
      return ['Fornecedora', 'Modelo', 'Manga', 'Conservacao']
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

  watch: {
    searchTerm(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.page = 1
        this.fetchData()
      }
    },
  },

  mounted() {
    // Role do usuário (admin x user)
    this.refreshRole()
    window.addEventListener('user-updated', this.onUserUpdated)

    // Busca global (Header)
    this.searchTerm = String((this.$route && this.$route.query && this.$route.query.q) || '').trim()
    this._onGlobalSearch = (ev) => {
      try {
        if (!ev || !ev.detail) return
        if (ev.detail.context && ev.detail.context !== 'outros_times') return
        const term = String(ev.detail.term || '').trim()
        if (term === this.searchTerm) return
        this.searchTerm = term
        this.page = 1
        this.fetchData()
      } catch (e) { /* noop */ }
    }
    window.addEventListener('cm-search-change', this._onGlobalSearch)

    // 1) filtros -> 2) sliders -> 3) lista + total geral
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
    if (this._onGlobalSearch) {
      window.removeEventListener('cm-search-change', this._onGlobalSearch)
      this._onGlobalSearch = null
    }
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

      // Se não é admin, zera seleção (evita delete por engano)
      if (String(this.userRole).toLowerCase() !== 'admin') {
        this.selectedIds = []
      }
    },

    onUserUpdated(_e) {
      this.refreshRole()
    },

    /* ---------- Breadcrumb (navegação) ---------- */
    onBreadcrumbNavigate(to) {
      console.log('Breadcrumb navigate:', to)
    },

    /* ---------- UI helpers ---------- */
    labelFor(key) {
      const map = {
        Equipe: 'Equipe',
        Fornecedora: 'Fornecedora',
        Modelo: 'Modelo',
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

    // Exibição do período no grid (paralelo ao FlaGrid)
    periodoText(row) {
      const p = row?.Periodo
      if (p != null && String(p).trim() !== '') return String(p)
      const a = row?.AnoInicio
      return a != null ? String(a) : ''
    },

    highlightMatch(text, search) {
      if (!search || !text) return text || ''

      const searchLower = search.toLowerCase()
      const textLower = text.toLowerCase()
      const index = textLower.indexOf(searchLower)

      if (index === -1) return text

      const before = text.substring(0, index)
      const match = text.substring(index, index + search.length)
      const after = text.substring(index + search.length)

      return `${before}<span style="color: #dc2626; font-weight: 700;">${match}</span>${after}`
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

    onThumbOpen(payload) {
      // payload vem do Thumbs.vue: { index, items }
      this.photoIndex = (payload && typeof payload.index === 'number') ? payload.index : 0
      this.photoItems = Array.isArray(payload && payload.items) ? payload.items.slice() : []
      this.photoOpen = this.photoItems.length > 0
    },

    openView(row) {
      // Ícone "Visualizar": abre a 1ª foto do registro no PhotoViewer (paralelo ao FlaGrid)
      const items = this.buildPhotoItemsFromFotos(row ? row.Fotos : null)
      if (!items.length) return
      this.photoItems = items
      this.photoIndex = 0
      this.photoOpen = true
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

    openEdit(_row) {
      if (!this.isAdmin) return
      this.editRow = _row || null
      this.updateOpen = !!this.editRow
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

    /* ---------- Filtros (checkbox/slider) ---------- */
    isChecked(key, val) {
      return this.selected[key]?.has(val)
    },

    onToggleCheckbox(key, val, checked) {
      if (!this.selected[key]) this.selected[key] = new Set()
      if (checked) this.selected[key].add(val)
      else this.selected[key].delete(val)
      this.page = 1
      this.fetchData()
    },

    rangeFillStyle(kind) {
      const base = this.filters?.[kind] || { min: 0, max: 0 }
      const cur = this.ranges?.[kind] || { min: 0, max: 0 }

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

    triggerRefetch() {
      if (this.ranges.AnoInicio.min > this.ranges.AnoInicio.max) {
        const tmp = this.ranges.AnoInicio.min
        this.ranges.AnoInicio.min = this.ranges.AnoInicio.max
        this.ranges.AnoInicio.max = tmp
      }
      if (this.ranges.Preco.min > this.ranges.Preco.max) {
        const tmp2 = this.ranges.Preco.min
        this.ranges.Preco.min = this.ranges.Preco.max
        this.ranges.Preco.max = tmp2
      }
      this.page = 1
      this.fetchData()
    },

    clearAllFilters() {
      this.checkboxKeys.forEach((k) => (this.selected[k] = new Set()))
      this.equipeSearch = ''
      if (this.filters?.AnoInicio) {
        this.ranges.AnoInicio = { ...this.filters.AnoInicio }
      }
      if (this.filters?.Preco) {
        this.ranges.Preco = { ...this.filters.Preco }
      }
      this.page = 1
      this.fetchData()
    },

    /* ---------- Callbacks dos componentes modulares ---------- */
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

    async onCreateSuccess() {
      // Re-sync filtros (inclui novos min/max de sliders) e recarrega o grid sem refresh manual.
      const prevAno = (this.filters && this.filters.AnoInicio) ? { ...this.filters.AnoInicio } : { min: 0, max: 0 }
      const prevPreco = (this.filters && this.filters.Preco) ? { ...this.filters.Preco } : { min: 0, max: 0 }

      const anoUntouched =
        this.ranges && this.ranges.AnoInicio &&
        this.ranges.AnoInicio.min === prevAno.min &&
        this.ranges.AnoInicio.max === prevAno.max

      const precoUntouched =
        this.ranges && this.ranges.Preco &&
        this.ranges.Preco.min === prevPreco.min &&
        this.ranges.Preco.max === prevPreco.max

      try {
        await this.fetchFilters()
        this.filtersLoaded = true

        if (anoUntouched && this.filters && this.filters.AnoInicio) {
          this.ranges.AnoInicio = { ...this.filters.AnoInicio }
        }
        if (precoUntouched && this.filters && this.filters.Preco) {
          this.ranges.Preco = { ...this.filters.Preco }
        }
      } catch (e) {
        try { console.error(e) } catch (x) {}
      }

      // garante que apareça (se estiver em outra página)
      this.page = 1

      await Promise.all([this.fetchData(), this.fetchTotalAll()])
    },

    async onUpdateSuccess() {
      // Fecha o modal e recarrega grid/contagem
      this.updateOpen = false
      this.editRow = null
      await Promise.all([this.fetchData(), this.fetchTotalAll()])
    },

    /* ---------- Backend ---------- */
    async fetchFilters() {
      const res = await axios.get('/api/outros_times/filters')
      const j = res.data

      // checkboxes (Equipe não é mais checkbox, é search box)
      this.filters.Fornecedora = j.Fornecedora || []
      this.filters.Modelo = j.Modelo || []
      this.filters.Manga = j.Manga || []
      this.filters.Conservacao = j.Conservacao || []

      // sliders
      this.filters.AnoInicio = j.AnoInicio || { min: 0, max: 0 }
      this.filters.Preco = j.Preco || { min: 0, max: 0 }
    },

    buildQuery() {
      const params = new URLSearchParams()

      // Equipe search (on-the-fly via Header)
      if (this.searchTerm) {
        params.set('q', this.searchTerm)
        params.set('Equipe', this.searchTerm)
      }
      // checkboxes
      this.checkboxKeys.forEach((k) => {
        ;[...this.selected[k]].forEach((v) => params.append(k, v))
      })

      // sliders somente após filtros carregados
      if (this.filtersLoaded) {
        params.set('AnoInicio_min', String(this.ranges.AnoInicio.min))
        params.set('AnoInicio_max', String(this.ranges.AnoInicio.max))
        params.set('Preco_min', String(this.ranges.Preco.min))
        params.set('Preco_max', String(this.ranges.Preco.max))
      }

      // paginação
      params.set('page', String(this.page))
      params.set('pageSize', String(this.pageSize))

      // ordenação
      params.set('sortField', this.sortField)
      params.set('sortDir', this.sortDir)

      return params.toString()
    },

    async fetchData() {
      if (!this.filtersLoaded) return

      // Sequência do request atual: se outro request começar depois, este vira 'stale' e é ignorado.
      const _seq = ++this._fetchSeq

      this.loading = true
      try {
        const qs = this.buildQuery()
        const res = await axios.get(`/api/outros_times?${qs}${qs ? '&' : ''}_ts=${Date.now()}`)
        const j = res.data

        // se já houve um request mais novo, ignora esta resposta
        if (_seq !== this._fetchSeq) return

        this.data = Array.isArray(j.data) ? j.data : []

        // normaliza Fotos
        this.data = this.data.map((row) => {
          if (row.Fotos && typeof row.Fotos === 'string') {
            try {
              row.Fotos = JSON.parse(row.Fotos)
            } catch (e) {
              row.Fotos = []
            }
          }
          return row
        })

        this.total = Number(j.total || 0)
        this.from = Number(j.from || 0)
        this.to = Number(j.to || 0)
        this.page = Number(j.page || this.page)
        this.pageSize = Number(j.pageSize || this.pageSize)

        // contador do breadcrumb (N)
        this.visibleRecords = this.data.length
      } catch (e) {
        // se já houve um request mais novo, ignora este erro
        if (_seq !== this._fetchSeq) return

        console.error(e)
        this.data = []
        this.total = 0
        this.from = 0
        this.to = 0
        this.visibleRecords = 0
      } finally {
        if (_seq === this._fetchSeq) this.loading = false
      }
    },

    // total geral (X)
    async fetchTotalAll() {
      try {
        const res = await axios.get('/api/outros_times/count')
        const j = res.data
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

    /* ---------- Ações de toolbar ---------- */
    onClickNew() {
      if (!this.isAdmin) return
      this.resetCreateForm()
      this.createOpen = true
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
        const resp = await axios.post('/api/outros_times/delete', { ids }, { headers: { Authorization: 'Bearer ' + token } })
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

    // ===== Métodos de ordenação =====
    toggleSort(field) {
      const realField = field === 'Periodo' ? 'AnoInicio' : field

      if (this.sortField === realField) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = realField
        this.sortDir = 'asc'
      }

      this.page = 1
      this.fetchData()
    },

    ariaSort(field) {
      const realField = field === 'Periodo' ? 'AnoInicio' : field
      if (this.sortField === realField) {
        return this.sortDir === 'asc' ? 'ascending' : 'descending'
      }
      return 'none'
    },

    titleSort(labelVisivel, field) {
      const realField = field === 'Periodo' ? 'AnoInicio' : field
      const ehAtual = this.sortField === realField
      const proxima = ehAtual ? (this.sortDir === 'asc' ? 'decrescente' : 'crescente') : 'crescente'
      return 'Clique para ordenar por ' + labelVisivel + ' (' + proxima + ')'
    },

    // ---------- Create (POST Outros Times) ----------
    resetCreateForm() {
      this.createForm = {
        Equipe: '',
        Modelo: 'Casa',
        Fornecedora: 'Sem Fornecedora',
        Manga: 'Curta',
        Numero: '',
        Conservacao: '',
        Periodo: '',
        Preco: '',
        Observacoes: '',
      }
      this.createFotos = []
      this.createErrors = {}

      this.createModalPos = {
        top: '80px',
        left: 'calc(50vw - 390px)',
      }
      this.createModalDragging = false
    },

    createFileInputClick() {
      if (this.$refs.createFileInput) {
        this.$refs.createFileInput.click()
      }
    },

    onCreateFilesSelected(event) {
      const files = Array.prototype.slice.call(event.target.files || [])
      this.pushCreateFiles(files)
      event.target.value = ''
    },

    onCreateDrop(event) {
      const dt = event.dataTransfer
      if (!dt || !dt.files) return
      const files = Array.prototype.slice.call(dt.files)
      this.pushCreateFiles(files)
    },

    pushCreateFiles(files) {
      const current = this.createFotos.slice()
      const restantes = 6 - current.length
      if (restantes <= 0) {
        this.createErrors.Fotos = 'Você já atingiu o limite de 6 fotos.'
        return
      }

      const novos = files.slice(0, restantes)
      this.createFotos = current.concat(novos)
      this.createErrors.Fotos = ''
    },

    normalizePeriodo(value) {
      if (!value) return ''
      const v = String(value).trim()
      const m = v.match(/^(\d{4})\s*-\s*(\d{4})$/)
      if (m) {
        return m[1] + '-' + m[2]
      }
      return v
    },

    normalizeNumero(value) {
      if (value === null || value === undefined) return null
      const v = String(value).trim()
      return v ? v : null
    },

    normalizePreco(value) {
      if (value === null || value === undefined || value === '') return null
      let v = String(value).trim()
      v = v.replace(/^R\$/i, '').trim()
      v = v.replace(/\./g, '').replace(',', '.')
      const num = parseFloat(v)
      if (isNaN(num)) return null
      return num
    },

    authHeaders() {
      const token = localStorage.getItem('token')
      return token ? { Authorization: 'Bearer ' + token } : {}
    },

    // dropdown enums do Create
    toggleCreateDropdown(field) {
      this.createDropdownOpen[field] = !this.createDropdownOpen[field]
    },

    selectCreateOption(field, value) {
      if (field === 'Conservacao' && value === '__NONE__') {
        this.createForm[field] = ''
      } else {
        this.createForm[field] = value
      }
      this.createDropdownOpen[field] = false
    },

    displayCreateValue(field) {
      const v = this.createForm[field]
      if (field === 'Conservacao' && !v) {
        return 'nenhum'
      }
      return v || ''
    },

    async submitCreate() {
      this.createSaving = true
      this.createErrors = {}

      try {
        const payload = {
          Equipe: this.createForm.Equipe || null,
          Modelo: this.createForm.Modelo || null,
          Fornecedora: this.createForm.Fornecedora || null,
          Manga: this.createForm.Manga || null,
          Conservacao: this.createForm.Conservacao || null,
          Numero: this.normalizeNumero(this.createForm.Numero),
          Periodo: this.normalizePeriodo(this.createForm.Periodo),
          Preco: this.normalizePreco(this.createForm.Preco),
          Observacoes: this.createForm.Observacoes || null,
        }

        const fd = new FormData()
        fd.append('payload', JSON.stringify(payload))

        this.createFotos.forEach((file) => {
          fd.append('fotos', file)
        })

        const res = await fetch('/api/outros_times', {
          method: 'POST',
          headers: this.authHeaders(),
          body: fd,
        })

        if (!res.ok) {
          let errJson = {}
          try {
            errJson = await res.json()
          } catch (e) {
            // nada
          }
          if (errJson && errJson.fields) {
            this.createErrors = errJson.fields
          }
          throw new Error('Falha ao criar camisa de outro time.')
        }

        await res.json()

        this.createOpen = false
        this.resetCreateForm()
        this.page = 1
        this.fetchData()
      } catch (e) {
        console.error(e)
        if (!this.createErrors._) {
          this.createErrors._ = 'Erro ao salvar. Verifique os campos.'
        }
      } finally {
        this.createSaving = false
      }
    },

    // ---------- Drag do modal de Create ----------
    onCreateModalMouseDown(event) {
      // só botão esquerdo
      if (event.button !== 0) {
        return
      }

      // se clicou em controles de formulário, não inicia drag
      const tag = event.target.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'LABEL' ||
        tag === 'A'
      ) {
        return
      }

      const modalEl = this.$refs.createModal
      if (!modalEl) {
        return
      }

      this.createModalDragging = true

      const rect = modalEl.getBoundingClientRect()
      this.createModalDragStart = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        topPx: rect.top,
        leftPx: rect.left,
      }

      const self = this
      this._createModalMoveHandler = function (ev) {
        self.onCreateModalMouseMove(ev)
      }
      this._createModalUpHandler = function (ev) {
        self.onCreateModalMouseUp(ev)
      }

      window.addEventListener('mousemove', this._createModalMoveHandler)
      window.addEventListener('mouseup', this._createModalUpHandler)
    },

    onCreateModalMouseMove(event) {
      if (!this.createModalDragging) {
        return
      }
      const dx = event.clientX - this.createModalDragStart.mouseX
      const dy = event.clientY - this.createModalDragStart.mouseY

      const newTop = this.createModalDragStart.topPx + dy
      const newLeft = this.createModalDragStart.leftPx + dx

      this.createModalPos = {
        top: newTop + 'px',
        left: newLeft + 'px',
      }
    },

    onCreateModalMouseUp() {
      if (!this.createModalDragging) {
        return
      }
      this.createModalDragging = false

      if (this._createModalMoveHandler) {
        window.removeEventListener('mousemove', this._createModalMoveHandler)
        this._createModalMoveHandler = null
      }
      if (this._createModalUpHandler) {
        window.removeEventListener('mouseup', this._createModalUpHandler)
        this._createModalUpHandler = null
      }
    },
  },
}
</script>

<style scoped>
/* =========
   Layout
   ========= */
.grid-page {
  padding-left: 2vw;
  padding-right: 1vw;
}

.mb-10 {
  margin-bottom: 10px;
}

.container {
  display: grid;
  grid-template-columns: 14% 84%; /* filtros | grid */
  gap: 16px;
}


/* Colunas explícitas para evitar qualquer comportamento de "stack" */

.grid-col { min-width: 0; }

/* ============================================================
   Painel de filtros + botão limpar
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

/* Limpar filtros (desativado cinza; ativo azul escuro) */
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
  background: #0a2a66;
  color: #fff;
  cursor: pointer;
}

/* Box externo + cartões */
.filters-stack {
  background: #f4f6fb;
  border: 1px solid #dbe3f7;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-card {
  background: #fff;
  border: 1px solid #dbe3f7;
  border-radius: 12px;
  padding: 10px;
}

/* Cartões de checkboxes: aumentar só ALTURA (~10%) */
.filter-card.is-checkbox {
  padding-top: 14px;
  padding-bottom: 14px;
}

.filter-card.is-checkbox .checklist {
  margin-top: 12px;
}

/* Título dos filtros (retângulo, centralizado) */
.filter-card .pill-title {
  display: block;
  width: max-content;
  margin: 0 auto 8px;
  padding: 4px 8px;
  background: #0a2a66;
  color: #fff;
  font-weight: 400;
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
   SLIDERS (duplo range) — trilha, faixa central e thumbs
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

/* trilha neutra */
.range-track {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  background: #cfe0ff;
  border-radius: 2px;
  transform: translateY(-50%);
  z-index: 0;
}

/* faixa entre knobs — gradiente azul-marinho */
.range-fill {
  position: absolute;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  border-radius: 2px;
  z-index: 2;
  background: linear-gradient(90deg, #061a40 0%, #0a2a66 45%, #184b95 100%);
  box-shadow: inset 0 0 0 1px rgba(10, 42, 102, 0.15);
  transition:
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.slider-row:has(.range:active) .range-fill,
.slider-row:has(.range:focus-visible) .range-fill {
  box-shadow:
    inset 0 0 0 1px rgba(10, 42, 102, 0.25),
    0 0 8px rgba(10, 42, 102, 0.3);
  filter: saturate(1.05);
}

@media (prefers-reduced-motion: reduce) {
  .range-fill {
    transition: none;
  }
}

/* inputs centralizados e acima da faixa */
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

/* thumbs — azul-marinho */
.range::-webkit-slider-thumb {
  pointer-events: auto;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0a2a66;
  border: 2px solid #fff;
}

.range::-moz-range-thumb {
  pointer-events: auto;
  cursor: pointer;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0a2a66;
  border: 2px solid #fff;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
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
   Grid (cabeçalho azul-marinho + letras brancas)
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
  border: 1px solid #dbe3f7;
  border-radius: 10px;
}

table.grid {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  position: sticky;
  top: 0;
  background: #0a2a66;
  color: #fff;
  text-align: left;
  padding: 14px 8px;
  border-bottom: 2px solid #061a40;
  font-weight: 700;
}

/* Ícones e seleção */
.th-icon {
  width: 30px;
}

.th-check {
  width: 44px;
  text-align: center;
}

tbody td {
  padding: 8px;
  border-top: 1px solid #e9eefb;
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
   - Ícone editar desabilitado “esmaecido”
   ============================================================ */
.cb-disabled {
  cursor: url('/icones/cursor_proibido.png') 4 4, not-allowed;
}
.cb-disabled input {
  cursor: inherit;
}

.th-check input,
.cell-check input {
  cursor: pointer;
}

.th-check input:disabled,
.cell-check input:disabled {
  cursor: inherit;
}

.icon-btn:disabled{
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed !important;
}
.icon-btn:disabled img {
  opacity: 0.35;
  filter: grayscale(100%);
}


.th-numero,
.cell-numero {
  text-align: center;
}

/* Preço à esquerda e sem quebra */
.col-preco {
  min-width: 120px;
  text-align: left;
  white-space: nowrap;
}

/* zebradas */
tbody tr:nth-child(odd) {
  background: #fff;
}

tbody tr:nth-child(even) {
  background: #f7f9ff;
}

/* Observações (trunc + tooltip ancorado) */
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

/* Pager */
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

/* Responsivo */
@media (max-width: 1000px) {
  .container {
    grid-template-columns: 1fr;
  }
  thead th {
    top: 0;
  }
}

/* ===== Toolbar acima do grid ===== */
.grid-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 12px;
}

/* Botões base */
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

/* Outros Times — cores */
.btn-new {
  background: #0a2a66;
  color: #fff;
  border-color: #0a2a66;
}

.btn-new:disabled {
  background: #bfbfbf;
  color: #ffffff;
  border-color: #e3e3e3;
  cursor: url('/icones/cursor_proibido.png') 6 6, not-allowed !important;
  opacity: 0.9;
}

.btn-del {
  background: #0a2a66;
  color: #fff;
  border-color: #0a2a66;
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

/* ==================================
   ORDENAÇÃO: UX E ÍCONES (CARETS)
   ================================== */
.sortable {
  cursor: pointer;
  user-select: none;
}

.sort-hit:hover {
  opacity: 1;
  background-color: rgba(35, 75, 125, 0.80);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.sort-hit{
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  /* transition: transform 180ms ease;  */

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
.sort-caret.up{ transform: rotate(-180deg); }
.sort-caret.down{ transform: rotate(0deg); }
.sort-caret.idle{ transform: rotate(0deg); }

/* cores: ativo branco / idle cinza mais escuro (melhor contraste no navy) */
.sort-caret.up,
.sort-caret.down{ color: #ffffff; }
.sort-caret.idle{ color: #66728a; }

@media (prefers-reduced-motion: reduce){
  .sort-caret{ transition: none; }
}

/* ============================
   Modal de Create - Outros Times
   ============================ */

/* Backdrop escurecido */
.create-modal-backdrop.outros-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 4000;
}

/* Caixa principal do modal com tema azul */
.create-modal.outros-modal {
  position: fixed;
  width: 780px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #b0c4f0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 40px rgba(6, 26, 64, 0.65);
  cursor: grab;
}

/* enquanto está arrastando */
.create-modal.outros-modal.is-dragging {
  cursor: grabbing;
}

/* Cabeçalho do modal */
.create-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(to bottom, #061a40, #184b95);
  border-bottom: 1px solid #061a40;
}

.create-modal-header h2 {
  font-size: 15px;
  color: #ffffff;
  font-weight: 800;
}

/* Botão X de fechar */
.create-modal-close {
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
}

/* Corpo do formulário */
.create-form {
  padding: 12px 14px 10px;
  overflow-y: auto;
  background: #ffffff;
}

/* Linha de campos */
.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* Campo padrão */
.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Campo estreito (Número, Preço) */
.form-field-small {
  max-width: 130px;
}

/* Campo que ocupa linha inteira */
.form-field-full {
  flex: 1 1 100%;
}

/* Rótulo */
.form-field label {
  font-size: 12px;
  color: #222;
}

/* Inputs / textarea */
.form-field input,
.form-field textarea {
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #c5cbe8;
  padding: 6px 8px;
  font-size: 13px;
  color: #222;
}

/* Wrapper do preço */
.price-input-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #c5cbe8;
}

.price-prefix {
  padding: 0 6px;
  font-size: 12px;
  color: #555;
}

.price-input-wrapper input {
  border: none;
  background: transparent;
  padding: 4px 6px;
  font-size: 13px;
  color: #222;
}

/* Erros */
.field-error {
  margin-top: 2px;
  font-size: 11px;
  color: #d32f2f;
}

/* Dropzone para fotos */
.dropzone {
  margin-top: 4px;
  padding: 14px 10px;
  border-radius: 6px;
  border: 1px dashed #0a2a66;
  background: rgba(10, 42, 102, 0.05);
  text-align: center;
  cursor: pointer;
}

.dropzone-text {
  font-size: 12px;
  color: #333;
}

.dropzone-text small {
  color: #666;
}

/* Input file oculto */
.hidden-file-input {
  display: none;
}

/* Lista de arquivos */
.selected-files {
  margin-top: 4px;
  list-style: none;
  padding: 0;
  font-size: 11px;
  color: #444;
}

.selected-files li::before {
  content: '• ';
}

/* Rodapé do modal */
.create-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 14px 10px;
  border-top: 1px solid #dbe3f7;
  background: #f4f6fb;
}

/* Botões do rodapé */
.create-modal-footer .btn {
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
}

.create-modal-footer .btn-secondary {
  background: #e0e0e0;
  color: #222;
  border-color: #d0d0d0;
}

.create-modal-footer .btn-primary {
  background: #0a2a66;
  color: #ffffff;
  border-color: #0a2a66;
}

.create-modal-footer .btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ============================
   Dropdown enums (Create)
   ============================ */
.create-select-wrapper {
  position: relative;
}

.create-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #c5cbe8;
  background: #ffffff;
  font-size: 13px;
  cursor: pointer;
}

.create-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-select-arrow {
  margin-left: 8px;
  font-size: 11px;
}

/* Tema Outros Times */
.outros-select {
  border-color: #c5cbe8;
}

/* Lista de opções */
.create-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  min-width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
  border: 1px solid #061a40;
  background: #ffffff;
  z-index: 10;
  padding: 2px 0;
}

.outros-dropdown-menu {
  background: #0a2a66;
}

/* Item da lista */
.create-dropdown-item {
  padding: 6px 10px;
  font-size: 13px;
  color: #ffffff;
  cursor: pointer;
}

.create-dropdown-item:hover {
  background: #061a40;
  color: #f4f6fb;
}

/* Garante cursor adequado nos controles internos */
.create-modal.outros-modal input,
.create-modal.outros-modal textarea,
.create-modal.outros-modal button,
.create-modal.outros-modal .create-select,
.create-modal.outros-modal .dropzone,
.create-modal.outros-modal .create-dropdown-item {
  cursor: auto;
}
</style>
