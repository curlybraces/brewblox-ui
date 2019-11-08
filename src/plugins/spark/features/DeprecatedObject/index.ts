import GenericBlock from '@/plugins/spark/components/GenericBlock';
import { Feature } from '@/store/features';

import { blockWidgetSelector } from '../../helpers';
import widget from './DeprecatedObjectWidget.vue';

const feature: Feature = {
  ...GenericBlock,
  id: 'DeprecatedObject',
  displayName: 'Deprecated Object',
  role: 'Other',
  widgetComponent: blockWidgetSelector(widget),
  wizardComponent: null,
  widgetSize: {
    cols: 4,
    rows: 2,
  },
};

export default { feature };
