import { delay } from 'redux-saga'
import { select, put, call, takeEvery, takeLatest, take, race, fork } from 'redux-saga/effects';
import { fetch } from './utils';
import { checkStatus, parse } from './middleware'
import Promise from 'bluebird';
import { LOOKUP_COMPANY_CHANGE, LOOKUP_COMPANY_REQUEST, LOOKUP_COMPANY_SUCCESS, LOOKUP_COMPANY_FAILURE,
    LOOKUP_ADDRESS_CHANGE, LOOKUP_ADDRESS_REQUEST, LOOKUP_ADDRESS_SUCCESS, LOOKUP_ADDRESS_FAILURE,
    SEND_DOCUMENT_SUCCESS, TRANSACTION_REQUEST, RESOURCE_CREATE_SUCCESS,
    LOGOUT, MOUNTED } from './actionTypes';
import { mounted, showVersionWarning, requestUserInfo, addNotification } from './actions'
import STRINGS from './strings';


const fetchAndProcess = (...args) => fetch(...args).then(checkStatus).then(parse);

function *fireOnSuccessActions(action) {
    if (action.meta && action.meta.onSuccess) {
        for (const successAction of action.meta.onSuccess) {
            yield put(successAction);
        }
    }
}

function *fireOnFailureActions(action) {
    if (action.meta && action.meta.onFailure) {
        for (const failureAction of action.meta.onFailure) {
            yield put(failureAction);
        }
    }
}

function *afterActions() {
    yield takeEvery([
                   SEND_DOCUMENT_SUCCESS,
                   TRANSACTION_REQUEST,
                   RESOURCE_CREATE_SUCCESS
    ], fireOnSuccessActions)
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
        yield put({ type: LOOKUP_COMPANY_FAILURE , err })
    }
}

function* fetchLookupAddress(action) {
    yield put({ type: LOOKUP_ADDRESS_REQUEST, payload: action.payload.query });
    yield call(delay, 150);
    try {
        let url = `/api/address?query=${encodeURIComponent(action.payload.query)}`;
        if(action.payload.postal){
            url += '&postal=true'
        }
        const result = yield fetchAndProcess(url, {
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



function listenTo(dom, name){
    return new Promise(function (resolve) {
        dom.addEventListener && dom.addEventListener("storage", function handler(e) {
            dom.removeEventListener("storage", handler);
            //call any handler you want here, if needed
            resolve(e);
        });
    });
}


function *listenToStorage(){
    if(typeof window !== 'undefined'){
        while(true){
            const event = yield listenTo(window, 'storage')
            if(event.key === 'refresh'){
                try{
                    const keys = JSON.parse(event.newValue).keys;
                    if(keys.indexOf('userInfo') >= 0){
                        yield put(requestUserInfo({refresh: true}))
                    }
                }
                catch(e){};
            }
            if(event.key === 'message'){
                try{
                    const message = JSON.parse(event.newValue).message_type;
                    yield put(addNotification({message: STRINGS.notifications[message]}))
                }
                catch(e){};
            }
        }
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
    yield [lookupCompanyOnChange(),  lookupAddressOnChange(), longPollVersion(), listenToStorage(), afterActions()];
}


export function runSagas(sagaMiddleware){
    sagaMiddleware.run(rootSagas);
}