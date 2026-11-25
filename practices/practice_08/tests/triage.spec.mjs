import { expect, test } from '@playwright/test';

const api = '**/api/classify';
const success = { classification: { type: 'bug', confidence: 0.95 } };
const empty = { classification: null };
const error = { error: 'classification_unavailable' };
const issue = { title: 'Падает экспорт CSV', body: 'Пустой отчёт должен выгружаться с заголовком.' };
const title = page => page.getByRole('textbox', { name: 'Заголовок' });
const body = page => page.getByRole('textbox', { name: 'Описание' });
const submit = page => page.getByRole('button', { name: 'Классифицировать', exact: true });
const status = page => page.getByRole('status');

async function fillIssue(page) {
  await title(page).fill(issue.title);
  await body(page).fill(issue.body);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('начальный экран, пример и счётчик описания', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Классификация обращений' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Обращение' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Результат' })).toBeVisible();
  await expect(status(page)).toContainText('Результат появится здесь');
  await expect(title(page)).toBeEmpty();
  await expect(body(page)).toBeEmpty();
  await page.getByRole('button', { name: 'Заполнить пример' }).click();
  await expect(title(page)).toBeFocused();
  await expect(title(page)).toHaveValue('Экспорт CSV завершается ошибкой');
  await expect(body(page)).toHaveValue(/возвращает 500/);
  await body(page).fill('Новый текст');
  await expect(page.getByText('11 / 2000')).toBeVisible();
});

test('пустой и некорректный ввод не отправляется', async ({ page }) => {
  let calls = 0;
  await page.route(api, async route => {
    calls++;
    await route.fulfill({ json: success });
  });
  await submit(page).click();
  await expect(page.getByText('Введите заголовок.')).toBeVisible();
  await expect(title(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(title(page)).toBeFocused();
  await title(page).fill('    ');
  await title(page).press('Enter');
  await expect(page.getByText('Введите заголовок.')).toBeVisible();
  await title(page).fill('abc');
  await submit(page).click();
  await expect(page.getByText('Введите от 5 до 120 символов.')).toBeVisible();
  await title(page).fill('a'.repeat(121));
  await submit(page).click();
  await expect(page.getByText('Введите от 5 до 120 символов.')).toBeVisible();
  await title(page).fill(issue.title);
  await body(page).fill('а'.repeat(2001));
  await submit(page).click();
  await expect(page.getByText('Сократите описание до 2000 символов.')).toBeVisible();
  await expect(body(page)).toBeFocused();
  await expect(page.getByText('Введите от 5 до 120 символов.')).toHaveCount(0);
  expect(calls).toBe(0);
});

test('от ввода до категории и уверенности через HTTP', async ({ page }) => {
  await page.route(api, async route => route.fulfill({ json: success }));
  await title(page).fill(`  ${issue.title}  `);
  await body(page).fill(issue.body);
  const requestPromise = page.waitForRequest('**/api/classify');
  await submit(page).click();
  const request = await requestPromise;
  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toEqual(issue);
  await expect(status(page).getByRole('heading', { name: 'Ошибка', exact: true })).toBeVisible();
  await expect(status(page).getByText('bug', { exact: true })).toBeVisible();
  await expect(status(page).getByText('95%')).toBeVisible();
  await expect(status(page).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '95');
  await expect(submit(page)).toBeEnabled();
  await body(page).fill('Уточнение');
  await expect(status(page)).toContainText('Результат появится здесь');
});

test('загрузка блокирует повторные отправки', async ({ page }) => {
  let calls = 0;
  let finishResponse;
  const hold = new Promise(resolve => { finishResponse = resolve; });
  await page.route(api, async route => {
    calls++;
    await hold;
    await route.fulfill({ json: success });
  });
  try {
    await fillIssue(page);
    await submit(page).dblclick();
    await expect(status(page)).toContainText('Анализируем обращение');
    const waiting = page.getByRole('button', { name: 'Классифицируем…' });
    await expect(waiting).toBeDisabled();
    await expect(title(page)).toHaveAttribute('readonly', '');
    await title(page).press('Enter');
    await title(page).press('Enter');
    await page.locator('form').evaluate(form => form.requestSubmit());
    await expect.poll(() => calls).toBe(1);
  } finally {
    finishResponse();
  }
  await expect(status(page)).toContainText('95%');
  await expect(submit(page)).toBeEnabled();
  expect(calls).toBe(1);
});

test('пустой результат ведёт на ручной разбор', async ({ page }) => {
  await page.route(api, route => route.fulfill({ json: empty }));
  await title(page).fill('Иногда всё странно');
  await title(page).press('Enter');
  await expect(status(page).getByRole('heading', { name: 'Нужен ручной разбор' })).toBeVisible();
  await expect(status(page)).toContainText('Классификатор не нашёл уверенную категорию.');
  await expect(status(page).getByRole('progressbar')).toHaveCount(0);
  await expect(submit(page)).toBeEnabled();
});

test('сбой API показывает ошибку и допускает повтор без потери данных', async ({ page }) => {
  const requests = [];
  await page.route(api, route => {
    requests.push(route.request().postDataJSON());
    return requests.length === 1 ? route.fulfill({ status: 502, json: error }) : route.fulfill({ json: success });
  });
  await fillIssue(page);
  await submit(page).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Не удалось получить результат');
  await expect(alert).toContainText('Введённые данные сохранены.');
  await expect(title(page)).toHaveValue(issue.title);
  await expect(body(page)).toHaveValue(issue.body);
  await alert.getByRole('button', { name: 'Повторить' }).click();
  await expect(status(page)).toContainText('95%');
  await expect(alert).toHaveCount(0);
  expect(requests).toEqual([issue, issue]);
});

test('нарушение контракта ответа отображается как ошибка', async ({ page }) => {
  await page.route(api, route => route.fulfill({ json: { classification: { type: 'other', confidence: 2 } } }));
  await fillIssue(page);
  await submit(page).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось получить результат');
});

test('полный клавиатурный сценарий на узком экране с видимым фокусом', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route(api, route => route.fulfill({ json: success }));
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Заполнить пример' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(title(page)).toBeFocused();
  await expect(title(page)).toHaveCSS('outline-style', 'solid');
  await expect(title(page)).toHaveCSS('outline-width', '3px');
  await page.keyboard.insertText(issue.title);
  await page.keyboard.press('Tab');
  await expect(body(page)).toBeFocused();
  await page.keyboard.insertText(issue.body);
  await page.keyboard.press('Tab');
  await expect(submit(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status(page)).toContainText('95%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
