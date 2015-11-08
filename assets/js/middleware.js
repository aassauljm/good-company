
function checkStatus(response) {
  if (response.status >= 200 && response.status <= 304) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

function parseJSON(response) {
  return response.json()
}

export function callAPIMiddleware({
    dispatch, getState
}) {
    return next => {

        return action => {
            const {
                types,
                callAPI,
                shouldCallAPI = () => true,
                payload = {}
            } = action;

            if (!types) {
                // Normal action: pass it on
                return next(action);
            }
            if (!Array.isArray(types) ||
                types.length !== 3 ||
                !types.every(type => typeof type === 'string')
            ) {
                throw new Error('Expected an array of three string types.');
            }
            if (typeof callAPI !== 'function') {
                throw new Error('Expected fetch to be a function.');
            }
            if (!shouldCallAPI(getState())) {
                return;
            }

            const [requestType, successType, failureType] = types;

            dispatch(Object.assign({}, payload, {
                type: requestType
            }));
            return callAPI()
                .then(checkStatus)
                .then(parseJSON)
                .then(response => dispatch(Object.assign({}, payload, {
                    response: response,
                    type: successType
                })))
                .catch(error => {
                    if(error.response)
                        return error.response.json()
                        .then(response =>
                               dispatch(Object.assign({}, payload, {
                            response: response,
                            error: true,
                            type: failureType
                        })));
                    return dispatch(Object.assign({}, payload, {
                        error: error,
                        response: error.response,
                        type: failureType
                    }));
                })
        };
    };
}
