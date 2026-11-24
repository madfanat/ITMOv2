import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const load = name => JSON.parse(readFileSync(new URL(`../workflow-${name}.json`, import.meta.url)));
const classifier = load('classifier');
const issues = load('issues');
const report = load('weekly-report');
const bugfix = load('bugfix');

const node = (workflow, name) => {
  const result = workflow.nodes.find(candidate => candidate.name === name);
  assert.ok(result, `Missing node ${name}`);
  return result;
};

const execute = (workflow, name, input, previous = {}) => {
  const values = list => list.map(json => ({ json }));
  const access = list => ({
    first: () => values(list)[0],
    all: () => values(list),
  });
  const script = new Function('$input', '$', node(workflow, name).parameters.jsCode);
  return script(access(input), key => access(previous[key] ?? []));
};

const githubIssue = (overrides = {}) => ({
  headers: { 'x-github-event': 'issues', 'x-github-delivery': 'delivery-example' },
  body: {
    action: 'opened',
    repository: { full_name: 'madfanat/ITMOv2' },
    issue: { id: 10, number: 3, title: 'Issue title', body: null, user: { login: 'alice' }, author_association: 'NONE' },
    ...overrides,
  },
});

test('workflow exports contain valid connections and JavaScript', () => {
  for (const workflow of [classifier, issues, report, bugfix]) {
    assert.equal(new Set(workflow.nodes.map(entry => entry.id)).size, workflow.nodes.length);
    assert.equal(new Set(workflow.nodes.map(entry => entry.name)).size, workflow.nodes.length);
    for (const [name, outputs] of Object.entries(workflow.connections)) {
      node(workflow, name);
      for (const ports of Object.values(outputs)) {
        for (const port of ports) for (const connection of port) node(workflow, connection.node);
      }
    }
    for (const entry of workflow.nodes) {
      if (entry.parameters.jsCode) assert.doesNotThrow(() => new Function(entry.parameters.jsCode));
      assert.equal(entry.credentials, undefined);
    }
  }
});

test('webhook filters non-opening events and other repositories', () => {
  const filter = event => execute(issues, 'Filter opened Issues', [event]);
  assert.deepEqual(filter(githubIssue({ action: 'reopened' })), []);
  assert.deepEqual(filter(githubIssue({ repository: { full_name: 'other/project' } })), []);
  assert.deepEqual(filter({ ...githubIssue(), headers: { 'x-github-event': 'pull_request' } }), []);
  const [item] = filter(githubIssue());
  assert.equal(item.json.body, '');
  assert.equal(item.json.issueId, '10');
  assert.equal(item.json.delivery, 'delivery-example');
});

test('Execute Sub-workflow uses title and body and the parser enforces the contract', () => {
  const call = node(issues, 'Execute classifier').parameters;
  assert.deepEqual(Object.keys(call.workflowInputs.value), ['title', 'body']);
  assert.equal(call.options.waitForSubWorkflow, true);
  const parse = result => execute(classifier, 'Return type and confidence', [result])[0].json;
  assert.deepEqual(parse({ output: { type: 'bug', confidence: 0.8 } }), { type: 'bug', confidence: 0.8 });
  assert.deepEqual(parse({ output: { type: 'bad', confidence: 1 } }), { type: 'unknown', confidence: 0 });
  assert.deepEqual(parse({ output: { type: 'bug', confidence: '1' } }), { type: 'unknown', confidence: 0 });
});

test('Switch accepts precisely the confidence boundary and unknown cannot post replies', () => {
  const source = execute(issues, 'Filter opened Issues', [githubIssue()])[0].json;
  const route = (type, confidence) => execute(issues, 'Apply confidence threshold', [{ type, confidence }], { 'Filter opened Issues': [source] })[0].json;
  for (const type of ['bug', 'task', 'feature']) {
    const chosen = route(type, 0.8);
    assert.equal(chosen.route, type);
    const prepared = execute(issues, `Prepare ${type}`, [chosen])[0].json;
    assert.deepEqual(prepared.labels, [type, 'first-time-contributor']);
    assert.ok(prepared.reply.includes('Добро пожаловать'));
  }
  assert.equal(route('bug', 0.799).route, 'unknown');
  assert.equal(route('unknown', 0.99).route, 'unknown');
  const unknown = execute(issues, 'Prepare needs-triage', [route('bug', 0.5)])[0].json;
  assert.deepEqual(unknown.labels, ['needs-triage']);
  assert.equal(unknown.reply, '');
  assert.equal(issues.connections['Reply allowed?'].main[1][0].node, 'Save processed Issue');
  assert.equal(issues.connections['Already processed?'].main[0][0].node, 'Skip duplicate');
});

