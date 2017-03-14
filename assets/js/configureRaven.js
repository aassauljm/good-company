import Raven from 'raven-js';

export default function configureRaven(initialState) {
    const getSentryDSN = hostname => {
        if (hostname === 'test.gc.catalex.nz') {
            return 'https://7ce40019f74d43948619136f49eb74b2@sentry.io/139942';
        }

        if (hostname === 'goodcompanies.catalex.nz' || hostname === 'gc.catalex.nz') {
            return 'https://5ac3cf00797a4b18aee2a21a7752ae33@sentry.io/139940';
        }

        return 'https://7ce40019f74d43948619136f49eb74b2@sentry.io/139942';
        return false;
    };

    const sentryDSN = getSentryDSN(window.location.hostname);

    if (sentryDSN) {
        Raven.config(sentryDSN).install();
        Raven.setExtraContext({ state: initialState });
    }
};
