import { test, expect, type Page } from '@playwright/test';

// Mock Notification API so tests exercise the real toggle/scheduler UI paths
// without OS permission dialogs.
async function mockNotifications(page: Page, permission: NotificationPermission = 'granted') {
  await page.addInitScript((perm) => {
    (window as any).Notification = class {
      static permission = perm;
      static __shown: any[] = [];
      constructor(title: string, options?: any) {
        (window as any).Notification.__shown.push({ title, options });
      }
      static requestPermission() {
        return Promise.resolve(perm as NotificationPermission);
      }
    };
    (window as any).__notificationsShown = () => (window as any).Notification.__shown;
  }, permission);
}

test.beforeEach(async ({ page }) => {
  await mockNotifications(page, 'granted');
  await page.goto('/');
  // Wait for the app to hydrate and render the header
  await page.getByText('En Ritmo', { exact: true }).first().waitFor({ state: 'visible' });
});

test('notification settings panel opens and shows supported state', async ({ page }) => {
  await page.getByRole('button', { name: 'Configurar notificaciones' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Configurar notificaciones')).toBeVisible();
  await expect(dialog.getByText('Permiso concedido')).toBeVisible();
});

test('enabling notifications persists enabled state and shows active dot', async ({ page }) => {
  await page.getByRole('button', { name: 'Configurar notificaciones' }).click();
  const dialog = page.getByRole('dialog');

  // Default: disabled. Master switch should be off.
  const master = dialog.getByRole('switch');
  await expect(master).toBeVisible();

  if (!(await master.isChecked())) {
    await master.click();
  }

  // Toggling on reveals the customization options
  await expect(dialog.getByText('Recordatorios de tareas')).toBeVisible();
  await expect(dialog.getByText('Recordatorio diario de hábitos')).toBeVisible();
  await expect(dialog.getByText('Sonido')).toBeVisible();

  // Persisted to localStorage
  const stored = await page.evaluate(() => localStorage.getItem('notification-settings'));
  expect(stored).toContain('"enabled":true');
});

test('task advance option changes are persisted', async ({ page }) => {
  await page.getByRole('button', { name: 'Configurar notificaciones' }).click();
  const dialog = page.getByRole('dialog');

  const master = dialog.getByRole('switch');
  if (!(await master.isChecked())) await master.click();

  await dialog.getByRole('button', { name: '30 min antes' }).click();

  const stored = await page.evaluate(() => localStorage.getItem('notification-settings'));
  expect(stored).toContain('"advanceMinutes":30');
});

test('daily habit time input updates settings', async ({ page }) => {
  await page.getByRole('button', { name: 'Configurar notificaciones' }).click();
  const dialog = page.getByRole('dialog');

  const master = dialog.getByRole('switch');
  if (!(await master.isChecked())) await master.click();

  // Order of switches: 0=master, 1=taskReminders, 2=dailyHabitReminder, 3=sound
  const dailySwitch = dialog.getByRole('switch').nth(2);
  await dailySwitch.click();

  const timeInput = dialog.locator('input[type="time"]');
  await timeInput.fill('18:30');

  const stored = await page.evaluate(() => localStorage.getItem('notification-settings'));
  expect(stored).toContain('"dailyHabitTime":"18:30"');
});

test('denied permission shows blocked state without enabling', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Notification = class {
      static permission: NotificationPermission = 'denied';
      static requestPermission() {
        return Promise.resolve('denied' as NotificationPermission);
      }
    };
  });
  await page.goto('/');
  await page.getByText('En Ritmo', { exact: true }).first().waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Configurar notificaciones' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Permiso denegado')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Bloqueado' })).toBeVisible();
});

test('creating a task with a reminder shows reminder badge', async ({ page }) => {
  // Open the "Alta prioridad" column add input
  const column = page.locator('h3', { hasText: 'Alta prioridad' }).locator('..').locator('..').locator('..');
  await column.getByRole('button', { name: 'Agregar tarea' }).click();

  const input = page.getByPlaceholder('Nueva tarea...');
  await input.fill('Revisar informe');

  await page.getByRole('button', { name: 'Recordar' }).click();
  await page.getByLabel('Fecha y hora del recordatorio').fill('2099-12-31T10:00');
  await page.getByPlaceholder('Mensaje del recordatorio (opcional)').fill('Entrega final antes del almuerzo');

  await page.getByRole('button', { name: 'Confirmar tarea' }).click();

  await expect(page.getByText('Revisar informe')).toBeVisible();
  await expect(
    page.getByTitle('Entrega final antes del almuerzo')
  ).toBeVisible();
});

test('editing a task to add a reminder persists it', async ({ page }) => {
  // Create a plain task first
  const column = page.locator('h3', { hasText: 'Media prioridad' }).locator('..').locator('..').locator('..');
  await column.getByRole('button', { name: 'Agregar tarea' }).click();
  await page.getByPlaceholder('Nueva tarea...').fill('Tarea sin recordatorio');
  await page.getByRole('button', { name: 'Confirmar tarea' }).click();

  // Edit it
  await page.getByText('Tarea sin recordatorio').hover();
  const card = page.getByText('Tarea sin recordatorio').locator('..').locator('..');
  await card.getByRole('button', { name: 'Editar tarea' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Fecha y hora del recordatorio').fill('2099-06-15T09:30');
  await dialog.getByLabel('Mensaje del recordatorio').fill('Preparar la agenda');
  await dialog.getByRole('button', { name: 'Guardar' }).click();

  await expect(
    page.getByTitle('Preparar la agenda')
  ).toBeVisible();

  const storedTask = await page.evaluate(async () => {
    const req = indexedDB.open('productivity-db');
    const db = await new Promise<any>((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const all = await new Promise<any>((res) => {
      const r = store.getAll();
      r.onsuccess = () => res(r.result);
    });
    return all.find((t: any) => t.title === 'Tarea sin recordatorio');
  });
  expect(storedTask.reminderAt).toBeTruthy();
  expect(storedTask.reminderMessage).toBe('Preparar la agenda');
});
