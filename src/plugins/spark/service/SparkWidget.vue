<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { shortDateString } from '@/helpers/functional';
import { startChangeServiceTitle } from '@/helpers/services';
import { sparkStore } from '@/plugins/spark/store';
import { Block } from '@/plugins/spark/types';
import { WidgetContext } from '@/store/features';
import { Service, serviceStore } from '@/store/services';

import { blockTypes, SysInfoBlock, TicksBlock, WiFiSettingsBlock } from '../block-types';
import { isReady } from './getters';

@Component
export default class SparkWidget extends Vue {

  @Prop({ type: String, required: true })
  readonly serviceId!: string;

  @Prop({ type: Object, default: () => ({ mode: 'Basic', container: 'Dashboard' }) })
  public readonly context!: WidgetContext;

  get inDialog(): boolean {
    return this.context.container === 'Dialog';
  }

  get service(): Service {
    return serviceStore.serviceById(this.serviceId);
  }

  get lastBlocks(): string {
    return shortDateString(sparkStore.lastBlocks(this.serviceId), 'Unknown');
  }

  sysBlock<T extends Block>(blockType: string): T {
    return sparkStore.blockValues(this.serviceId)
      .find(block => block.type === blockType) as T;
  }

  get sysInfo(): SysInfoBlock {
    return this.sysBlock(blockTypes.SysInfo);
  }

  get ticks(): TicksBlock {
    return this.sysBlock(blockTypes.Ticks);
  }

  get wifi(): WiFiSettingsBlock {
    return this.sysBlock(blockTypes.WiFiSettings);
  }

  get ready(): boolean {
    return isReady(this.serviceId);
  }

  get sysDate(): string {
    return new Date(this.ticks.data.secondsSinceEpoch * 1000).toLocaleString();
  }

  fetchAll(): void {
    sparkStore.fetchAll(this.serviceId);
  }

  changeTitle(): void {
    startChangeServiceTitle(this.service);
  }
}
</script>

<template>
  <CardWrapper v-if="ready" v-bind="{context}">
    <template #toolbar>
      <DialogToolbar
        v-if="inDialog"
        :title="service.title"
        subtitle="Device info"
        @title-click="changeTitle"
      >
        <template #buttons>
          <q-btn flat round icon="refresh" @click="fetchAll" />
        </template>
      </DialogToolbar>
      <Toolbar
        v-else
        :title="service.title"
        subtitle="Device info"
        @title-click="changeTitle"
      >
        <template #buttons>
          <q-btn flat dense round icon="refresh" @click="fetchAll" />
        </template>
      </Toolbar>
    </template>

    <div class="widget-md">
      <div class="widget-body row">
        <LabeledField label="Firmware version" class="col-lg-5 col-11">
          {{ sysInfo.data.version }}
        </LabeledField>
        <LabeledField label="Firmware release date" class="col-lg-5 col-11">
          {{ sysInfo.data.releaseDate }}
        </LabeledField>
        <LabeledField label="Controller date / time" class="col-lg-5 col-11">
          {{ sysDate }}
        </LabeledField>
        <LabeledField label="Controller uptime" class="col-lg-5 col-11">
          {{ ticks.data.millisSinceBoot | duration }}
        </LabeledField>
        <LabeledField label="Service ID" class="col-lg-5 col-11">
          {{ serviceId }}
        </LabeledField>
        <LabeledField label="Controller ID" class="col-lg-5 col-11" tag-style="word-wrap: break-word;">
          {{ sysInfo.data.deviceId }}
        </LabeledField>
        <LabeledField label="IP address" class="col-lg-5 col-11">
          {{ wifi.data.ip }}
        </LabeledField>
        <LabeledField label="Last blocks update" class="col-lg-5 col-11">
          {{ lastBlocks }}
        </LabeledField>
      </div>
    </div>
  </CardWrapper>
</template>