const window = { repository: 'madfanat/ITMOv2', start: '2026-11-16T00:00:00Z', end: '2026-11-23T00:00:00Z', weekKey: 'madfanat/ITMOv2|manual|2026-11-23' };
const start = window.start;
const end = window.end;
const issue = (id, user, labels = [], created_at = start) => ({
  id, user: { login: user }, created_at, labels: labels.map(name => ({ name })),
});
const page = (items, total_count = items.length) => ({ items, total_count, incomplete_results: false });
const inputs = {
  'Set report window': [window],
  'Opened Issues': [
    page([issue(1, 'alice', ['bug']), issue(2, 'constructor', ['feature'])], 5),
    page([issue(3, 'alice', ['needs-triage', 'task']), issue(4, '<tag>', ['bug', 'task']), issue(5, 'outside', ['bug'], end)], 5),
  ],
  'Closed Issues': [page([{ id: 1, closed_at: start }])],
  'Merged pull requests': [page([{ id: 6, pull_request: { merged_at: start } }])],
};
const group = overrides => execute(report, 'Group by type and author', [
  { id: 1, created_at: start, html_url: 'https://github.com/a/b/issues/1#issuecomment-1' },
  { id: 2, created_at: start, html_url: 'https://github.com/a/b/pull/2#issuecomment-2' },
  { id: 3, created_at: end, html_url: 'https://github.com/a/b/issues/1#issuecomment-3' },
], { ...inputs, ...overrides })[0].json;

test('weekly report filters half-open dates, aggregates all pages and rejects partial results', () => {
  const data = group();
  assert.deepEqual(data.stats.activity, { opened: 4, closed: 1, comments: 1, merged: 1 });
  assert.deepEqual(data.stats.byType, { bug: 1, task: 0, feature: 1, 'needs-triage': 1, unclassified: 1 });
  assert.equal(data.stats.byAuthor.alice.total, 2);
  assert.equal(data.stats.byAuthor.constructor.byType.feature, 1);
  assert.throws(() => group({ 'Opened Issues': [page([], 1001)] }), /result count/);
  assert.equal(node(report, 'Monday at 09:00').parameters.rule.interval[0].expression, '0 9 * * MON');
});

test('Δ includes missing authors and HTML escapes authors and model output', () => {
  const current = group();
  const previous = {
    activity: { opened: 5, closed: 2, comments: 0, merged: 0 },
    byType: { bug: 5 },
    byAuthor: { alice: { total: 2 }, removed: { total: 3 } },
  };
  const compare = (row, snapshot = current) => execute(report, 'Calculate weekly difference', [row], { 'Group by type and author': [snapshot] })[0].json;
  assert.equal(compare({}).delta, null);
  const soleLeader = { ...current, stats: { ...current.stats, byType: { bug: 2, task: 1 } } };
  assert.deepEqual(compare({}, soleLeader).mostFrequentTypes, ['bug']);
  const comparison = compare({ stats_json: JSON.stringify(previous), source: 'fixture' });
  assert.equal(comparison.delta.activity.opened, -1);
  assert.deepEqual(comparison.mostFrequentTypes, ['bug', 'feature', 'needs-triage', 'unclassified']);
  assert.equal(comparison.delta.byAuthor.removed, -3);
  const email = execute(report, 'Render HTML report', [{ text: 'Проверка <script>' }], { 'Calculate weekly difference': [comparison] })[0].json;
  assert.match(email.html, /AI-комментарий недели/);
  assert.equal(Object.hasOwn(email, 'to'), false);
  assert.match(email.html, /тестовая запись/);
  assert.match(email.html, /&lt;tag&gt;/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /<table/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.equal(node(report, 'Send HTML via Gmail').parameters.emailType, 'html');
});

test('sandbox repair checks the patch shape and rejects unrelated code', () => {
  const input = {
    current: 'export function sum(values) {\n  return values.reduce((total, value) => total + value);\n}\n',
    issue: { number: 16 },
  };
  const validate = replacement => execute(bugfix, 'Validate patch and regressions', [
    { output: { replacement } },
  ], { 'Build repair prompt': [input] })[0].json;
  const valid = validate('return values.reduce((acc, n) => acc + n, 0);');
  assert.equal(valid.branch, 'itmo-072-fix-issue-16');
  assert.equal(valid.results.length, 4);
  assert.ok(valid.results.every(row => row.expected === row.actual));
  assert.throws(() => validate('return values.reduce((acc, n) => acc - n, 0);'), /does not match/);
  assert.throws(() => validate('return values.reduce((acc, n) => acc + n);'), /does not match/);
});

test('sandbox merge requires a positive review without blocking findings and unchanged base', () => {
  const review = { approved: true, blocking: ['A regression was found'], summary: 'Needs changes' };
  const pr = { pr: 1, head: 'head', base: 'base' };
  const decision = execute(bugfix, 'Decide merge eligibility', [{ output: review }], {
    'Check PR scope and head': [pr],
  })[0].json;
  assert.equal(decision.approved, false);
  assert.throws(() => execute(bugfix, 'Require reviewed base and head', [{ object: { sha: 'other' } }], {
    'Decide merge eligibility': [decision],
  }), /main changed/);
  assert.equal(bugfix.connections['Review approved?'].main[1][0].node, 'Leave PR for manual review');
});
