ALTER TABLE company_state RENAME COLUMN "constiutionFiled" to "constitutionFiled";

update company_state
    set "constitutionFiled" = update_table."constitutionFiled"

    from (

select data->>'constitutionFiled' = 'true' as "constitutionFiled", "currentCompanyStateId" as "id" from company left join source_data sd on source_data_id = sd.id

) as update_table

 where company_state.id = update_table.id;