// IRS Tax Brackets for 2025 (Federal Income Tax)
const TAX_BRACKETS_2025 = {
    single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
    ],
    married_joint: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
    ],
    married_separate: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 365600, rate: 0.35 },
        { min: 365600, max: Infinity, rate: 0.37 }
    ],
    head_of_household: [
        { min: 0, max: 16550, rate: 0.10 },
        { min: 16550, max: 63100, rate: 0.12 },
        { min: 63100, max: 100500, rate: 0.22 },
        { min: 100500, max: 191950, rate: 0.24 },
        { min: 191950, max: 243700, rate: 0.32 },
        { min: 243700, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
    ]
};

// Long-term Capital Gains Tax Brackets 2025
const CAPITAL_GAINS_BRACKETS_2025 = {
    single: [
        { min: 0, max: 47025, rate: 0.00 },
        { min: 47025, max: 518900, rate: 0.15 },
        { min: 518900, max: Infinity, rate: 0.20 }
    ],
    married_joint: [
        { min: 0, max: 94050, rate: 0.00 },
        { min: 94050, max: 583750, rate: 0.15 },
        { min: 583750, max: Infinity, rate: 0.20 }
    ],
    married_separate: [
        { min: 0, max: 47025, rate: 0.00 },
        { min: 47025, max: 291850, rate: 0.15 },
        { min: 291850, max: Infinity, rate: 0.20 }
    ],
    head_of_household: [
        { min: 0, max: 63000, rate: 0.00 },
        { min: 63000, max: 551350, rate: 0.15 },
        { min: 551350, max: Infinity, rate: 0.20 }
    ]
};

// NIIT (Net Investment Income Tax) thresholds
const NIIT_THRESHOLDS = {
    single: 200000,
    married_joint: 250000,
    married_separate: 125000,
    head_of_household: 200000
};

// Social Security Actuarial Life Expectancy Table (2024)
const LIFE_EXPECTANCY_TABLE = {
    male: {
        0: 76.2, 1: 75.6, 5: 71.7, 10: 66.8, 15: 61.9, 20: 57.1, 25: 52.4, 30: 47.7, 35: 43.0, 40: 38.4,
        45: 33.9, 50: 29.5, 55: 25.3, 60: 21.4, 65: 17.8, 70: 14.4, 75: 11.4, 80: 8.7, 85: 6.5, 90: 4.8,
        95: 3.5, 100: 2.6, 105: 2.0, 110: 1.6
    },
    female: {
        0: 81.0, 1: 80.4, 5: 76.4, 10: 71.5, 15: 66.5, 20: 61.6, 25: 56.7, 30: 51.9, 35: 47.0, 40: 42.2,
        45: 37.5, 50: 32.9, 55: 28.5, 60: 24.2, 65: 20.2, 70: 16.4, 75: 12.9, 80: 9.8, 85: 7.2, 90: 5.2,
        95: 3.8, 100: 2.8, 105: 2.1, 110: 1.7
    }
};

// Get life expectancy based on age and gender
function getLifeExpectancy(age, gender) {
    const table = LIFE_EXPECTANCY_TABLE[gender];
    if (!table) return 0;

    // Find the closest age in the table
    const ages = Object.keys(table).map(Number).sort((a, b) => a - b);

    // If exact age exists
    if (table[age] !== undefined) {
        return table[age];
    }

    // Interpolate between ages
    for (let i = 0; i < ages.length - 1; i++) {
        if (age >= ages[i] && age < ages[i + 1]) {
            const lowerAge = ages[i];
            const upperAge = ages[i + 1];
            const lowerLE = table[lowerAge];
            const upperLE = table[upperAge];

            // Linear interpolation
            const ratio = (age - lowerAge) / (upperAge - lowerAge);
            return lowerLE - (lowerLE - upperLE) * ratio;
        }
    }

    // If age is beyond table, use the last value
    return table[ages[ages.length - 1]];
}

