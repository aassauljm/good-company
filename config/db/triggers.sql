
CREATE OR REPLACE FUNCTION get_basic_warnings(companyStateId integer)
    RETURNS JSONB
    AS $$
    SELECT jsonb_build_object(
        'pendingHistory', COALESCE((cs.warnings->'pendingHistory')::TEXT::BOOLEAN, FALSE),
        'pendingFuture', COALESCE((cs.warnings->'pendingFuture')::TEXT::BOOLEAN, FALSE),
        'missingVotingShareholders', has_missing_voting_shareholders($1),
        'shareClassWarning', has_no_share_classes($1),
        'applyShareClassWarning', has_no_applied_share_classes($1),
        'extensiveWarning', has_extensive_shareholding($1),
        'treasuryStockOverAllocated', FALSE
        )
    FROM company_state cs WHERE cs.id = $1
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION apply_warnings()
RETURNS trigger AS $$
BEGIN
    UPDATE company_state set warnings = get_warnings(NEW.id) where id = NEW.id;

    -- TODO, save result of pendingHistory and propagate
     WITH RECURSIVE future_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  NEW.id
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, future_company_states tt
        WHERE tt.id = t."previousCompanyStateId")

     UPDATE company_state cs set warnings = get_warnings(cs.id)
     FROM (SELECT id from future_company_states) subquery
    WHERE subquery.id = cs.id and cs.id != NEW.id;

    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "generation") as (
        SELECT t.id, t."previousCompanyStateId", 0 as generation FROM company_state as t where t.id = NEW.id
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )
         UPDATE company_state cs set warnings = get_warnings(cs.id)
         FROM (SELECT id from prev_company_states) subquery
        WHERE subquery.id = cs.id;

  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION apply_basic_warnings()
RETURNS trigger AS $$
BEGIN
    UPDATE company_state set warnings = get_basic_warnings(NEW.id) where id = NEW.id;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS company_state_basic_warnings_trigger ON company_state;
CREATE TRIGGER company_state_basic_warnings_trigger AFTER INSERT OR UPDATE ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE PROCEDURE apply_basic_warnings();


CREATE OR REPLACE FUNCTION apply_retroactive_warnings()
RETURNS trigger AS $$
BEGIN
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "generation") as (
        SELECT t.id, t."previousCompanyStateId", 0 as generation FROM company_state as t where t.id = NEW.id
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )
         UPDATE company_state cs set warnings = jsonb_set(warnings, '{pendingFuture}', COALESCE(has_pending_future_actions(NEW.id), FALSE)::text::jsonb)
         FROM (SELECT id from prev_company_states) subquery
        WHERE subquery.id = cs.id;

  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION apply_retroactive_warnings_by_company()
RETURNS trigger AS $$
BEGIN
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "generation") as (
        SELECT t.id, t."previousCompanyStateId", 0 as generation FROM company_state as t where t.id = NEW."currentCompanyStateId"
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )
         UPDATE company_state cs set warnings = jsonb_set(warnings, '{pendingFuture}', COALESCE(has_pending_future_actions(NEW.id), FALSE)::text::jsonb)
         FROM (SELECT id from prev_company_states) subquery
        WHERE subquery.id = cs.id;

  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS company_state_future_warnings_insert_trigger ON company_state;
CREATE TRIGGER company_state_future_warnings_insert_trigger AFTER INSERT ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE PROCEDURE apply_retroactive_warnings();

DROP TRIGGER IF EXISTS company_state_future_warnings_update_trigger ON company_state;
CREATE TRIGGER company_state_future_warnings_update_trigger AFTER UPDATE ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0 AND (OLD.pending_future_action_id IS DISTINCT FROM NEW.pending_future_action_id OR OLD."previousCompanyStateId" IS DISTINCT FROM NEW."previousCompanyStateId"))
    EXECUTE PROCEDURE apply_retroactive_warnings();



CREATE OR REPLACE FUNCTION apply_proactive_warnings()
RETURNS trigger AS $$
BEGIN
     WITH RECURSIVE future_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  NEW.id
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, future_company_states tt
        WHERE tt.id = t."previousCompanyStateId")


         UPDATE company_state cs set warnings = jsonb_set(warnings, '{pendingHistory}',  has_pending_historic_actions(cs.id)::text::jsonb)
         FROM (SELECT id from future_company_states) subquery
        WHERE subquery.id = cs.id;

  RETURN NEW;
END $$ LANGUAGE 'plpgsql';


DROP TRIGGER IF EXISTS company_state_history_warnings_insert_trigger ON company_state;
CREATE TRIGGER company_state_history_warnings_insert_trigger AFTER INSERT ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE PROCEDURE apply_proactive_warnings();

DROP TRIGGER IF EXISTS company_state_history_warnings_update_trigger ON company_state;
CREATE TRIGGER company_state_history_warnings_update_trigger AFTER UPDATE ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0 AND (OLD.pending_historic_action_id IS DISTINCT FROM NEW.pending_historic_action_id OR OLD."previousCompanyStateId" IS DISTINCT FROM NEW."previousCompanyStateId"))
    EXECUTE PROCEDURE apply_proactive_warnings();




CREATE OR REPLACE FUNCTION update_annual_returns()
RETURNS trigger AS $$
BEGIN

DELETE FROM annual_return where "companyId" = NEW.id;
INSERT INTO annual_return ("companyId", "documentId", "effectiveDate", "createdAt", "updatedAt") ((
SELECT c.id, d.id, date, now(), now()
    FROM company c
    JOIN company_state cs ON cs.id = c."currentCompanyStateId"
        LEFT OUTER JOIN doc_list_j dlj on cs.doc_list_id = dlj.doc_list_id
        LEFT OUTER JOIN document d on d.id = dlj.document_id
    WHERE c.id = NEW.id and type = 'Companies Office' and (filename = 'File Annual Return' or filename = 'Online Annual Return' or filename = 'Annual Return Filed')
));

  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

/* UPDATE FOR ANNUAL RETURNS IS ONLY ON AN UPDATE
*/
DROP TRIGGER IF EXISTS company_update_annual_returns_update_trigger ON company;
CREATE TRIGGER company_update_annual_returns_update_trigger AFTER UPDATE ON company
    FOR EACH ROW
    WHEN  (OLD."currentCompanyStateId" IS DISTINCT FROM NEW."currentCompanyStateId")
    EXECUTE PROCEDURE update_annual_returns();


DROP TRIGGER IF EXISTS company_update_retroactive_warnings_update_trigger ON company;
CREATE TRIGGER company_update_retroactive_warnings_update_trigger AFTER UPDATE ON company
    FOR EACH ROW
    WHEN  (OLD."currentCompanyStateId" IS DISTINCT FROM NEW."currentCompanyStateId")
    EXECUTE PROCEDURE apply_retroactive_warnings_by_company();

