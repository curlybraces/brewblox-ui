<script lang="ts">
import { QTree } from 'quasar';
import Vue from 'vue';
import { Component, Prop, Ref } from 'vue-property-decorator';
import { Watch } from 'vue-property-decorator';

import {
  defaultLabel,
  expandedNodes,
  nodeBuilder,
  QuasarNode,
  targetBuilder,
  targetSplitter,
} from '@/plugins/history/nodes';
import { historyStore } from '@/plugins/history/store';
import { QueryConfig } from '@/plugins/history/types';


@Component
export default class QueryEditor extends Vue {
  selectFilter: string | null = null;
  expandedKeys: string[] = [];

  @Ref()
  readonly tree!: QTree;

  @Prop({ type: Object, required: true })
  public readonly config!: QueryConfig;

  @Watch('selectFilter')
  updateExpanded(filter: string): void {
    if (filter) {
      this.expandedKeys = expandedNodes(this.nodes, filter);
    }
  }

  created(): void {
    historyStore.fetchKnownKeys();
  }

  mounted(): void {
    this.expandTicked();
  }

  expandTicked(): void {
    /**
     * Expanded keys must include parent elements
     * If we selected sparkey/blocky/value,
     * we must expand the following keys:
     * - sparkey
     * - sparkey/blocky
     */
    this.expandedKeys = [...new Set(
      this.ticked
        .flatMap(s => s
          // Remove leaf node -> 'sparkey/blocky'
          .replace(/\/[^\/]+$/, '')
          // Split in sections -> ['sparkey', 'blocky']
          .split('/')
          // Gradually build parents -> ['sparkey', 'sparkey/blocky']
          .map((v, idx, arr) => arr.slice(0, idx + 1).join('/')))
    )];
  }

  saveConfig(config: QueryConfig = this.config): void {
    this.$emit('update:config', config);
  }

  get ticked(): string[] {
    return targetSplitter(this.config.targets);
  }

  set ticked(vals: string[]) {
    this.$set(this.config, 'targets', targetBuilder(vals));
    vals
      .filter(key => this.config.renames[key] === undefined)
      .forEach(key => this.$set(this.config.renames, key, defaultLabel(key)));
    this.saveConfig();
  }

  get fields(): Mapped<string[]> {
    return historyStore.fields;
  }

  get nodes(): QuasarNode[] {
    return nodeBuilder(this.fields, {
      selectable: true,
      handler: this.nodeHandler,
      header: 'leaf',
    });
  }

  nodeHandler(node: QuasarNode): void {
    if (!this.tree.isTicked(node.value)) {
      this.tree.setTicked([node.value], true);
    }
  }

  nodeFilter(node: QuasarNode, filter: string): boolean {
    return node && node.value.toLowerCase().match(filter.toLowerCase());
  }
}
</script>

<template>
  <q-list dark>
    <div class="q-px-sm q-pb-sm row wrap">
      <div class="col-auto column">
        <q-item dark>
          <q-item-section>
            <q-input v-model="selectFilter" placeholder="Search" class="q-ma-none" dark clearable>
              <template #append>
                <q-icon name="search" />
              </template>
              <q-tooltip>
                Only fields that have been updated the last 24 hours are shown.
                <br />This includes renamed or deleted blocks.
              </q-tooltip>
            </q-input>
          </q-item-section>
        </q-item>
      </div>
      <div class="col-auto row">
        <q-btn flat class="q-px-sm" icon="mdi-collapse-all" @click="tree.collapseAll()">
          <q-tooltip>Collapse all</q-tooltip>
        </q-btn>
        <q-btn flat class="q-px-sm" icon="mdi-expand-all" @click="tree.expandAll()">
          <q-tooltip>Expand all</q-tooltip>
        </q-btn>
        <q-btn flat class="q-px-sm" icon="mdi-checkbox-multiple-marked-outline" @click="expandTicked">
          <q-tooltip>Expand selected fields</q-tooltip>
        </q-btn>
        <q-btn flat class="q-px-sm" icon="clear" @click="ticked = []">
          <q-tooltip>Unselect all</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-item dark class="column">
      <q-item-label caption class="q-pl-sm">
        Select data to show
      </q-item-label>
      <q-tree
        ref="tree"
        :nodes="nodes"
        :ticked.sync="ticked"
        :filter="selectFilter"
        :expanded.sync="expandedKeys"
        :filter-method="nodeFilter"
        tick-strategy="leaf-filtered"
        dark
        node-key="value"
      >
        <template #header-leaf="{node}">
          <div class="editable q-py-xs leaf-node-header">
            <slot name="leaf" :node="node" />
          </div>
        </template>
      </q-tree>
    </q-item>
  </q-list>
</template>

<style>
.leaf-node-header {
  width: 100%;
}
.leaf-node-header:hover {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
</style>