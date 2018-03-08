import { Block, BlockSaveBase } from '../state';

import { get, post } from './fetch';

export function fetchBlock(id: string): Promise<Block> {
  return get(`/blocks/${encodeURIComponent(id)}`);
}

export function fetchBlocks(): Promise<Block[]> {
  return get('/blocks/list');
}

export function persistBlock(block: BlockSaveBase): Promise<BlockSaveBase> {
  return post(`/blocks/${encodeURIComponent(block.id)}`, block);
}
