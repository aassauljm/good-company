import Raven from 'raven-js';

export default function configureRaven(getState) {
    const getSentryDSN = hostname => {
        if (hostname === 'test.gc.catalex.nz') {
            return 'https://7ce40019f74d43948619136f49eb74b2@sentry.io/139942';
        }

        if (hostname === 'gc.catalex.nz') {
            return 'https://5ac3cf00797a4b18aee2a21a7752ae33@sentry.io/139940';
        }

        return false;
    };

    const sentryDSN = getSentryDSN(window.location.hostname);

    if (sentryDSN) {
        Raven.config('https://3806c3ea3fd64c13bef86bf7b9a0ae42@sentry.io/139837').install();
        Raven.setExtraContext({ state: getState() });
    }
};