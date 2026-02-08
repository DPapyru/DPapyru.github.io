create table if not exists public.ai_cooldowns (
    github_user text primary key,
    next_allowed_at timestamptz not null,
    updated_at timestamptz not null default now()
);

alter table public.ai_cooldowns enable row level security;

create or replace function public.consume_ai_cooldown(
    p_github_user text,
    p_cooldown_seconds integer default 60
)
returns table(
    allowed boolean,
    retry_after_sec integer,
    next_allowed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user text := lower(trim(coalesce(p_github_user, '')));
    v_now timestamptz := now();
    v_next timestamptz;
    v_cooldown integer := greatest(coalesce(p_cooldown_seconds, 60), 1);
begin
    if v_user = '' then
        raise exception 'github_user is required';
    end if;

    select c.next_allowed_at
      into v_next
      from public.ai_cooldowns c
     where c.github_user = v_user
     for update;

    if not found then
        v_next := v_now + make_interval(secs => v_cooldown);
        insert into public.ai_cooldowns(github_user, next_allowed_at, updated_at)
        values (v_user, v_next, v_now);

        return query select true, 0, v_next;
        return;
    end if;

    if v_next > v_now then
        return query
            select false,
                   greatest(1, ceil(extract(epoch from (v_next - v_now)))::int),
                   v_next;
        return;
    end if;

    v_next := v_now + make_interval(secs => v_cooldown);

    update public.ai_cooldowns
       set next_allowed_at = v_next,
           updated_at = v_now
     where github_user = v_user;

    return query select true, 0, v_next;
end;
$$;

revoke all on function public.consume_ai_cooldown(text, integer) from public;
grant execute on function public.consume_ai_cooldown(text, integer) to service_role;
