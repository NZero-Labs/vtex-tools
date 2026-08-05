export class BudgetIntegrationError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "BudgetIntegrationError";
  }
}

