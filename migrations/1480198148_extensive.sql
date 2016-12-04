ALTER TABLE company_state ADD COLUMN extensive BOOLEAN ;

CREATE OR REPLACE FUNCTION has_extensive_shareholding(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT extensive from  company_state cs where cs.id = $1
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_warnings(companyStateId integer)
    RETURNS JSONB
    AS $$
    SELECT jsonb_build_object(
        'pendingHistory', has_pending_historic_actions($1),
        'missingVotingShareholders', has_missing_voting_shareholders($1),
        'shareClassWarning', has_no_share_classes($1),
        'applyShareClassWarning', has_no_applied_share_classes($1),
        'extensiveWarning', has_extensive_shareholding($1)
        )
$$ LANGUAGE SQL;




UPDATE company_state SET warnings = get_warnings(id);