<script setup lang="ts">
import { Brush, Plus, Search } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import TextureCard from '../components/TextureCard.vue';
import { state } from '../data/state';
import type { TexturePreview } from '../data/types';
import { api } from '../api/client';
import { session } from '../api/session';
import { loadOwnedTextures, loadFavoriteTextures, texturePageSchema } from '../api/textures';
import { useOperation } from '../composables/operation';
const operation=useOperation();const router=useRouter();
const search=ref('');const kind=ref('all');const collection=ref('public');const page=ref(1);
const items=ref<TexturePreview[]>([]);const count=ref(0);const total=ref(1);
const filtered=computed(()=>({length:count.value}));const currentPage=computed(()=>page.value);
let timer:ReturnType<typeof setTimeout>|undefined;let revision=0;
async function load():Promise<void>{
 const current=++revision;
 await operation.run(async()=>{
  if(collection.value==='favorites'){
    const favorites=await loadFavoriteTextures();
    const selected=favorites.textures.filter(t=>(kind.value==='all'||t.type===kind.value)&&(t.name+t.author).toLowerCase().includes(search.value.toLowerCase()));
    if(current!==revision)return;
    count.value=selected.length;total.value=Math.max(1,Math.ceil(selected.length/12));page.value=Math.min(page.value,total.value);items.value=selected.slice((page.value-1)*12,page.value*12).map(t=>({...t,isFavorited:true,owned:state.textures.some(owned=>owned.id===t.id&&owned.owned)}));
  }else{
    const result=await api('texture/public',texturePageSchema,{searchParams:{page:page.value,pageSize:12,search:search.value,...(kind.value==='all'?{}:{type:kind.value==='skin'?0:1})}});
    if(current!==revision)return;
    count.value=result.totalCount;total.value=Math.max(1,result.totalPages);page.value=result.page;
    items.value=result.textures.map(t=>({...t,owned:state.textures.some(owned=>owned.id===t.id&&owned.owned)}));
  }
 });
}
onMounted(async()=>{if(session.token)await operation.run(async()=>{const result=await loadOwnedTextures();state.textures=result.textures.map(t=>({...t,owned:true,isFavorited:true}));});await load();});
watch([collection,kind,search],()=>{page.value=1;++revision;clearTimeout(timer);timer=setTimeout(load,300);});
watch(page,()=>{void load();});
onBeforeUnmount(()=>{clearTimeout(timer);++revision;});

</script>
<template>
  <PageHeading eyebrow="找到下一套装扮" title="材质库" description="探索皮肤与披风，收藏你喜欢的创作。"><RouterLink to="/textures/upload" class="button-link"><Plus :size="18" />上传材质</RouterLink></PageHeading>
  <div class="library-toolbar">
    <div class="segmented"><Button :outlined="collection !== 'public'" label="公开材质" @click="collection = 'public'; page = 1" /><Button :outlined="collection !== 'favorites'" label="我的收藏" @click="session.token ? collection = 'favorites' : router.push({path:'/login',query:{returnUrl:'/textures'}})" /></div>
    <div class="filter-cluster"><span class="search-field"><Search :size="17" /><InputText v-model="search" aria-label="搜索材质" placeholder="搜索材质或作者" /></span><Select v-model="kind" :options="[{ label: '全部类型', value: 'all' }, { label: '皮肤', value: 'skin' }, { label: '披风', value: 'cape' }]" option-label="label" option-value="value" aria-label="材质类型" /></div>
  </div>
  <p class="result-count muted">{{ filtered.length }} 份材质 · 每一份创作，都值得被看见。</p>
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <Message v-else-if="operation.pending.value" severity="info">正在加载材质…</Message>
  <div v-else-if="items.length" class="texture-grid"><TextureCard v-for="texture in items" :key="texture.id" :texture="texture" /></div>
  <section v-else class="panel empty-state"><Brush :size="44" /><h2>暂时没有找到材质</h2><p class="muted">试试其他关键词，或上传你的第一份创作。</p><Button outlined label="清除筛选" @click="search = ''; kind = 'all'" /></section>
  <div class="pagination"><Button outlined severity="secondary" label="上一页" :disabled="currentPage <= 1" @click="page = currentPage - 1" /><span>第 {{ currentPage }} / {{ total }} 页</span><Button outlined severity="secondary" label="下一页" :disabled="currentPage >= total" @click="page = currentPage + 1" /></div>
</template>
