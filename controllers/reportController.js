const SaleModel = require('../models/saleModel');

class ReportController {
    static getIndex(req, res) {
        // Default: today
        const today = new Date().toISOString().slice(0, 10);
        let startDate = req.query.start || today;
        let endDate = req.query.end || today;
        const preset = req.query.preset || 'today';

        // Handle presets
        const now = new Date();
        if (preset === 'today') {
            startDate = today;
            endDate = today;
        } else if (preset === 'this_week') {
            const dayOfWeek = now.getDay();
            const start = new Date(now);
            start.setDate(start.getDate() - dayOfWeek);
            startDate = start.toISOString().slice(0, 10);
            endDate = today;
        } else if (preset === 'this_month') {
            startDate = now.toISOString().slice(0, 7) + '-01';
            endDate = today;
        } else if (preset === 'this_year') {
            startDate = now.getFullYear() + '-01-01';
            endDate = today;
        }
        // else preset === 'custom', use query params

        const reportData = SaleModel.getReportData(startDate, endDate);
        const sales = SaleModel.getByDateRange(startDate, endDate);

        // Summary totals
        const totalRevenue = reportData.reduce((s, r) => s + (r.total_revenue || 0), 0);
        const totalCost = reportData.reduce((s, r) => s + (r.total_cost || 0), 0);
        const totalProfit = totalRevenue - totalCost;
        const totalSalesCount = sales.length;

        res.render('reports/index', {
            title: 'Reports & Analytics',
            reportData,
            totalRevenue,
            totalCost,
            totalProfit,
            totalSalesCount,
            startDate,
            endDate,
            preset
        });
    }
}

module.exports = ReportController;
