import { createClient } from '@supabase/supabase-js';

const { URL } = globalThis;

const REQUIRED_ENV = {
  guard: 'WSS_ALLOW_SUPABASE_VALIDATION',
  environment: 'WSS_SUPABASE_ENVIRONMENT',
  projectRef: 'WSS_SUPABASE_PROJECT_REF',
};

const OPTIONAL_URL_ENV = ['WSS_SUPABASE_URL', 'VITE_SUPABASE_URL'];
const OPTIONAL_KEY_ENV = ['WSS_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const EXPECTED_PROJECT_REF = 'vrtfbbrwrxyljchywmzy';
const VALID_KEY_PREFIXES = ['sb_secret_', 'eyJ'];

function fail(message, details = {}) {
  const payload = {
    status: 'fail',
    message,
    details,
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

function getEnvValue(keys) {
  for (const key of keys) {
    if (process.env[key]?.trim()) {
      return { key, value: process.env[key].trim() };
    }
  }
  return { key: null, value: null };
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    fail(`missing required env var: ${name}`);
  }
  return value.trim();
}

function assertServiceRoleKeyFormat(rawKey, keySourceName) {
  if (!rawKey || typeof rawKey !== 'string') {
    fail('missing service role key env var', {
      required: OPTIONAL_KEY_ENV.join(' or '),
      source: keySourceName,
    });
  }

  const trimmed = rawKey.trim();
  const hasKnownPrefix = VALID_KEY_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!hasKnownPrefix || trimmed.length < 24) {
    fail('invalid service role key format', {
      source: keySourceName,
      receivedPrefix: trimmed.slice(0, 12),
      allowedPrefixes: VALID_KEY_PREFIXES.join(', '),
    });
  }
}

function assertUrlMatchesExpectedProject(projectRefFromEnv, rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    fail('invalid Supabase URL', { error: error.message });
  }

  const host = parsed.host || '';
  const projectInHost = host.includes(projectRefFromEnv) || host.includes(EXPECTED_PROJECT_REF);
  if (!projectInHost) {
    fail('Supabase URL host does not include expected project ref', {
      expectedProjectRef: EXPECTED_PROJECT_REF,
      projectRefFromEnv,
      host,
    });
  }

  if (!host.includes('supabase.co')) {
    fail('Supabase URL does not use expected supabase.co host', { host });
  }
}

function assertSupabaseIdentity({ environment, projectRef, supabaseUrl }) {
  if (environment !== 'dev') {
    fail('validation env mismatch', {
      requiredEnvironment: 'dev',
      received: environment,
    });
  }

  if (projectRef !== EXPECTED_PROJECT_REF) {
    fail('project ref mismatch', {
      expected: EXPECTED_PROJECT_REF,
      received: projectRef,
    });
  }

  assertUrlMatchesExpectedProject(projectRef, supabaseUrl);
}

function assertGuard() {
  const guard = getRequiredEnv(REQUIRED_ENV.guard);
  if (guard !== 'dev') {
    fail('validation guard missing or invalid', {
      required: `${REQUIRED_ENV.guard}=dev`,
      received: guard,
    });
  }

  const environment = getRequiredEnv(REQUIRED_ENV.environment);
  const projectRef = getRequiredEnv(REQUIRED_ENV.projectRef);

  const { key: urlKey, value: supabaseUrl } = getEnvValue(OPTIONAL_URL_ENV);
  if (!supabaseUrl) {
    fail('missing Supabase URL env var', {
      required: OPTIONAL_URL_ENV.join(' or '),
    });
  }

  const { key: keyName, value: supabaseServiceRoleKey } = getEnvValue(OPTIONAL_KEY_ENV);
  if (!supabaseServiceRoleKey) {
    fail('missing service role key env var', {
      required: OPTIONAL_KEY_ENV.join(' or '),
    });
  }
  assertServiceRoleKeyFormat(supabaseServiceRoleKey, keyName);

  assertSupabaseIdentity({
    environment,
    projectRef,
    supabaseUrl,
  });

  return {
    environment,
    projectRef,
    supabaseUrl,
    supabaseServiceRoleKey,
    urlSource: urlKey,
    keySource: keyName,
  };
}

function ensureSingle(result, context) {
  if (result.error) {
    fail(`failed ${context}`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
    });
  }
  return result.data;
}

