-- Prompter rooms: one script per room, last write wins, gone after 24 hours.
-- The table has row level security on and no policies, so the anon key cannot
-- read or list it directly. All access goes through the three functions below,
-- which require the room code.

create table if not exists public.prompter_rooms (
  code        text primary key check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  script      text not null default '',
  wpm         integer not null default 130,
  size        integer not null default 56,
  mirror      boolean not null default false,
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '24 hours'
);

alter table public.prompter_rooms enable row level security;
revoke all on public.prompter_rooms from anon, authenticated;

create or replace function public.room_get(p_code text)
returns table (code text, script text, wpm integer, size integer, mirror boolean, updated_at timestamptz, expires_at timestamptz)
language sql security definer set search_path = public as $$
  select code, script, wpm, size, mirror, updated_at, expires_at
  from public.prompter_rooms
  where code = upper(p_code) and expires_at > now();
$$;

create or replace function public.room_put(p_code text, p_script text, p_wpm integer, p_size integer, p_mirror boolean, p_updated_at timestamptz)
returns table (code text, script text, wpm integer, size integer, mirror boolean, updated_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if length(coalesce(p_script, '')) > 200000 then
    raise exception 'script too long';
  end if;
  return query
  insert into public.prompter_rooms as r (code, script, wpm, size, mirror, updated_at, expires_at)
  values (upper(p_code), coalesce(p_script, ''), coalesce(p_wpm, 130), coalesce(p_size, 56), coalesce(p_mirror, false),
          coalesce(p_updated_at, now()), now() + interval '24 hours')
  on conflict (code) do update
    set script = excluded.script, wpm = excluded.wpm, size = excluded.size, mirror = excluded.mirror,
        updated_at = excluded.updated_at, expires_at = excluded.expires_at
    where excluded.updated_at >= r.updated_at
  returning r.code, r.script, r.wpm, r.size, r.mirror, r.updated_at, r.expires_at;
end;
$$;

create or replace function public.room_delete(p_code text)
returns void
language sql security definer set search_path = public as $$
  delete from public.prompter_rooms where code = upper(p_code);
$$;

grant execute on function public.room_get(text) to anon;
grant execute on function public.room_put(text, text, integer, integer, boolean, timestamptz) to anon;
grant execute on function public.room_delete(text) to anon;

-- Sweep expired rooms once an hour.
create extension if not exists pg_cron;
select cron.schedule('prompter_rooms_sweep', '17 * * * *', $$delete from public.prompter_rooms where expires_at < now()$$);
