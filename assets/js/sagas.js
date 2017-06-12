import { delay } from 'redux-saga'
import { select, put, call, takeEvery, takeLatest, take, race, fork } from 'redux-saga/effects';
import { fetch } from './utils';
import { checkStatus, parse } from './middleware'

import { LOOKUP_COMPANY_CHANGE, LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE,
    LOOKUP_ADDRESS_CHANGE, LOOKUP_ADDRESS_REQUEST, LOOKUP_ADDRESS_SUCCESS, LOOKUP_ADDRESS_FAILURE,
    LOGOUT, MOUNTED } from './actionTypes';
import { mounted, showVersionWarning } from './actions'

const fetchAndProcess = (...args) => fetch(...args).then(checkStatus).then(parse);


function* fetchLookupCompany(action) {
    yield put({ type: LOOKUP_COMPANY_REQUEST, payload: action.payload.query });
    yield call(delay, 150);
    try {
        const result = yield fetchAndProcess(`/api/company/lookup?query=${encodeURIComponent(action.payload.query)}`, {
                credentials: 'same-origin'
            });
        yield put({ type: LOOKUP_COMPANY_SUCCESS, response: result })
    }
    catch(err) {
        yield put({ type: LOOKUP_COMPANY_FAILURE , err })
    }
}

function* fetchLookupAddress(action) {
    yield put({ type: LOOKUP_ADDRESS_REQUEST, payload: action.payload.query });
    yield call(delay, 150);
    try {
        const result = yield fetchAndProcess(`/api/address?query=${encodeURIComponent(action.payload.query)}`, {
                credentials: 'same-origin'
            });
        yield put({ type: LOOKUP_ADDRESS_SUCCESS, response: result })
    }
    catch(err) {
        yield put({ type: LOOKUP_ADDRESS_FAILURE , err })
    }
}


export function* lookupCompanyOnChange() {
    yield takeLatest(LOOKUP_COMPANY_CHANGE, fetchLookupCompany);
}

export function* lookupAddressOnChange() {
    yield takeLatest(LOOKUP_ADDRESS_CHANGE, fetchLookupAddress);
}
// Fetch data every 60 seconds
function* pollVersion() {
    try {
        yield call(delay, 60000);
        const hash = yield select((state) => state.version.ASSET_HASH);
        const response = yield fetchAndProcess(`/api/version`);
        if(hash && response.ASSET_HASH && hash !== response.ASSET_HASH){
            yield put(showVersionWarning());
        }
        else{
            yield put(mounted());
        }
    } catch (error) {
      yield put(mounted())
      return;
    }
}


export function* longPollVersion() {
    while (true) {
        yield take(MOUNTED);
        yield race([
          fork(pollVersion),
          take(LOGOUT)
        ])
    }
}


export function* rootSagas(){
    yield [lookupCompanyOnChange(),  lookupAddressOnChange(), longPollVersion()];
}


export function runSagas(sagaMiddleware){
    sagaMiddleware.run(rootSagas);
}