async function run() {
  const { projectRef, supabaseUrl, supabaseServiceRoleKey, urlSource, keySource } = assertGuard();

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const runId = `wss-direct-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const expectedTenant = {
    agency: {
      name: `wss-direct-agency-${runId}`,
      slug: `wss-direct-agency-${runId}`,
    },
    client: {
      name: `wss-direct-client-${runId}`,
      slug: `wss-direct-client-${runId}`,
    },
    site: {
      name: `wss-direct-site-${runId}`,
      url: `https://example.test/${runId}`,
      slug: `wss-direct-site-${runId}`,
    },
  };

  const ticket = {
    id: `ticket-${runId}`,
    ticket_number: `TKT-${runId.toUpperCase().slice(0, 16)}`,
    title: `Direct validation ticket ${runId}`,
    description: 'Local contract-safe direct Supabase validation',
    status: 'received',
    priority: 'normal',
    identity_confidence: 'known',
    submitter_name: 'WSS Validation Runner',
    submitter_email: `wss-direct-${runId}@example.test`,
  };

  let ids = {};

  try {
    const agencyRow = ensureSingle(
      await supabase
        .from('agencies')
        .insert({
          name: expectedTenant.agency.name,
          slug: expectedTenant.agency.slug,
        })
        .select('id')
        .single(),
      'inserting test agency',
    );
    ids.agencyId = agencyRow.id;

    const clientRow = ensureSingle(
      await supabase
        .from('clients')
        .insert({
          agency_id: ids.agencyId,
          name: expectedTenant.client.name,
          slug: expectedTenant.client.slug,
        })
        .select('id')
        .single(),
      'inserting test client',
    );
    ids.clientId = clientRow.id;

    const siteRow = ensureSingle(
      await supabase
        .from('sites')
        .insert({
          agency_id: ids.agencyId,
          client_id: ids.clientId,
          name: expectedTenant.site.name,
          url: expectedTenant.site.url,
          slug: expectedTenant.site.slug,
        })
        .select('id')
        .single(),
      'inserting test site',
    );
    ids.siteId = siteRow.id;

    const createdTicket = ensureSingle(
      await supabase
        .from('tickets')
        .insert({
          ...ticket,
          id: ticket.id,
          agency_id: ids.agencyId,
          client_id: ids.clientId,
          site_id: ids.siteId,
        })
        .select('*')
        .single(),
      'inserting test ticket',
    );

    const expectedAudit = {
      actor_id: 'system-direct-validator',
      actor_role: 'system',
      event_type: 'ticket_created',
      summary: 'Direct validation bootstrap',
      metadata: {
        runId,
        source: 'validate-supabase-direct',
      },
    };

    const createdAudit = ensureSingle(
      await supabase
        .from('ticket_audit_events')
        .insert({
          ...expectedAudit,
          agency_id: ids.agencyId,
          client_id: ids.clientId,
          site_id: ids.siteId,
          ticket_id: createdTicket.id,
        })
        .select('*')
        .single(),
      'inserting test audit event',
    );

    const readTicket = ensureSingle(
      await supabase
        .from('tickets')
        .select('*')
        .eq('id', createdTicket.id)
        .single(),
      'reading ticket back',
    );

    const readAudit = ensureSingle(
      await supabase
        .from('ticket_audit_events')
        .select('*')
        .eq('ticket_id', createdTicket.id)
        .eq('event_type', 'ticket_created')
        .single(),
      'reading audit event back',
    );

    if (readTicket.agency_id !== ids.agencyId || readTicket.client_id !== ids.clientId || readTicket.site_id !== ids.siteId) {
      fail('tenant relationship mismatch on readback', {
        expected: ids,
        ticket: {
          agency_id: readTicket.agency_id,
          client_id: readTicket.client_id,
          site_id: readTicket.site_id,
        },
      });
    }

    if (readAudit.ticket_id !== readTicket.id) {
      fail('audit event not linked to ticket', {
        ticketId: readTicket.id,
        audit: readAudit,
      });
    }

    await supabase.from('ticket_audit_events').delete().eq('id', createdAudit.id);
    await supabase.from('tickets').delete().eq('id', createdTicket.id);
    await supabase.from('sites').delete().eq('id', ids.siteId);
    await supabase.from('clients').delete().eq('id', ids.clientId);
    await supabase.from('agencies').delete().eq('id', ids.agencyId);

    const postCheck = await supabase.from('ticket_audit_events').select('id', { count: 'exact', head: true }).eq('id', createdAudit.id);
    if (postCheck.error || postCheck.count !== 0) {
      fail('cleanup verification failed for audit event', {
        error: postCheck.error?.message,
        count: postCheck.count,
      });
    }

    const ticketPost = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('id', createdTicket.id);
    if (ticketPost.error || ticketPost.count !== 0) {
      fail('cleanup verification failed for ticket', {
        error: ticketPost.error?.message,
        count: ticketPost.count,
      });
    }

    const sitePost = await supabase.from('sites').select('id', { count: 'exact', head: true }).eq('id', ids.siteId);
    if (sitePost.error || sitePost.count !== 0) {
      fail('cleanup verification failed for site', {
        error: sitePost.error?.message,
        count: sitePost.count,
      });
    }

    console.log(
      JSON.stringify(
        {
          status: 'pass',
          runId,
          checks: [
            { name: 'tenant rows inserted', passed: true },
            { name: 'ticket roundtrip', passed: true },
            { name: 'audit event roundtrip', passed: true },
            { name: 'tenant relationship check', passed: true },
            { name: 'cleanup verified', passed: true },
          ],
          metadata: {
            projectRef,
            urlSource,
            keySource,
            ids,
          },
        },
        null,
        2,
      ),
    );

  } catch (error) {
    if (ids.agencyId) {
      await supabase.from('ticket_audit_events').delete().eq('ticket_id', ticket.id);
      await supabase.from('tickets').delete().eq('id', ticket.id);
      if (ids.siteId) {
        await supabase.from('sites').delete().eq('id', ids.siteId);
      }
      if (ids.clientId) {
        await supabase.from('clients').delete().eq('id', ids.clientId);
      }
      if (ids.agencyId) {
        await supabase.from('agencies').delete().eq('id', ids.agencyId);
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    fail('validation script runtime error', { message, details: String(error) });
  }
}

await run();
