-- Provision StrainVerse profiles for Verse users who signed up on another app
-- (e.g. SpiritsVerse or Cookbook) or whose StrainVerse profile failed to create.
-- DEPRECATED: merged into sql/complete-schema.sql — run that file instead.
-- Run after sql/complete-schema.sql or sql/bootstrap-strainverse.sql

do $$
declare
  r record;
  base_handle text;
  final_handle text;
  suffix text;
begin
  for r in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join "StrainVerse".profiles p on au.id = p.id
    where p.id is null
  loop
    base_handle := lower(
      regexp_replace(
        coalesce(
          r.raw_user_meta_data->>'handle',
          r.raw_user_meta_data->>'username',
          split_part(r.email, '@', 1),
          'user'
        ),
        '[^a-z0-9_]', '', 'g'
      )
    );
    if base_handle = '' then base_handle := 'user'; end if;
    base_handle := left(base_handle, 24);
    suffix := left(replace(r.id::text, '-', ''), 8);
    final_handle := base_handle;

    if exists (select 1 from "StrainVerse".profiles where handle = final_handle and id <> r.id) then
      final_handle := left(base_handle || '_' || suffix, 24);
    end if;
    if exists (select 1 from "StrainVerse".profiles where handle = final_handle and id <> r.id) then
      final_handle := 'user_' || suffix;
    end if;

    insert into "StrainVerse".profiles (id, name, handle, avatar, bio, date_of_birth)
    values (
      r.id,
      left(
        coalesce(
          r.raw_user_meta_data->>'name',
          r.raw_user_meta_data->>'full_name',
          split_part(r.email, '@', 1),
          'User'
        ),
        80
      ),
      final_handle,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || r.id,
      '',
      nullif(coalesce(r.raw_user_meta_data->>'date_of_birth', r.raw_user_meta_data->>'dob'), '')::date
    )
    on conflict (id) do nothing;

    raise notice 'Provisioned StrainVerse profile for % (%)', r.email, r.id;
  end loop;
end $$;

-- Clear legacy preset bios from earlier builds
update "StrainVerse".profiles set bio = '' where bio = 'Just vibing.';

select au.email, p.handle, p.name
from auth.users au
join "StrainVerse".profiles p on p.id = au.id
order by au.created_at desc
limit 20;
