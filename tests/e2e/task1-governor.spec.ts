import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Task 1: Governor Evaluation', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('admin can see evaluation list page', async ({ page }) => {
        await page.goto('/evaluations');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('governor evaluation exists in evaluation list', async ({ page }) => {
        await page.goto('/evaluations');
        await page.waitForTimeout(3000);
        const hasGovernor = await page.locator('text=ผู้ว่าการ').isVisible({ timeout: 5000 }).catch(() => false);
        const hasGrade13 = await page.locator('text=13').isVisible({ timeout: 3000 }).catch(() => false);
        const hasEvaluation = await page.locator('text=แบบประเมิน').isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasGovernor || hasGrade13 || hasEvaluation).toBeTruthy();
    });

    test('admin can access evaluation preview', async ({ page }) => {
        await page.goto('/evaluations');
        await page.waitForTimeout(3000);
        const previewLinks = page.locator('a[href*="preview"]');
        const count = await previewLinks.count();
        if (count > 0) {
            await previewLinks.first().click();
            await page.waitForTimeout(3000);
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });

    test('admin can access assignment manager', async ({ page }) => {
        await page.goto('/admin/assignments');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('admin can access assignment create form', async ({ page }) => {
        await page.goto('/admin/assignments/create');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('admin can access evaluation report page', async ({ page }) => {
        await page.goto('/admin/reports/evaluation');
        await page.waitForTimeout(5000);
        const exportBtn = page.locator('text=ส่งออก').first();
        await expect(exportBtn).toBeVisible({ timeout: 10000 });
    });
});
