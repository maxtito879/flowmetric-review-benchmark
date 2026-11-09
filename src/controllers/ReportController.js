'use strict';

const { validateReportQuery } = require('../validators/reportValidator');

const CSV_HEADERS = { 'content-type': 'text/csv; charset=utf-8' };

class ReportController {
  constructor({ reportService }) {
    this.reportService = reportService;
  }

  async sales(req) {
    const report = await this.reportService.salesSummary(validateReportQuery(req.query));
    return { status: 200, body: { report } };
  }

  async topProducts(req) {
    const products = await this.reportService.topProducts(validateReportQuery(req.query));
    return { status: 200, body: { products } };
  }

  async dailyRevenue(req) {
    const days = await this.reportService.dailyRevenue(validateReportQuery(req.query));
    return { status: 200, body: { days } };
  }

  async ordersCsv(req) {
    const csv = await this.reportService.exportOrdersCsv(validateReportQuery(req.query));
    return { status: 200, headers: CSV_HEADERS, body: csv };
  }

  async customersCsv() {
    const csv = await this.reportService.exportCustomersCsv();
    return { status: 200, headers: CSV_HEADERS, body: csv };
  }
}

module.exports = { ReportController };
