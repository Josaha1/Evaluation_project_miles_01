/** Centralized selectors for the evaluation system */
export const sel = {
    login: {
        emid: '#emid',
        password: '#password',
        submit: 'button[type="submit"]:has-text("เข้าสู่ระบบ")',
        error: '.text-red-500',
        announcementBtn: 'button:has-text("อ่านประกาศ")',
    },
    external: {
        codeInput: '#code',
        submit: 'button[type="submit"]:has-text("เข้าสู่ระบบ")',
        error: '.text-red-600',
    },
    dashboard: {
        selfEval: 'text=ประเมินตนเอง',
        othersEval: 'text=ประเมินผู้อื่น',
        startBtn: 'text=เริ่มประเมิน',
        continueBtn: 'text=ทำต่อ',
    },
    admin: {
        reportLink: 'a[href*="evaluation-report"], a[href*="reports"]',
        assignmentLink: 'a[href*="assignments"]',
        externalOrgLink: 'a[href*="external-organizations"]',
        accessCodeLink: 'a[href*="access-codes"]',
    },
};
