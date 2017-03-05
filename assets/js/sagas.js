import { delay } from 'redux-saga'
import { put, call, takeEvery, takeLatest } from 'redux-saga/effects'
import { fetch } from './utils';
import { checkStatus, parse } from './middleware'

import { LOOKUP_COMPANY_CHANGE, LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE } from './actionTypes'

const fetchAndProcess = (...args) => fetch(...args).then(checkStatus).then(parse);


export function* lookupCompanyOnChange() {
    yield takeLatest(LOOKUP_COMPANY_CHANGE, fetchLookupCompany);
}


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
        console.log(err)
        yield put({ type: LOOKUP_COMPANY_FAILURE , err })
    }
}


export function* rootSagas(){
    yield [lookupCompanyOnChange()];
}


export function runSagas(sagaMiddleware){
    sagaMiddleware.run(rootSagas);
}