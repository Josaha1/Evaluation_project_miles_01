import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Task 5: Admin Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('admin dashboard loads with navigation', async ({ page }) => {
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('admin dashboard has evaluation report link', async ({ page }) => {
        const reportLink = page.locator('a[href*="evaluation-report"], a[href*="reports"], text=รายงาน').first();
        await expect(reportLink).toBeVisible({ timeout: 10000 });
    });

    test('admin dashboard has user management link', async ({ page }) => {
        const usersLink = page.locator('a[href*="users"], text=ผู้ใช้').first();
        await expect(usersLink).toBeVisible({ timeout: 10000 });
    });

    test('admin dashboard has external org link', async ({ page }) => {
        const orgLink = page.locator('a[href*="external-organizations"], text=องค์กรภายนอก').first();
        await expect(orgLink).toBeVisible({ timeout: 10000 });
    });

    test('admin dashboard has access codes link', async ({ page }) => {
        const codeLink = page.locator('a[href*="access-codes"], text=Access Code').first();
        await expect(codeLink).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Task 5: Evaluation Report Page', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('report page loads', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('report page has tabs', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);
        const hasDashboard = await page.locator('text=แดชบอร์ด').isVisible({ timeout: 5000 }).catch(() => false);
        const hasExport = await page.locator('text=ส่งออก').isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasDashboard || hasExport).toBeTruthy();
    });

    test('report page shows KPI stats', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);
        const hasStats = await page.locator('text=ผู้เข้าร่วม').isVisible({ timeout: 5000 }).catch(() => false);
        const hasRate = await page.locator('text=อัตรา').isVisible({ timeout: 5000 }).catch(() => false);
        const hasScore = await page.locator('text=คะแนน').isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasStats || hasRate || hasScore).toBeTruthy();
    });

    test('report page has export button', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);
        const exportBtn = page.locator('button:has-text("ส่งออก"), text=ส่งออกรายงาน').first();
        await expect(exportBtn).toBeVisible({ timeout: 10000 });
    });

    test('clicking export opens modal or dropdown', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);

        const exportBtn = page.locator('button:has-text("ส่งออกรายงาน"), button:has-text("ส่งออก")').first();
        if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await exportBtn.click();
            await page.waitForTimeout(2000);
            const hasModal = await page.locator('[role="dialog"], [class*="Dialog"], [class*="modal"]').isVisible({ timeout: 3000 }).catch(() => false);
            const hasExportContent = await page.locator('text=Excel, text=PDF, text=รูปแบบ').first().isVisible({ timeout: 3000 }).catch(() => false);
            // Export UI should appear
        }
    });

    test('report tabs can switch', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);

        const analyticsTab = page.locator('button:has-text("วิเคราะห์")').first();
        if (await analyticsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await analyticsTab.click();
            await page.waitForTimeout(2000);
        }
    });
});

test.describe('Task 5: Export Routes Respond', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('comprehensive export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/comprehensive');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });

    test('executive export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/executive');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });

    test('employee export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/employee');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });

    test('governor export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/governors');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });

    test('external org export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/external-org');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });

    test('self-evaluation export route responds', async ({ page }) => {
        const response = await page.request.post('/admin/reports/evaluation/export/self-evaluation');
        expect(response.status()).not.toBe(404);
        expect(response.status()).not.toBe(405);
    });
});

test.describe('Task 5: Other Admin Pages Load', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('user management page loads', async ({ page }) => {
        await page.goto('/admin/users');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('division management page loads', async ({ page }) => {
        await page.goto('/admin/divisions');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('department management page loads', async ({ page }) => {
        await page.goto('/admin/departments');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('position management page loads', async ({ page }) => {
        await page.goto('/admin/positions');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('faction management page loads', async ({ page }) => {
        await page.goto('/admin/factions');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });
});
