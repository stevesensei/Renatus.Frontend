<script setup lang="ts">
import type { z } from 'zod';
import type { unionDirectorySchema, unionMemberProfileSchema } from '../api/union';
import { t } from '../i18n';

type Member = z.infer<typeof unionMemberProfileSchema>;
type Directory = z.infer<typeof unionDirectorySchema>['servers'];
const props = defineProps<{
  readonly current: Member;
  readonly bindings: readonly Member[];
  readonly servers: Directory;
  readonly conflicts?: boolean;
}>();

function station(member: Member): { readonly code: string; readonly name: string; readonly url: string } {
  const code = member.backend_scopes?.self ?? '';
  const backend = props.servers.find(server => server['code'] === code || server['bs_root'] === member.backend);
  const rawUrl = member.backend ?? backend?.['bs_root'];
  const parsed = typeof rawUrl === 'string' ? URL.parse(rawUrl) : null;
  const url = parsed?.protocol === 'https:' || parsed?.protocol === 'http:' ? parsed.href : '';
  const name = member.backend_name ?? backend?.['name'];
  return { code: code || t('common.unknown'), name: typeof name === 'string' ? name : parsed?.hostname ?? '', url };
}
</script>

<template>
  <div class="union-table-scroll" tabindex="0" :aria-label="conflicts ? t('union.conflictTitle') : t('union.profiles')">
    <table class="union-profile-table">
      <thead><tr>
        <th scope="col">{{ t('union.mappedName') }}</th>
        <th scope="col">{{ t('union.station') }}</th>
        <template v-if="!conflicts"><th scope="col">{{ t('union.identity') }}</th><th scope="col">{{ t('union.relationship') }}</th></template>
      </tr></thead>
      <tbody>
        <tr v-for="(member, index) in [current, ...bindings]" :key="member.internal_id ?? index" :class="{ 'union-current-row': !conflicts && index === 0 }">
          <td><strong>{{ member.bind_mapped_name || member.mapped_name || member.name || t('common.unknown') }}</strong>
            <small v-if="member.name && member.name !== member.bind_mapped_name" class="muted">{{ member.name }}</small>
          </td>
          <td><span class="union-station-code">{{ station(member).code }}</span>
            <a v-if="station(member).url" :href="station(member).url" class="text-link" target="_blank" rel="noreferrer">{{ station(member).name || station(member).url }}</a>
            <small v-else class="muted">{{ station(member).name }}</small>
          </td>
          <template v-if="!conflicts">
            <td class="union-uuid-cell">
              <span>{{ index > 0 && member.bind_status === 0 ? t('union.usingUuid') : t('union.mappedUuid') }}</span>
              <code>{{ index === 0 ? member.mapped_uuid || member.uuid || '—' : member.uuid || member.mapped_uuid || '—' }}</code>
              <span class="muted">{{ t('union.originalUuid') }}</span>
              <code class="muted">{{ index === 0 ? member.uuid || '—' : member.mapped_uuid || member.uuid || '—' }}</code>
            </td>
            <td><div class="union-role-labels">
              <Tag v-if="index === 0" severity="secondary" :value="t('union.currentRole')" />
              <Tag v-if="member.bind_status === 0 && (index > 0 || bindings.length > 0)" severity="success" :value="t('union.masterRole')" />
              <span v-if="index > 0 && member.bind_status !== 0" class="muted">{{ t('union.linkedRole') }}</span>
            </div></td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
