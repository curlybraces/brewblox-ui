import { uid } from 'quasar';

import { bloxLink, bloxQty } from '@/helpers/bloxfield';
import { BuilderConfig, BuilderLayout } from '@/plugins/builder/types';
import { GraphConfig } from '@/plugins/history/types';
import { BlockChange, QuickActionsConfig } from '@/plugins/spark/features/QuickActions/types';
import { sparkStore } from '@/plugins/spark/store';
import {
  ActuatorOffsetBlock,
  ActuatorPwmBlock,
  Block,
  BlockType,
  DigitalActuatorBlock,
  DigitalState,
  FilterChoice,
  PidBlock,
  ReferenceKind,
  SetpointSensorPairBlock,
} from '@/plugins/spark/types';
import { Widget } from '@/store/dashboards';
import { featureStore } from '@/store/features';

import { pidDefaults, unlinkedActuators, withoutPrefix, withPrefix } from '../helpers';
import { DisplayBlock } from '../types';
import { RimsConfig } from './types';

export function defineChangedBlocks(config: RimsConfig): Block[] {
  return unlinkedActuators(config.serviceId, [
    config.tubePin,
    config.pumpPin,
  ]);
}

export function defineCreatedBlocks(config: RimsConfig): Block[] {
  const groups = [0];
  const { serviceId, names } = config;

  const blocks: [
    SetpointSensorPairBlock,
    SetpointSensorPairBlock,
    ActuatorOffsetBlock,
    DigitalActuatorBlock,
    DigitalActuatorBlock,
    ActuatorPwmBlock,
    PidBlock,
    PidBlock,
  ] = [
      // setpoints
      {
        id: names.kettleSetpoint,
        type: BlockType.SetpointSensorPair,
        serviceId,
        groups,
        data: {
          sensorId: bloxLink(names.kettleSensor),
          storedSetting: bloxQty(67.7, 'degC'),
          settingEnabled: false,
          setting: bloxQty(null, 'degC'),
          value: bloxQty(null, 'degC'),
          valueUnfiltered: bloxQty(null, 'degC'),
          filter: FilterChoice.FILTER_15s,
          filterThreshold: bloxQty(5, 'delta_degC'),
          resetFilter: false,
        },
      },
      {
        id: names.tubeSetpoint,
        type: BlockType.SetpointSensorPair,
        serviceId,
        groups,
        data: {
          sensorId: bloxLink(names.tubeSensor),
          storedSetting: bloxQty(67.7, 'degC'),
          settingEnabled: true,
          setting: bloxQty(null, 'degC'),
          value: bloxQty(null, 'degC'),
          valueUnfiltered: bloxQty(null, 'degC'),
          filter: FilterChoice.FILTER_15s,
          filterThreshold: bloxQty(5, 'delta_degC'),
          resetFilter: false,
        },
      },
      // Setpoint Driver
      {
        id: names.tubeDriver,
        type: BlockType.ActuatorOffset,
        serviceId,
        groups,
        data: {
          targetId: bloxLink(names.tubeSetpoint),
          drivenTargetId: bloxLink(names.tubeSetpoint),
          referenceId: bloxLink(names.kettleSetpoint),
          referenceSettingOrValue: ReferenceKind.REF_SETTING,
          enabled: true,
          desiredSetting: 0,
          setting: 0,
          value: 0,
          constrainedBy: {
            constraints: [
              {
                max: 10,
                limiting: false,
              },
            ],
          },
        },
      },
      // Digital Actuators
      {
        id: names.tubeAct,
        type: BlockType.DigitalActuator,
        serviceId,
        groups,
        data: {
          hwDevice: bloxLink(config.tubePin.arrayId),
          channel: config.tubePin.pinId,
          invert: false,
          desiredState: DigitalState.STATE_INACTIVE,
          state: DigitalState.STATE_INACTIVE,
          constrainedBy: { constraints: [] },
        },
      },
      {
        id: names.pumpAct,
        type: BlockType.DigitalActuator,
        serviceId,
        groups,
        data: {
          hwDevice: bloxLink(config.pumpPin.arrayId),
          channel: config.pumpPin.pinId,
          invert: false,
          desiredState: DigitalState.STATE_INACTIVE,
          state: DigitalState.STATE_INACTIVE,
          constrainedBy: { constraints: [] },
        },
      },
      // PWM
      {
        id: names.tubePwm,
        type: BlockType.ActuatorPwm,
        serviceId,
        groups,
        data: {
          enabled: true,
          period: bloxQty('10s'),
          actuatorId: bloxLink(names.tubeAct),
          drivenActuatorId: bloxLink(null),
          setting: 0,
          desiredSetting: 0,
          value: 0,
          constrainedBy: { constraints: [] },
        },
      },
      // PID
      {
        id: names.kettlePid,
        type: BlockType.Pid,
        serviceId,
        groups,
        data: {
          ...pidDefaults(serviceId),
          kp: bloxQty(10, '1/degC'),
          ti: bloxQty('5m'),
          td: bloxQty('30s'),
          enabled: true,
          inputId: bloxLink(names.kettleSetpoint),
          outputId: bloxLink(names.tubeDriver),
        },
      },
      {
        id: names.tubePid,
        type: BlockType.Pid,
        serviceId,
        groups,
        data: {
          ...pidDefaults(serviceId),
          kp: bloxQty(30, '1/degC'),
          ti: bloxQty('2m'),
          td: bloxQty('10s'),
          enabled: true,
          inputId: bloxLink(names.tubeSetpoint),
          outputId: bloxLink(names.tubePwm),
        },
      },
    ];
  return blocks;
}

