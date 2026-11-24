import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const course = process.env.PRACTICE_071_TARGET === 'course';
const filename = course ? 'workflow.course.json' : 'workflow.json';
const workflow = JSON.parse(readFileSync(new URL(`../${filename}`, import.meta.url)));
const nodes = new Map(workflow.nodes.map(node => [node.name, node]));
const models = course
  ? { primary: 'openai/gpt-4.1-mini', other: 'google/gemini-2.5-flash' }
  : { primary: 'qwen3.5:9b', other: 'qwen3.5:4b' };

function execute(name, input, upstream = {}) {
  const items = input.map(json => ({ json }));
  return runInNewContext(`(function () {\n${nodes.get(name).parameters.jsCode}\n})()`, {
    $input: { first: () => items[0], all: () => items },
    $: key => {
      const output = upstream[key].map(json => ({ json }));
      return { first: () => output[0], all: () => output, itemMatching: index => output[index] };
    },
  });
}

const repository = { full_name: 'example/lab' };
const pull = { id: 42, state: 'open', changed_files: 1, head: { sha: 'head' }, base: { sha: 'base' } };
const decision = { model: models.primary, source: 'pull_request.opened', pullUrl: 'https://api.github.com/repos/example/lab/pulls/7' };

function event(name, action, fields) {
  return { headers: { 'x-github-event': name }, body: { action, repository, ...fields } };
}

function command(body, action = 'created', isPr = true) {
  const issue = isPr ? { number: 7, pull_request: {} } : { number: 7 };
  return event('issue_comment', action, { issue, comment: { body } });
}

const routes = [
  ['opening', event('pull_request', 'opened', { number: 7, pull_request: {} }), 'primary'],
  ['primary comment', command(' /make_ai_review\n'), 'primary'],
  ['second model comment', command('/make_other_ai_review'), 'other'],
  ['new commit', event('pull_request', 'synchronize', { number: 7, pull_request: {} }), undefined],
  ['closing', event('pull_request', 'closed', { number: 7, pull_request: {} }), undefined],
  ['edited comment', command('/make_ai_review', 'edited'), undefined],
  ['issue without PR', command('/make_ai_review', 'created', false), undefined],
  ['longer command', command('/make_ai_review later'), undefined],
];

for (const [label, input, mode] of routes) {
  test(`event routing: ${label}`, () => {
    const outputs = execute('Route GitHub event', [input]);
    assert.equal(outputs[0]?.json.mode, mode);
    if (mode) {
      assert.equal(outputs[0].json.prNumber, 7);
      assert.equal(outputs[0].json.model, models[mode]);
    }
  });
}

const decisions = [
  ['new PR', 'primary', {}, 'open', true, 'review_requested'],
  ['already reviewed', 'primary', { pr_id: '42', review_id: '257' }, 'open', false, 'already_reviewed'],
  ['second model after first', 'other', { pr_id: '42' }, 'open', true, 'review_requested'],
  ['closed PR', 'other', {}, 'closed', false, 'pr_closed'],
];

for (const [label, mode, row, state, run, status] of decisions) {
  test(`review decision: ${label}`, () => {
    const [result] = execute('Decide whether to review', [row], {
      'Route GitHub event': [{ mode }],
      'Get pull request': [{ ...pull, state }],
    });
    assert.equal(result.json.prId, '42');
    assert.equal(result.json.run, run);
    assert.equal(result.json.status, status);
  });
}

const file = {
  filename: 'test.py',
  additions: 3,
  deletions: 2,
  patch: [
    '@@ -5,4 +7,3 @@',
    '-before',
    '+after',
    ' context',
    '-removed',
    ' following',
    '@@ -17,0 +19,2 @@',
    '+++code',
    '+',
    '\\ No newline at end of file',
  ].join('\r\n'),
};
const upstream = { 'Decide whether to review': [decision], 'Get pull request': [pull] };

test('split changes within one hunk and anchor additions and removals', () => {
  const blocks = execute('Build block prompts', [file], upstream);
  assert.deepEqual(Array.from(blocks, ({ json }) => [json.path, json.line, json.side]), [
    ['test.py', 7, 'RIGHT'],
    ['test.py', 7, 'LEFT'],
    ['test.py', 20, 'RIGHT'],
  ]);
  assert.match(blocks[2].json.request.messages[1].content, /\+\+\+code/);
});

test('reject a partial diff', () => {
  assert.throws(() => execute('Build block prompts', [{ ...file, deletions: 3 }], upstream), /incomplete patch/);
  assert.throws(() => execute('Build block prompts', [], upstream), /0 of 1 changed files/);
});

test('skip binary files without textual changes', () => {
  const outputs = execute('Build block prompts', [{ filename: 'image.png', additions: 0, deletions: 0 }], upstream);
  assert.equal(outputs.length, 0);
});

function modelResponse(finish) {
  const message = { content: '{"comment":"Review"}' };
  if (course) {
    return { model: decision.model, choices: [{ finish_reason: finish, message }] };
  }
  return { model: decision.model, done: true, done_reason: finish, message };
}
const reviewInput = { ...upstream, 'Build block prompts': [{ path: 'test.py', line: 7, side: 'LEFT' }] };

test('create a review only from complete model responses and preserve trusted anchors', () => {
  const [output] = execute('Assemble GitHub review', [modelResponse('stop')], reviewInput);
  assert.equal(output.json.request.commit_id, pull.head.sha);
  assert.equal(output.json.request.event, 'COMMENT');
  assert.deepEqual(JSON.parse(JSON.stringify(output.json.request.comments)), [
    { path: 'test.py', line: 7, side: 'LEFT', body: 'Review' },
  ]);
  assert.throws(() => execute('Assemble GitHub review', [modelResponse('length')], reviewInput), /Incomplete/);
  assert.throws(() => execute('Assemble GitHub review', [{ ...modelResponse('stop'), model: models.other }], reviewInput), /unexpected model response/);
  assert.throws(() => execute('Assemble GitHub review', [], reviewInput), /no model response/);
});

test('stop publication if the head, base, or open state changed', () => {
  const previous = { ...upstream, 'Assemble GitHub review': [{ request: { commit_id: 'head' } }] };
  const [same] = execute('Check pull request SHA', [pull], previous);
  assert.equal(same.json.request.commit_id, 'head');
  for (const changed of [{ state: 'closed' }, { head: { sha: 'new' } }, { base: { sha: 'new' } }]) {
    assert.throws(() => execute('Check pull request SHA', [{ ...pull, ...changed }], previous), /changed during review/);
  }
});

test('workflow reads and saves the same table and skips before invoking the model', () => {
  const links = workflow.connections;
  assert.equal(links['Run review?'].main[1][0].node, 'Skip review');
  assert.equal(links['Skip review'], undefined);
  assert.equal(links['Publish inline review'].main[0][0].node, 'Save reviewed PR');
  assert.equal(nodes.get('Find reviewed PR').parameters.dataTableId.value,
    nodes.get('Save reviewed PR').parameters.dataTableId.value);
});

if (course) {
  test('course workflow uses the VseLLM OpenAI credential for the model gateway', () => {
    const node = nodes.get('Review blocks with VseLLM');
    assert.equal(node.parameters.url, 'https://litellm.data-light.ru/chat/completions');
    assert.equal(node.parameters.authentication, 'predefinedCredentialType');
    assert.equal(node.parameters.nodeCredentialType, 'openAiApi');
    assert.equal(node.credentials, undefined);
    assert.equal(workflow.connections['Build block prompts'].main[0][0].node, node.name);
    assert.equal(workflow.connections[node.name].main[0][0].node, 'Assemble GitHub review');
  });
}
