\set ON_ERROR_STOP on
\if :{?app_password}
\else
  \echo 'Required psql variable app_password is missing.'
  \quit 1
\endif

select case when exists (select 1 from pg_roles where rolname = 'buzzerhood_app')
  then 'alter role buzzerhood_app with login nosuperuser nocreatedb nocreaterole noreplication nobypassrls password ' || quote_literal(:'app_password')
  else 'create role buzzerhood_app with login nosuperuser nocreatedb nocreaterole noreplication nobypassrls password ' || quote_literal(:'app_password')
end
\gexec

select format('grant connect on database %I to buzzerhood_app', current_database())
\gexec
