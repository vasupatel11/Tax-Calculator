/**
 * DST Trust Tax Calculator - Centralized Tax Data Source
 *
 * This file serves as the single source of truth for all tax-related data.
 * All calculators and pages should reference this file.
 *
 * Data Source: IRS Revenue Procedure 2025-32 (October 2025)
 * Last Updated: 2026-01-07
 * Tax Year: 2026
 */

// =================================================================
// 2026 FEDERAL INCOME TAX BRACKETS
// =================================================================

const TAX_YEAR = 2026;

const TAX_BRACKETS_2026 = {
    single: [
        { min: 0, max: 12400, rate: 0.10 },
        { min: 12400, max: 50400, rate: 0.12 },
        { min: 50400, max: 105700, rate: 0.22 },
        { min: 105700, max: 201775, rate: 0.24 },
        { min: 201775, max: 256225, rate: 0.32 },
        { min: 256225, max: 640600, rate: 0.35 },
        { min: 640600, max: Infinity, rate: 0.37 }
    ],
    married: [
        { min: 0, max: 24800, rate: 0.10 },
        { min: 24800, max: 100800, rate: 0.12 },
        { min: 100800, max: 211400, rate: 0.22 },
        { min: 211400, max: 403550, rate: 0.24 },
        { min: 403550, max: 512450, rate: 0.32 },
        { min: 512450, max: 768700, rate: 0.35 },
        { min: 768700, max: Infinity, rate: 0.37 }
    ],
    headOfHousehold: [
        { min: 0, max: 17700, rate: 0.10 },
        { min: 17700, max: 67450, rate: 0.12 },
        { min: 67450, max: 105700, rate: 0.22 },
        { min: 105700, max: 201775, rate: 0.24 },
        { min: 201775, max: 256200, rate: 0.32 },
        { min: 256200, max: 640600, rate: 0.35 },
        { min: 640600, max: Infinity, rate: 0.37 }
    ]
};

// =================================================================
// 2026 LONG-TERM CAPITAL GAINS TAX BRACKETS
// =================================================================

const CAPITAL_GAINS_BRACKETS_2026 = {
    single: [
        { min: 0, max: 49450, rate: 0.00 },
        { min: 49450, max: 544600, rate: 0.15 },
        { min: 544600, max: Infinity, rate: 0.20 }
    ],
    married: [
        { min: 0, max: 98900, rate: 0.00 },
        { min: 98900, max: 613700, rate: 0.15 },
        { min: 613700, max: Infinity, rate: 0.20 }
    ],
    headOfHousehold: [
        { min: 0, max: 64750, rate: 0.00 },
        { min: 64750, max: 566700, rate: 0.15 },
        { min: 566700, max: Infinity, rate: 0.20 }
    ]
};

// =================================================================
// NET INVESTMENT INCOME TAX (NIIT)
// =================================================================

const NIIT = {
    rate: 0.038, // 3.8%
    thresholds: {
        single: 200000,
        married: 250000,
        headOfHousehold: 200000
    }
};

// =================================================================
// 2026 STANDARD DEDUCTIONS
// =================================================================

const STANDARD_DEDUCTIONS_2026 = {
    single: 16100,
    married: 32200,
    headOfHousehold: 24150
};

// =================================================================
// STATE INCOME TAX RATES (2026)
// =================================================================
// Note: State rates updated based on 2026 legislative changes
// Source: Individual state revenue departments and Tax Foundation

const STATE_TAX_RATES = {
    'Alabama': 0.05,
    'Alaska': 0.00,     // No state income tax
    'Arizona': 0.025,
    'Arkansas': 0.039,
    'California': 0.133,
    'Colorado': 0.044,
    'Connecticut': 0.0699,
    'Delaware': 0.066,
    'Florida': 0.00,    // No state income tax
    'Georgia': 0.0519,  // Reduced from 5.39% (July 2025 change)
    'Hawaii': 0.11,
    'Idaho': 0.0558,
    'Illinois': 0.0495,
    'Indiana': 0.0295,  // Reduced to 2.95% for 2026
    'Iowa': 0.054,
    'Kansas': 0.057,
    'Kentucky': 0.04,
    'Louisiana': 0.0425,
    'Maine': 0.0715,
    'Maryland': 0.0575,
    'Massachusetts': 0.05,
    'Michigan': 0.0425,
    'Minnesota': 0.0985,
    'Mississippi': 0.05,
    'Missouri': 0.048,
    'Montana': 0.0675,
    'Nebraska': 0.0455, // Reduced from 5.2% to 4.55% for 2026
    'Nevada': 0.00,     // No state income tax
    'New Hampshire': 0.00, // No earned income tax
    'New Jersey': 0.1075,
    'New Mexico': 0.059,
    'New York': 0.109,
    'North Carolina': 0.0399, // Reduced from 4.25% to 3.99% for 2026
    'North Dakota': 0.029,
    'Ohio': 0.0275,     // Flat rate above $26,050 for 2026
    'Oklahoma': 0.05,
    'Oregon': 0.099,
    'Pennsylvania': 0.0307,
    'Rhode Island': 0.0599,
    'South Carolina': 0.065,
    'South Dakota': 0.00, // No state income tax
    'Tennessee': 0.00,  // No state income tax
    'Texas': 0.00,      // No state income tax
    'Utah': 0.0465,
    'Vermont': 0.0875,
    'Virginia': 0.0575,
    'Washington': 0.00, // No state income tax
    'West Virginia': 0.053,
    'Wisconsin': 0.0765,
    'Wyoming': 0.00     // No state income tax
};

