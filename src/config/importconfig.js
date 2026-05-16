// config/importConfig.js
export const defaultImportConfig = {
  strictMode: false,
  interactiveMode: true,
  
  errorHandling: {
    duplicate_email: 'update',     // update | skip | suffix | ask
    invalid_state: 'auto_fix',
    invalid_price: 'default_zero',
    missing_required: 'skip',
    parsing_error: 'skip'
  },
  
  maxErrors: 10,
  errorThreshold: 0.2,
  
  generateReport: true,
  saveReportToFile: true
}