// Calculate federal income tax
function calculateFederalTax(income, filingStatus) {
    const brackets = TAX_BRACKETS_2025[filingStatus];
    let tax = 0;
    let remainingIncome = income;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const bracketSize = bracket.max - bracket.min;

        if (remainingIncome <= 0) break;

        if (remainingIncome > bracketSize) {
            tax += bracketSize * bracket.rate;
            remainingIncome -= bracketSize;
        } else {
            tax += remainingIncome * bracket.rate;
            remainingIncome = 0;
        }
    }

    return tax;
}

// Calculate capital gains tax
function calculateCapitalGainsTax(capitalGain, income, filingStatus, isShortTerm) {
    if (isShortTerm) {
        // Short-term capital gains are taxed as ordinary income
        return calculateFederalTax(income + capitalGain, filingStatus) - calculateFederalTax(income, filingStatus);
    }

    // Long-term capital gains
    const brackets = CAPITAL_GAINS_BRACKETS_2025[filingStatus];
    let tax = 0;
    let remainingGain = capitalGain;

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const bracketSize = bracket.max - bracket.min;

        if (remainingGain <= 0) break;

        if (remainingGain > bracketSize) {
            tax += bracketSize * bracket.rate;
            remainingGain -= bracketSize;
        } else {
            tax += remainingGain * bracket.rate;
            remainingGain = 0;
        }
    }

    return tax;
}

// Calculate NIIT (Net Investment Income Tax)
function calculateNIIT(capitalGain, income, filingStatus) {
    const threshold = NIIT_THRESHOLDS[filingStatus];
    const totalIncome = income + capitalGain;

    if (totalIncome <= threshold) {
        return 0;
    }

    // NIIT applies to the lesser of net investment income or the amount by which MAGI exceeds threshold
    const excessIncome = totalIncome - threshold;
    const taxableAmount = Math.min(capitalGain, excessIncome);

    return taxableAmount * 0.038; // 3.8% NIIT
}

