import { Notify } from 'quasar';

import http from '@/helpers/http';
import notify from '@/helpers/notify';

import { BrewbloxDatabase, EventHandler, StoreObject } from './types';

const moduleNamespace = (moduleId: string): string =>
  `brewblox-ui-store:${moduleId}`;

const intercept = (message: string, moduleId: string): (e: Error) => never =>
  (e: Error) => {
    notify.error(`DB error in ${message}(${moduleId}): ${e.message}`, { shown: false });
    throw e;
  };

const retryDatastore = async (): Promise<void> => {
  while (true) {
    // Try to fetch the datastore
    // If it responds, it is available, and we can reload the page to use it
    // If it doesn't respond, show a notification with a progress bar
    // The notification resolves the awaited promise after `timeout` ms
    await new Promise(resolve =>
      http.get('/history/datastore/ping', { timeout: 2000 })
        .then(() => location.reload()) // reload page will abort the JS runtime
        .catch(() => Notify.create({
          timeout: 2000,
          icon: 'mdi-wifi-off',
          color: 'info',
          message: 'Waiting for datastore...',
          progress: true,
          onDismiss: () => resolve(), // continue
        })));
  }
};

export const checkDatastore = (): void => {
  http.get('/history/datastore/ping', { timeout: 2000 })
    .catch(err => {
      notify.error(`Datastore error: ${err}`, { shown: false });
      retryDatastore();
    });
};

export class BrewbloxRedisDatabase implements BrewbloxDatabase {
  // handlers are indexed on fully qualified namespace
  private handlers: Mapped<EventHandler> = {}

  public start(): void {
    checkDatastore();
  }

  public onChanged(changed: StoreObject[]): void {
    changed.forEach(obj =>
      this.handlers[obj.namespace!]?.onChanged(obj));
  }

  public onDeleted(deleted: string[]): void {
    deleted.forEach(key => {
      // The event uses the fully qualified ID
      // Separate the namespace from the ID here
      const idx = key.lastIndexOf(':');
      const namespace = key.substring(0, idx);
      const id = key.substring(idx + 1);
      this.handlers[namespace]?.onDeleted(id);
    });
  }

  public subscribe(handler: EventHandler): void {
    if (!handler.id) {
      throw new Error('Database handler id not set');
    }
    const namespace = moduleNamespace(handler.id);
    if (this.handlers[namespace] !== undefined) {
      throw new Error(`Database handler '${module.id}' is already registered`);
    }
    this.handlers[namespace] = Object.freeze(handler);
  }

  public async fetchAll<T extends StoreObject>(moduleId: string): Promise<T[]> {
    return http
      .post<{ values: T[] }>('/history/datastore/mget', {
        namespace: moduleNamespace(moduleId),
        filter: '*',
      })
      .then(resp => resp.data.values)
      .catch(intercept('Fetch all objects', moduleId));
  }

  public async fetchById<T extends StoreObject>(moduleId: string, objId: string): Promise<T> {
    return http
      .post<{ value: T }>('/history/datastore/get', {
        namespace: moduleNamespace(moduleId),
        id: objId,
      })
      .then(resp => resp.data.value)
      .catch(intercept(`Fetch '${objId}'`, moduleId));
  }

  public async persist<T extends StoreObject>(moduleId: string, obj: T): Promise<T> {
    return http
      .post<{ value: T }>('/history/datastore/set', {
        value: {
          ...obj,
          namespace: moduleNamespace(moduleId),
        },
      })
      .then(resp => resp.data.value)
      .catch(intercept(`Persist '${obj.id}'`, moduleId));
  }

  public create = this.persist;

  public async remove<T extends StoreObject>(moduleId: string, obj: T): Promise<T> {
    await http
      .post('/history/datastore/delete', {
        namespace: moduleNamespace(moduleId),
        id: obj.id,
      })
      .catch(intercept(`Remove '${obj.id}'`, moduleId));
    return obj;
  }
}
