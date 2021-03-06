<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { createDialog } from '@/helpers/dialog';
import { saveFile } from '@/helpers/import-export';
import notify from '@/helpers/notify';
import { historyStore } from '@/plugins/history/store';
import { GraphConfig, QueryParams, QueryTarget } from '@/plugins/history/types';

const precisionOpts: SelectOption[] = [
  { label: 'Nanoseconds since 1-1-1970', value: 'ns' },
  { label: 'Milliseconds since 1-1-1970', value: 'ms' },
  { label: 'Seconds since 1-1-1970', value: 's' },
  { label: 'String (ISO-8601)', value: 'ISO8601' },
];

@Component
export default class ExportGraphAction extends Vue {

  @Prop({ type: String, default: 'mdi-file-export' })
  public readonly icon!: string;

  @Prop({ type: String, default: 'Export graph to CSV' })
  public readonly label!: string;

  @Prop({ type: String, required: true })
  public readonly header!: string;

  @Prop({ type: Object, required: true })
  public readonly config!: GraphConfig;

  async fetchTarget(params: QueryParams, target: QueryTarget, timestamp: string): Promise<void> {
    const isText = timestamp === 'ISO8601';
    const epoch = isText ? 'ms' : timestamp;
    notify.info('Generating CSV file... This may take a few seconds.');
    const result = await historyStore.fetchValues([params, target, epoch]);
    if (isText) {
      result
        .values
        .forEach(slice => slice[0] = new Date(slice[0]).toISOString() as any);
    }
    const lines: string[] = [
      result.columns.join(),
      ...result
        .values
        .map(slice => slice.map(v => v === null ? '' : v.toString()).join()),
    ];
    saveFile(lines.join('\n'), `graph-${this.header}-${result.name}-${result.policy}.csv`, true);
  }

  async exportData(): Promise<void> {
    createDialog({
      component: 'SelectDialog',
      value: precisionOpts.find(v => v.value === 'ms'),
      selectOptions: precisionOpts,
      title: 'Select timestamp formatting',
      message: 'The first value on every line in the CSV file shows the timestamp.',
      selectProps: {
        label: 'Formatting',
      },
    })
      .onOk(async (opt: SelectOption) => {
        if (!opt) { return; }
        const params: QueryParams = { ...this.config.params, policy: 'downsample_1m' };
        await Promise.all(this.config.targets.map(target => this.fetchTarget(params, target, opt.value)));
      });
  }
}
</script>

<template>
  <ActionItem v-bind="{...$attrs, ...$props}" @click="exportData" />
</template>
