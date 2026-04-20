<!-- ===========================
File: src/views/Home.vue
=========================== -->
<template>
  <div class="container" style="margin-top:16px;">
    <div class="card" style="padding:16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 style="margin:0 0 6px;">Bem-vindo</h2>
        <p class="muted" style="margin:0;">Acesse uma coleção para começar.</p>
      </div>

      <div class="row" style="gap:8px;">
        <router-link to="/flamengo" class="btn--icon-only btn--view" aria-label="Flamengo"></router-link>
        <router-link to="/outros_times" class="btn--icon-only btn--view" aria-label="Outros times"></router-link>
      </div>
    </div>
  </div>
</template>
<script setup>
// página simples de boas-vindas
</script>