export const INSERT_EXECUTION_DATA_SQL = `
-- Insert or update execution data from a posted financial report
WITH payload AS (
    SELECT $1::jsonb AS doc
),
leaf_rows AS (
    SELECT
        item ->> 'title'                       AS activity_name,
        (item -> 'values' ->> 'q1')::numeric   AS q1_amount,
        (item -> 'values' ->> 'q2')::numeric   AS q2_amount,
        (item -> 'values' ->> 'q3')::numeric   AS q3_amount,
        (item -> 'values' ->> 'q4')::numeric   AS q4_amount,
        item -> 'values' ->> 'comments'        AS comment
    FROM payload,
         jsonb_array_elements(doc -> 'items') AS item
    WHERE item ->> 'type' = 'line_item'
)
INSERT INTO execution_data (
        reporting_period_id,
        activity_id,
        facility_id,
        q1_amount,
        q2_amount,
        q3_amount,
        q4_amount,
        comment
)
SELECT
        $3::int,
        act.id,
        $2::int,
        COALESCE(l.q1_amount, 0),
        COALESCE(l.q2_amount, 0),
        COALESCE(l.q3_amount, 0),
        COALESCE(l.q4_amount, 0),
        NULLIF(l.comment, '')
FROM    leaf_rows l
JOIN    activities act ON act.name = l.activity_name
ON CONFLICT (reporting_period_id, activity_id, facility_id)
DO UPDATE SET
        q1_amount  = EXCLUDED.q1_amount,
        q2_amount  = EXCLUDED.q2_amount,
        q3_amount  = EXCLUDED.q3_amount,
        q4_amount  = EXCLUDED.q4_amount,
        comment    = EXCLUDED.comment,
        updated_at = NOW();
`; 