// =================================================================
// TAX CALCULATION FUNCTIONS
// =================================================================

/**
 * Calculate federal income tax based on progressive brackets
 * @param {number} income - Taxable income
 * @param {string} filingStatus - 'single', 'married', or 'headOfHousehold'
 * @returns {number} Federal tax amount
 */
function calculateFederalTax(income, filingStatus) {
    const brackets = TAX_BRACKETS_2026[filingStatus];
    if (!brackets) {
        throw new Error(`Invalid filing status: ${filingStatus}`);
    }

    let tax = 0;
    for (const bracket of brackets) {
        if (income > bracket.min) {
            const bracketSize = Math.min(income, bracket.max) - bracket.min;
            tax += bracketSize * bracket.rate;
        }
        if (income <= bracket.max) break;
    }

    return Math.max(0, tax);
}

/**
 * Calculate long-term capital gains tax
 * @param {number} capitalGain - Long-term capital gain amount
 * @param {string} filingStatus - 'single', 'married', or 'headOfHousehold'
 * @returns {number} Capital gains tax amount
 */
function calculateCapitalGainsTax(capitalGain, filingStatus) {
    const brackets = CAPITAL_GAINS_BRACKETS_2026[filingStatus];
    if (!brackets) {
        throw new Error(`Invalid filing status: ${filingStatus}`);
    }

    let tax = 0;
    for (const bracket of brackets) {
        if (capitalGain > bracket.min) {
            const bracketSize = Math.min(capitalGain, bracket.max) - bracket.min;
            tax += bracketSize * bracket.rate;
        }
        if (capitalGain <= bracket.max) break;
    }

    return Math.max(0, tax);
}

/**
 * Calculate Net Investment Income Tax (NIIT)
 * @param {number} netInvestmentIncome - Net investment income
 * @param {number} modifiedAGI - Modified adjusted gross income
 * @param {string} filingStatus - 'single', 'married', or 'headOfHousehold'
 * @returns {number} NIIT amount
 */
function calculateNIIT(netInvestmentIncome, modifiedAGI, filingStatus) {
    const threshold = NIIT.thresholds[filingStatus];
    if (!threshold) {
        throw new Error(`Invalid filing status: ${filingStatus}`);
    }

    if (modifiedAGI <= threshold) {
        return 0;
    }

    const excessIncome = modifiedAGI - threshold;
    const taxableAmount = Math.min(netInvestmentIncome, excessIncome);
    return taxableAmount * NIIT.rate;
}

/**
 * Calculate state income tax
 * @param {number} income - Taxable income
 * @param {string} state - State name
 * @returns {number} State tax amount
 */
function calculateStateTax(income, state) {
    const rate = STATE_TAX_RATES[state];
    if (rate === undefined) {
        throw new Error(`Invalid state: ${state}`);
    }
    return income * rate;
}

/**
 * Get state tax rate
 * @param {string} state - State name
 * @returns {number} State tax rate (as decimal)
 */
function getStateTaxRate(state) {
    const rate = STATE_TAX_RATES[state];
    if (rate === undefined) {
        throw new Error(`Invalid state: ${state}`);
    }
    return rate;
}

// =================================================================
// FORMATTING FUNCTIONS
// =================================================================

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

/**
 * Format percentage for display
 * @param {number} rate - Rate as decimal (e.g., 0.22 for 22%)
 * @returns {string} Formatted percentage string
 */
function formatPercentage(rate) {
    return (rate * 100).toFixed(2) + '%';
}

/**
 * Format filing status for display
 * @param {string} status - Filing status code
 * @returns {string} Human-readable filing status
 */
function formatFilingStatus(status) {
    const statusMap = {
        'single': 'Single',
        'married': 'Married Filing Jointly',
        'headOfHousehold': 'Head of Household'
    };
    return statusMap[status] || status;
}

// =================================================================
// EXPORTS
// =================================================================

// Export for use in other JavaScript files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TAX_YEAR,
        TAX_BRACKETS_2026,
        CAPITAL_GAINS_BRACKETS_2026,
        NIIT,
        STANDARD_DEDUCTIONS_2026,
        STATE_TAX_RATES,
        calculateFederalTax,
        calculateCapitalGainsTax,
        calculateNIIT,
        calculateStateTax,
        getStateTaxRate,
        formatCurrency,
        formatPercentage,
        formatFilingStatus
    };
}