export function defineWidgets(config: RimsConfig, layouts: BuilderLayout[]): Widget[] {
  const { serviceId, dashboardId, names, prefix } = config;
  const userTemp = sparkStore.moduleById(serviceId)!.units.Temp;

  const createWidget = (name: string, type: string): Widget => ({
    ...featureStore.widgetSize(type),
    dashboard: dashboardId,
    id: uid(),
    title: name,
    feature: type,
    order: 0,
    config: {
      blockId: name,
      serviceId: serviceId,
    },
  });

  const builder: Widget<BuilderConfig> = {
    ...createWidget(withPrefix(prefix, 'Process'), 'Builder'),
    cols: 5,
    rows: 5,
    pinnedPosition: { x: 1, y: 1 },
    config: {
      currentLayoutId: layouts[0].id,
      layoutIds: layouts.map(l => l.id),
    },
  };

  const graph: Widget<GraphConfig> = {
    ...createWidget(withPrefix(prefix, 'Graph'), 'Graph'),
    cols: 6,
    rows: 5,
    pinnedPosition: { x: 6, y: 1 },
    config: {
      layout: {},
      params: { duration: '10m' },
      targets: [
        {
          measurement: serviceId,
          fields: [
            `${names.kettleSensor}/value[${userTemp}]`,
            `${names.tubeSensor}/value[${userTemp}]`,
            `${names.kettleSetpoint}/setting[${userTemp}]`,
            `${names.tubeSetpoint}/setting[${userTemp}]`,
            `${names.tubePwm}/value`,
            `${names.tubeAct}/state`,
            `${names.pumpAct}/state`,
          ],
        },
      ],
      renames: {
        [`${serviceId}/${names.kettleSensor}/value[${userTemp}]`]: 'Kettle temperature',
        [`${serviceId}/${names.tubeSensor}/value[${userTemp}]`]: 'Tube temperature',
        [`${serviceId}/${names.kettleSetpoint}/setting[${userTemp}]`]: 'Kettle setting',
        [`${serviceId}/${names.tubeSetpoint}/setting[${userTemp}]`]: 'Tube setting',
        [`${serviceId}/${names.tubePwm}/value`]: 'Tube element PWM value',
        [`${serviceId}/${names.tubeAct}/state`]: 'Tube element active',
        [`${serviceId}/${names.pumpAct}/state`]: 'Pump active',
      },
      axes: {
        [`${serviceId}/${names.tubePwm}/value`]: 'y2',
        [`${serviceId}/${names.tubeAct}/state`]: 'y2',
        [`${serviceId}/${names.pumpAct}/state`]: 'y2',
      },
      colors: {},
    },
  };

  const QuickActions: Widget<QuickActionsConfig> = {
    ...createWidget(withPrefix(prefix, 'Actions'), 'QuickActions'),
    cols: 4,
    rows: 5,
    pinnedPosition: { x: 1, y: 6 },
    config: {
      serviceId,
      changeIdMigrated: true,
      serviceIdMigrated: true,
      actions: [
        {
          name: 'Enable pump and heater',
          id: uid(),
          changes: [
            {
              id: uid(),
              serviceId,
              blockId: names.pumpAct,
              data: { desiredState: DigitalState.STATE_ACTIVE },
              confirmed: {},
            },
            {
              id: uid(),
              serviceId,
              blockId: names.kettleSetpoint,
              data: { settingEnabled: true },
              confirmed: {},
            },
          ] as [
              BlockChange<DigitalActuatorBlock>,
              BlockChange<SetpointSensorPairBlock>,
            ],
        },
        {
          name: 'Disable pump and heater',
          id: uid(),
          changes: [
            {
              id: uid(),
              serviceId,
              blockId: names.kettleSetpoint,
              data: { settingEnabled: false },
              confirmed: {},
            },
            {
              id: uid(),
              serviceId,
              blockId: names.pumpAct,
              data: { desiredState: DigitalState.STATE_INACTIVE },
              confirmed: {},
            },
          ] as [
              BlockChange<SetpointSensorPairBlock>,
              BlockChange<DigitalActuatorBlock>,
            ],
        },
        {
          name: 'Enable pump',
          id: uid(),
          changes: [
            {
              id: uid(),
              serviceId,
              blockId: names.pumpAct,
              data: { desiredState: DigitalState.STATE_ACTIVE },
              confirmed: {},
            },
          ] as [
              BlockChange<DigitalActuatorBlock>,
            ],
        },
        {
          name: 'Disable heater',
          id: uid(),
          changes: [
            {
              id: uid(),
              serviceId,
              blockId: names.kettleSetpoint,
              data: { settingEnabled: false },
              confirmed: {},
            },
          ] as [
              BlockChange<SetpointSensorPairBlock>,
            ],
        },
      ],
    },
  };

  return [
    builder,
    graph,
    QuickActions,
  ];
}

export const defineDisplayedBlocks = (config: RimsConfig): DisplayBlock[] => {
  const { kettlePid, tubePid } = config.names;
  return [
    {
      blockId: kettlePid,
      opts: {
        showDialog: false,
        color: 'E1AC00',
        name: withoutPrefix(config.prefix, kettlePid),
      },
    },
    {
      blockId: tubePid,
      opts: {
        showDialog: false,
        color: 'df2b35',
        name: withoutPrefix(config.prefix, tubePid),
      },
    },
  ];
};
