import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Badge, Button, Group, Loader, Paper, Progress, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { CircleAlert, ClipboardList, FileText, ListFilter, RotateCw, ScanLine, Sparkles } from 'lucide-react';
import { limits, parseResult, threshold, validateIssue } from './contract';
import type { Category, FormErrors, Issue, Result } from './contract';

type State = { kind: 'idle' | 'pending' | 'error' } | { kind: 'done'; result: Result };

const example = {
  title: 'Экспорт CSV завершается ошибкой',
  body: 'При экспорте пустого отчёта сервис возвращает 500. Ожидаю CSV с заголовками колонок.',
};
const labels: Record<Category, string> = { bug: 'Ошибка', task: 'Задача', feature: 'Новая возможность' };

function StatusPanel({ state, retry }: { state: State; retry: () => void }) {
  if (state.kind === 'error') {
    return (
      <Alert color="red.9" title="Не удалось получить результат" icon={<CircleAlert size={20} />} role="alert" className="request-error">
        Проверьте соединение и повторите попытку. Введённые данные сохранены.
        <Button type="button" variant="outline" color="red.9" size="sm" leftSection={<RotateCw size={15} />} onClick={retry}>
          Повторить
        </Button>
      </Alert>
    );
  }

  if (state.kind === 'done' && state.result.classification) {
    const { type, confidence } = state.result.classification;
    const percent = Math.round(confidence * 100);
    return (
      <div className="status-box status-success">
        <Group justify="space-between" gap="xs" wrap="wrap">
          <Text component="h3" fw={750} size="xl">{labels[type]}</Text>
          <Badge variant="light" size="lg" className="category" tt="none">{type}</Badge>
        </Group>
        <Group justify="space-between" mt="lg" gap="xs">
          <Text size="sm" c="var(--ink-muted)">Уверенность</Text>
          <Text fw={750}>{percent}%</Text>
        </Group>
        <Progress value={percent} mt="xs" aria-label="Уверенность классификатора" />
      </div>
    );
  }

  const content = {
    idle: { icon: <ScanLine size={22} />, title: 'Результат появится здесь', description: 'Заполните форму и запустите классификацию.' },
    pending: { icon: <Loader size={21} />, title: 'Анализируем обращение', description: 'Классификатор n8n обрабатывает запрос.' },
    done: { icon: <ListFilter size={22} />, title: 'Нужен ручной разбор', description: 'Классификатор не нашёл уверенную категорию. Уточните описание или передайте обращение на ручной разбор.' },
  }[state.kind];

  return (
    <div className={`status-box status-${state.kind}`}>
      <span className="status-icon" aria-hidden="true">{content.icon}</span>
      <Text component="h3" mt="sm" fw={750} size="lg">{content.title}</Text>
      <Text size="sm" c="var(--ink-muted)" mt={4}>{content.description}</Text>
    </div>
  );
}

export function App() {
  const [issue, setIssue] = useState<Issue>({ title: '', body: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, setState] = useState<State>({ kind: 'idle' });
  const inFlight = useRef(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const pending = state.kind === 'pending';

  function edit(field: keyof Issue, value: string) {
    setIssue(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setState({ kind: 'idle' });
  }

  function fillExample() {
    if (inFlight.current) return;
    setIssue(example);
    setErrors({});
    setState({ kind: 'idle' });
    titleInput.current?.focus();
  }

  async function classify(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (inFlight.current) return;
    const nextErrors = validateIssue(issue);
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.body) {
      (nextErrors.title ? titleInput : bodyInput).current?.focus();
      return;
    }

    if (state.kind === 'error') titleInput.current?.focus();
    inFlight.current = true;
    setState({ kind: 'pending' });
    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: issue.title.trim(), body: issue.body.trim() }),
        signal: AbortSignal.timeout(38_000),
      });
      if (!response.ok) throw new Error(`Classification returned HTTP ${response.status}`);
      setState({ kind: 'done', result: parseResult(await response.json()) });
    } catch {
      setState({ kind: 'error' });
    } finally {
      inFlight.current = false;
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) submitButton.current?.focus();
      });
    }
  }

  return (
    <>
      <header className="masthead">
        <div className="shell topbar">
          <Group gap="sm" wrap="nowrap">
            <span className="brand-mark" aria-hidden="true"><ListFilter size={21} strokeWidth={2.4} /></span>
            <Text fw={800} className="brand-name">Триаж</Text>
          </Group>
          <Text size="sm" className="masthead-label">GitHub Issues</Text>
        </div>
      </header>
      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="shell hero-inner">
            <Title id="page-title" order={1}>Классификация<br className="hero-break" /> обращений</Title>
            <Text>Введите заголовок и описание GitHub Issue. Классификатор предложит категорию и покажет уверенность.</Text>
          </div>
        </section>
        <div className="shell workspace">
          <Paper component="section" aria-labelledby="issue-heading" className="card" withBorder>
            <Group className="card-heading" gap="xs" justify="space-between">
              <Group gap="xs" wrap="nowrap">
                <FileText size={20} className="section-icon" aria-hidden="true" />
                <Title order={2} id="issue-heading">Обращение</Title>
              </Group>
              <Button variant="light" type="button" size="sm" className="example-button" onClick={fillExample} disabled={pending}>
                Заполнить пример
              </Button>
            </Group>
            <form onSubmit={classify} noValidate>
              <Stack gap="md">
                <TextInput ref={titleInput} label="Заголовок" required placeholder="Например, ошибка при экспорте CSV" value={issue.title}
                  onChange={event => edit('title', event.currentTarget.value)} readOnly={pending} error={errors.title} />
                <Textarea ref={bodyInput} label="Описание" placeholder="Что произошло и какой результат ожидался?" rows={4} value={issue.body}
                  onChange={event => edit('body', event.currentTarget.value)} readOnly={pending} error={errors.body} />
                <div className="description-meta">
                  <Text size="sm" c="var(--ink-muted)">Необязательное поле</Text>
                  <Text size="sm" c="var(--ink-muted)" className="counter">{issue.body.length} / {limits.maxBody}</Text>
                </div>
                <Group className="form-actions">
                  <Button ref={submitButton} type="submit" leftSection={pending ? <Loader color="currentColor" size={17} /> : <Sparkles size={17} />}
                    disabled={pending}>
                    {pending ? 'Классифицируем…' : 'Классифицировать'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
          <Paper component="section" aria-labelledby="result-heading" className="card" withBorder>
            <Group className="card-heading" gap="xs">
              <ClipboardList size={20} className="section-icon" aria-hidden="true" />
              <Title order={2} id="result-heading">Результат</Title>
            </Group>
            <div className="live-result" role="status" aria-live="polite" aria-atomic="true">
              {state.kind !== 'error' && <StatusPanel state={state} retry={classify} />}
            </div>
            {state.kind === 'error' && <StatusPanel state={state} retry={classify} />}
            <div className="triage-rule">
              <Text size="sm" fw={700}>Когда нужен ручной разбор</Text>
              <Text size="sm" c="var(--ink-muted)" mt={4}>
                Если уверенность ниже {threshold * 100}% или категория не определена, передайте обращение на ручной разбор.
              </Text>
            </div>
          </Paper>
        </div>
      </main>
    </>
  );
}
