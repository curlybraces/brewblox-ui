import { Block, BlockSaveBase, MetricsResult, BlockBase } from './state';

import { get, put, patch } from '@/core/fetch';

function spreadData(input: any) {
  const spreadInput = {
    ...input,
    ...input.data,
  };

  delete spreadInput.data;

  return spreadInput;
}

export function fetchBlock(id: string): Promise<Block> {
  return get(`/blocks/${encodeURIComponent(id)}`).then(block => spreadData(block));
}

export function fetchBlocks(): Promise<Block[]> {
  return get('/blocks/list').then(blocks => blocks.map(spreadData));
}

export function persistBlock(block: BlockSaveBase): Promise<BlockSaveBase> {
  return put(`/blocks/${encodeURIComponent(block.id)}`, block);
}

export function fetchBlockMetrics(id: string): Promise<MetricsResult> {
  return get(`/blocks/${encodeURIComponent(id)}/metrics`);
}

export function updateBlock(block: BlockBase & any): Promise<BlockSaveBase> {
  return patch(`/blocks/${encodeURIComponent(block.id)}`, block);
}
