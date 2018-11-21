import { addVuexKey } from '@/store/vuex-key-fix';
import { RootState, RootStore } from '../state';
import { ServiceState, Service, ServicesContext } from './state';
import { createAccessors } from '@/helpers/static-store';

const { read } = createAccessors('services');

const getters = {
  services: (state: ServiceState): { [id: string]: Service } => state.services,
  serviceIds: (state: ServiceState): string[] => Object.keys(state.services),
  serviceValues: (state: ServiceState): Service[] => Object.values(state.services),
};

addVuexKey(getters);
export default getters;

const services = read(getters.services);

export const serviceIds = read(getters.serviceIds);
export const serviceValues = read(getters.serviceValues);

export function serviceById<T extends Service>(
  store: RootStore | ServicesContext,
  id: string, type?: string,
): T {
  const service = services(store)[id];
  if (!service) {
    throw new Error(`Service ${id} not found`);
  }
  if (service && type && service.type !== type) {
    throw new Error(`Invalid service: ${service.type} !== ${type}`);
  }
  return service as T;
}

export const serviceExists = (store: RootStore | ServicesContext, id: string) =>
  !!services(store)[id];