// Calculate number of days between two dates
function daysBetweenDates(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Calculate future value with annual withdrawals
function calculateFutureValue(principal, annualRate, years, annualWithdrawal) {
    let value = principal;
    for (let i = 0; i < years; i++) {
        value = value * (1 + annualRate) - annualWithdrawal;
        if (value < 0) value = 0;
    }
    return value;
}

// Main form submission handler
document.getElementById('taxCalculatorForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const assetValue = parseFloat(document.getElementById('assetValue').value);
    const costBasis = parseFloat(document.getElementById('costBasis').value);
    const purchaseDate = new Date(document.getElementById('purchaseDate').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const filingStatus = document.getElementById('filingStatus').value;
    const annualIncome = parseFloat(document.getElementById('annualIncome').value);
    const stateRate = parseFloat(document.getElementById('state').value) / 100;
    const rateOfReturn = parseFloat(document.getElementById('rateOfReturn').value) / 100;
    const annualWithdrawal = parseFloat(document.getElementById('annualWithdrawal').value);

    // Calculate capital gain
    const capitalGain = assetValue - costBasis;

    // Calculate holding period
    const today = new Date();
    const holdingDays = daysBetweenDates(today, purchaseDate);
    const isShortTerm = holdingDays < 365;

    // Get life expectancy
    const lifeExpectancy = getLifeExpectancy(age, gender);
    const yearsRemaining = Math.round(lifeExpectancy);

    // Calculate taxes - Traditional Method
    const federalIncomeTax = calculateFederalTax(annualIncome, filingStatus);
    const capitalGainsTax = calculateCapitalGainsTax(capitalGain, annualIncome, filingStatus, isShortTerm);
    const niitTax = calculateNIIT(capitalGain, annualIncome, filingStatus);
    const stateTax = capitalGain * stateRate;

    const totalTraditionalTax = capitalGainsTax + niitTax + stateTax;
    const afterTaxAmount = assetValue - totalTraditionalTax;

    // 453 Structure Calculations
    // In a 453 structure, the gain is spread over the life expectancy
    const annualGainRecognition = capitalGain / yearsRemaining;
    const annualTaxOn453 = (calculateCapitalGainsTax(annualGainRecognition, annualIncome, filingStatus, false) +
                            calculateNIIT(annualGainRecognition, annualIncome, filingStatus) +
                            (annualGainRecognition * stateRate));

    const total453TaxOverLife = annualTaxOn453 * yearsRemaining;
    const taxSavings = totalTraditionalTax - total453TaxOverLife;

    // Wealth projections
    const traditionalStart = afterTaxAmount;
    const traditional10y = calculateFutureValue(traditionalStart, rateOfReturn, 10, annualWithdrawal);
    const traditional20y = calculateFutureValue(traditionalStart, rateOfReturn, 20, annualWithdrawal);
    const traditionalLife = calculateFutureValue(traditionalStart, rateOfReturn, yearsRemaining, annualWithdrawal);

    // 453 structure - full asset value minus annual tax payments
    const method453Start = assetValue;
    const method453_10y = calculateFutureValue(method453Start, rateOfReturn, 10, annualWithdrawal + annualTaxOn453);
    const method453_20y = calculateFutureValue(method453Start, rateOfReturn, 20, annualWithdrawal + annualTaxOn453);
    const method453_life = calculateFutureValue(method453Start, rateOfReturn, yearsRemaining, annualWithdrawal + annualTaxOn453);

    const totalAdvantage = method453_life - traditionalLife;

    // Display results
    document.getElementById('result-capital-gain').textContent = formatCurrency(capitalGain);
    document.getElementById('result-holding-period').textContent = `${holdingDays} days`;
    document.getElementById('result-gain-type').textContent = isShortTerm ? 'Short-term' : 'Long-term';

    document.getElementById('result-age').textContent = age;
    document.getElementById('result-life-expectancy').textContent = lifeExpectancy.toFixed(1) + ' years';
    document.getElementById('result-years-remaining').textContent = yearsRemaining + ' years';

    document.getElementById('result-trad-federal').textContent = formatCurrency(federalIncomeTax);
    document.getElementById('result-trad-state').textContent = formatCurrency(stateTax);
    document.getElementById('result-trad-niit').textContent = formatCurrency(niitTax);
    document.getElementById('result-trad-cap-gains').textContent = formatCurrency(capitalGainsTax);
    document.getElementById('result-trad-total').textContent = formatCurrency(totalTraditionalTax);
    document.getElementById('result-trad-after-tax').textContent = formatCurrency(afterTaxAmount);

    document.getElementById('result-453-deferral').textContent = formatCurrency(totalTraditionalTax);
    document.getElementById('result-453-payment').textContent = formatCurrency(assetValue / yearsRemaining);
    document.getElementById('result-453-annual-tax').textContent = formatCurrency(annualTaxOn453);
    document.getElementById('result-453-savings').textContent = formatCurrency(taxSavings);

    document.getElementById('comp-trad-start').textContent = formatCurrency(traditionalStart);
    document.getElementById('comp-trad-10y').textContent = formatCurrency(traditional10y);
    document.getElementById('comp-trad-20y').textContent = formatCurrency(traditional20y);
    document.getElementById('comp-trad-life').textContent = formatCurrency(traditionalLife);

    document.getElementById('comp-453-start').textContent = formatCurrency(method453Start);
    document.getElementById('comp-453-10y').textContent = formatCurrency(method453_10y);
    document.getElementById('comp-453-20y').textContent = formatCurrency(method453_20y);
    document.getElementById('comp-453-life').textContent = formatCurrency(method453_life);

    document.getElementById('total-advantage').textContent = formatCurrency(totalAdvantage);

    // Show results section
    document.getElementById('results').style.display = 'block';

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
