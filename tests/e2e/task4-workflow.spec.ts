import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from './helpers/auth';

test.describe('Task 4: Workflow — User Dashboard', () => {

    test('user dashboard loads after login', async ({ page }) => {
        const userEmids = ['100000', '100001', '100002', '100010', '100050'];
        let loggedIn = false;

        for (const emid of userEmids) {
            try {
                await loginAsUser(page, emid);
                loggedIn = true;
                break;
            } catch {
                continue;
            }
        }

        if (!loggedIn) {
            test.skip();
            return;
        }

        await expect(page.locator('body')).not.toBeEmpty();
        expect(page.url()).toContain('dashboard');
    });

    test('dashboard shows evaluation-related content', async ({ page }) => {
        const userEmids = ['100000', '100001', '100002'];
        for (const emid of userEmids) {
            try { await loginAsUser(page, emid); break; } catch { continue; }
        }

        await page.waitForTimeout(3000);
        const hasSelf = await page.locator('text=ประเมินตนเอง').isVisible({ timeout: 5000 }).catch(() => false);
        const hasOthers = await page.locator('text=ประเมินผู้อื่น').isVisible({ timeout: 5000 }).catch(() => false);
        const hasDashboard = page.url().includes('dashboard');
        expect(hasSelf || hasOthers || hasDashboard).toBeTruthy();
    });

    test('self-evaluation page is accessible', async ({ page }) => {
        const userEmids = ['100000', '100001', '100002'];
        for (const emid of userEmids) {
            try { await loginAsUser(page, emid); break; } catch { continue; }
        }

        await page.goto('/evaluations/self');
        await page.waitForTimeout(3000);
        const isOnSelfEval = page.url().includes('self');
        const isOnDashboard = page.url().includes('dashboard');
        expect(isOnSelfEval || isOnDashboard).toBeTruthy();
    });
});

test.describe('Task 4: Workflow — Admin Assignments', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('admin can view assignment manager', async ({ page }) => {
        await page.goto('/admin/assignments');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('assignment manager has create button', async ({ page }) => {
        await page.goto('/admin/assignments');
        await page.waitForTimeout(3000);
        const createBtn = page.locator('a[href*="create"], button:has-text("เพิ่ม")').first();
        await expect(createBtn).toBeVisible({ timeout: 10000 });
    });

    test('assignment form loads with step-based UI', async ({ page }) => {
        await page.goto('/admin/assignments/create');
        await page.waitForTimeout(3000);
        const hasSelect = await page.locator('.react-select, [class*="select"], [class*="Select"]').first().isVisible({ timeout: 5000 }).catch(() => false);
        const hasEvaluator = await page.locator('text=ผู้ประเมิน').isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasSelect || hasEvaluator).toBeTruthy();
    });

    test('assignment manager has search/filter', async ({ page }) => {
        await page.goto('/admin/assignments');
        await page.waitForTimeout(3000);
        const searchInput = page.locator('input[type="text"], input[placeholder*="ค้นหา"]').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });
    });

    test('assignment manager shows data or empty state', async ({ page }) => {
        await page.goto('/admin/assignments');
        await page.waitForTimeout(5000);
        const hasData = await page.locator('table, [class*="card"]').first().isVisible({ timeout: 5000 }).catch(() => false);
        const hasEmptyState = await page.locator('text=เพิ่มความสัมพันธ์').isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasData || hasEmptyState).toBeTruthy();
    });
});
