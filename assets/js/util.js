
import _ from 'lodash';

const unsubscribes = new Map();

export function storeDecorator(...stores) {
  return function decorator(Component) {
    return class StoreComponent extends Component {
      constructor(props) {
        super(props);

        const storesState = _.chain(stores)
          .pluck('getInitialState')
          .filter(_.isFunction)
          .map(f => f())
          .value();


        this.state = this.state || {};
        Object.assign(this.state, ...storesState);
      }

      componentDidMount() {
        if (super.componentDidMount) {
          super.componentDidMount();
        }

        const storesUnsubscribes = _.map(stores, (store) => store.listen(this.setState.bind(this)));
        const componentUnsubscribes = (
          unsubscribes.has(this) ? unsubscribes.get(this).concat(storesUnsubscribes) : storesUnsubscribes
        );

        unsubscribes.set(this, componentUnsubscribes);
      }

      componentWillUnmount() {
        if (super.componentWillUnmount) {
          super.componentWillUnmount();
        }

        _.forEach(unsubscribes.get(this), f => f());
      }
    };
  };
}