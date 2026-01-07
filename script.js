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

// Global variable to store chart instance
let comparisonChart = null;

// Global variables to store projection data
let traditionalProjections = [];
let method453Projections = [];

// ===== UTILITY FUNCTIONS =====

// Format number with commas
function formatNumberWithCommas(value) {
    // Remove all non-digit characters except decimal point
    let num = value.replace(/[^\d.]/g, '');

    // Split into integer and decimal parts
    let parts = num.split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1];

    // Add commas to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Rejoin with decimal if it exists
    return decimalPart !== undefined ? integerPart + '.' + decimalPart : integerPart;
}

// Parse formatted number (remove commas)
function parseFormattedNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove all commas and parse
    return parseFloat(value.replace(/,/g, '')) || 0;
}

// Validate numeric input
function validateNumericInput(value, fieldName) {
    const num = parseFormattedNumber(value);
    if (isNaN(num) || num < 0) {
        throw new Error(`${fieldName} must be a valid positive number`);
    }
    return num;
}

// Add comma formatting to input fields
document.addEventListener('DOMContentLoaded', function() {
    const numericFields = ['assetValue', 'costBasis', 'annualIncome', 'annualWithdrawal'];

    numericFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function(e) {
                let cursorPosition = e.target.selectionStart;
                let oldValue = e.target.value;
                let oldLength = oldValue.length;

                // Format the value
                let formattedValue = formatNumberWithCommas(oldValue);
                e.target.value = formattedValue;

                // Adjust cursor position
                let newLength = formattedValue.length;
                cursorPosition = cursorPosition + (newLength - oldLength);
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });

            // Format on blur
            field.addEventListener('blur', function(e) {
                if (e.target.value) {
                    e.target.value = formatNumberWithCommas(e.target.value);
                }
            });
        }
    });

    // Update max growth period note when age or gender changes
    const ageField = document.getElementById('age');
    const genderField = document.getElementById('gender');
    const growthPeriodNote = document.getElementById('growthPeriodNote');
    const growthPeriodField = document.getElementById('growthPeriod');

    function updateMaxGrowthPeriod() {
        const age = parseInt(ageField.value);
        const gender = genderField.value;

        if (age && gender && age >= 1 && age <= 120) {
            const lifeExpectancy = getLifeExpectancy(age, gender);
            const maxYears = Math.floor(lifeExpectancy);
            growthPeriodNote.innerHTML = `<strong>Max ${maxYears} years allowed</strong> based on your age and gender`;
            growthPeriodNote.style.color = 'var(--brand-gold)';

            // Update max attribute on growth period field
            growthPeriodField.setAttribute('max', maxYears);
        } else {
            growthPeriodNote.textContent = 'Select your age and gender above to see maximum allowed years';
            growthPeriodNote.style.color = 'var(--text-tertiary)';
        }
    }

    if (ageField && genderField) {
        ageField.addEventListener('input', updateMaxGrowthPeriod);
        ageField.addEventListener('change', updateMaxGrowthPeriod);
        genderField.addEventListener('change', updateMaxGrowthPeriod);
    }
});

// Get life expectancy based on age and gender
function getLifeExpectancy(age, gender) {
    const table = LIFE_EXPECTANCY_TABLE[gender];
    if (!table) {
        console.error('Invalid gender:', gender);
        return 0;
    }

    const ages = Object.keys(table).map(Number).sort((a, b) => a - b);

    if (table[age] !== undefined) {
        return table[age];
    }

    for (let i = 0; i < ages.length - 1; i++) {
        if (age >= ages[i] && age < ages[i + 1]) {
            const lowerAge = ages[i];
            const upperAge = ages[i + 1];
            const lowerLE = table[lowerAge];
            const upperLE = table[upperAge];

            const ratio = (age - lowerAge) / (upperAge - lowerAge);
            return lowerLE - (lowerLE - upperLE) * ratio;
        }
    }

    return table[ages[ages.length - 1]];
}

// Calculate federal income tax
function calculateFederalTax(income, filingStatus) {
    const brackets = TAX_BRACKETS_2025[filingStatus];
    if (!brackets) {
        throw new Error('Invalid filing status');
    }

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
        return calculateFederalTax(income + capitalGain, filingStatus) - calculateFederalTax(income, filingStatus);
    }

    const brackets = CAPITAL_GAINS_BRACKETS_2025[filingStatus];
    if (!brackets) {
        throw new Error('Invalid filing status for capital gains');
    }

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
    if (!threshold) {
        throw new Error('Invalid filing status for NIIT');
    }

    const totalIncome = income + capitalGain;

    if (totalIncome <= threshold) {
        return 0;
    }

    const excessIncome = totalIncome - threshold;
    const taxableAmount = Math.min(capitalGain, excessIncome);

    return taxableAmount * 0.038;
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

// Format compact currency (for chart labels)
function formatCompactCurrency(amount) {
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(0) + 'K';
    }
    return formatCurrency(amount);
}

// Populate tax breakdown table
function populateTaxBreakdownTable(assetValue, costBasis, capitalGain, capitalGainsTax, niitTax, stateTax, stateRate, isShortTerm, filingStatus, stateName, annualWithdrawal) {
    const tbody = document.getElementById('taxBreakdownBody');
    if (!tbody) {
        console.error('Tax breakdown table body not found');
        return;
    }

    tbody.innerHTML = '';

    // Filing Status and State Info Row
    let row = tbody.insertRow();
    row.innerHTML = `
        <td colspan="3" style="background: rgba(43, 95, 143, 0.1); font-weight: 600;">
            Filing Status: ${formatFilingStatus(filingStatus)} | State: ${stateName}
        </td>
    `;

    // Asset Sale
    row = tbody.insertRow();
    row.innerHTML = `
        <td><strong>Asset Sale Price</strong></td>
        <td>-</td>
        <td><strong>${formatCurrency(assetValue)}</strong></td>
    `;

    // Cost Basis
    row = tbody.insertRow();
    row.innerHTML = `
        <td>Less: Cost Basis</td>
        <td>-</td>
        <td>-${formatCurrency(costBasis)}</td>
    `;

    // Capital Gain
    row = tbody.insertRow();
    row.innerHTML = `
        <td><strong>Capital Gain</strong></td>
        <td>${formatCurrency(assetValue)} - ${formatCurrency(costBasis)}</td>
        <td><strong>${formatCurrency(capitalGain)}</strong></td>
    `;

    // Federal Capital Gains Tax
    const gainType = isShortTerm ? 'Short-term' : 'Long-term';
    const capGainsRate = ((capitalGainsTax / capitalGain) * 100).toFixed(2);
    row = tbody.insertRow();
    row.innerHTML = `
        <td>Federal Capital Gains Tax (${gainType})</td>
        <td>${capGainsRate}% effective rate</td>
        <td>${formatCurrency(capitalGainsTax)}</td>
    `;

    // NIIT
    const niitRate = niitTax > 0 ? '3.8%' : '0% (below threshold)';
    row = tbody.insertRow();
    row.innerHTML = `
        <td>Net Investment Income Tax (NIIT)</td>
        <td>${niitRate} on investment income</td>
        <td>${formatCurrency(niitTax)}</td>
    `;

    // State Tax
    row = tbody.insertRow();
    row.innerHTML = `
        <td>State Tax (${stateName})</td>
        <td>${(stateRate * 100).toFixed(2)}% of capital gain</td>
        <td>${formatCurrency(stateTax)}</td>
    `;

    // Withdrawal Tax Rate (if applicable)
    if (annualWithdrawal > 0) {
        const withdrawalTax = calculateFederalTax(annualWithdrawal, filingStatus) + (annualWithdrawal * stateRate);
        const withdrawalTaxRate = ((withdrawalTax / annualWithdrawal) * 100).toFixed(2);
        row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="3" style="background: rgba(212, 169, 88, 0.1); padding-top: 1rem; border-top: 2px solid var(--brand-gold);">
                <strong>Annual Withdrawal Tax Rate:</strong> ${withdrawalTaxRate}%
                (${formatCurrency(withdrawalTax)} tax on ${formatCurrency(annualWithdrawal)} withdrawal, assuming this is your only income)
            </td>
        `;
    }

    // Update summary
    const totalTax = capitalGainsTax + niitTax + stateTax;
    const effectiveRate = (totalTax / assetValue) * 100;
    const netProceeds = assetValue - totalTax;

    document.getElementById('breakdown-total-tax').textContent = formatCurrency(totalTax);
    document.getElementById('breakdown-effective-rate').textContent = effectiveRate.toFixed(2) + '%';
    document.getElementById('breakdown-net-proceeds').textContent = formatCurrency(netProceeds);
}

// Helper function to format filing status
function formatFilingStatus(status) {
    const statusMap = {
        'single': 'Single',
        'married_joint': 'Married Filing Jointly',
        'married_separate': 'Married Filing Separately',
        'head_of_household': 'Head of Household'
    };
    return statusMap[status] || status;
}

// Generate year-by-year projections for Traditional scenario
function generateTraditionalProjections(startAge, yearsRemaining, assetValue, upfrontTax, rateOfReturn, baseLifestyleWithdrawal, filingStatus, stateRate) {
    const projections = [];
    const inflationRate = 0.05; // 5% annual inflation

    // Year 1: Asset sale year - pay upfront taxes, no growth yet, no withdrawals
    const afterTaxAmount = assetValue - upfrontTax;
    projections.push({
        age: startAge,
        assetBeginning: assetValue,
        growth: 0,
        lifestyleWithdrawal: 0,
        tax: upfrontTax,
        netEnding: afterTaxAmount
    });

    // Year 2+: Asset is now invested and earning returns
    let currentAsset = afterTaxAmount;
    let currentWithdrawal = baseLifestyleWithdrawal;

    for (let year = 1; year < yearsRemaining; year++) {
        const age = startAge + year;
        const assetBeginning = currentAsset;
        const growth = assetBeginning * rateOfReturn;

        // Tax is calculated on the withdrawal amount as income
        const withdrawalTax = calculateFederalTax(currentWithdrawal, filingStatus) + (currentWithdrawal * stateRate);

        const netEnding = assetBeginning + growth - currentWithdrawal - withdrawalTax;

        projections.push({
            age: age,
            assetBeginning: assetBeginning,
            growth: growth,
            lifestyleWithdrawal: currentWithdrawal,
            tax: withdrawalTax,
            netEnding: netEnding > 0 ? netEnding : 0
        });

        currentAsset = netEnding > 0 ? netEnding : 0;

        // Increase withdrawal by 5% for next year
        currentWithdrawal = currentWithdrawal * (1 + inflationRate);

        if (currentAsset <= 0) break;
    }

    return projections;
}

// Generate year-by-year projections for 453 scenario
function generate453Projections(startAge, yearsRemaining, assetValue, complianceFeeRate, rateOfReturn, baseLifestyleWithdrawal, filingStatus, stateRate) {
    const projections = [];
    const inflationRate = 0.05; // 5% annual inflation

    // Year 1: Asset sale year - only pay compliance fee, no growth yet, no withdrawals, no taxes
    const year1ComplianceFee = assetValue * complianceFeeRate;
    const year1NetEnding = assetValue - year1ComplianceFee;

    projections.push({
        age: startAge,
        assetBeginning: assetValue,
        growth: 0,
        complianceFee: year1ComplianceFee,
        lifestyleWithdrawal: 0,
        tax: 0,
        netEnding: year1NetEnding
    });

    // Year 2+: Asset is now invested and earning returns
    let currentAsset = year1NetEnding;
    let currentWithdrawal = baseLifestyleWithdrawal;

    for (let year = 1; year < yearsRemaining; year++) {
        const age = startAge + year;
        const assetBeginning = currentAsset;
        const growth = assetBeginning * rateOfReturn;
        // Compliance fee is calculated on Asset (Beginning) + Growth
        const complianceFee = (assetBeginning + growth) * complianceFeeRate;

        // Tax is calculated on the withdrawal amount as income
        const withdrawalTax = calculateFederalTax(currentWithdrawal, filingStatus) + (currentWithdrawal * stateRate);

        const netEnding = assetBeginning + growth - complianceFee - currentWithdrawal - withdrawalTax;

        projections.push({
            age: age,
            assetBeginning: assetBeginning,
            growth: growth,
            complianceFee: complianceFee,
            lifestyleWithdrawal: currentWithdrawal,
            tax: withdrawalTax,
            netEnding: netEnding > 0 ? netEnding : 0
        });

        currentAsset = netEnding > 0 ? netEnding : 0;

        // Increase withdrawal by 5% for next year
        currentWithdrawal = currentWithdrawal * (1 + inflationRate);

        if (currentAsset <= 0) break;
    }

    return projections;
}

// Render projection table
function renderProjectionTable(projections, scenario) {
    const tbody = document.getElementById('projectionTableBody');
    if (!tbody) {
        console.error('Projection table body not found');
        return;
    }

    tbody.innerHTML = '';

    projections.forEach(row => {
        const tr = document.createElement('tr');

        if (scenario === '453') {
            tr.innerHTML = `
                <td>${row.age}</td>
                <td>${formatCurrency(row.assetBeginning)}</td>
                <td>${formatCurrency(row.growth)}</td>
                <td class="compliance-col">${formatCurrency(row.complianceFee)}</td>
                <td>${formatCurrency(row.lifestyleWithdrawal)}</td>
                <td>${formatCurrency(row.tax)}</td>
                <td><strong>${formatCurrency(row.netEnding)}</strong></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${row.age}</td>
                <td>${formatCurrency(row.assetBeginning)}</td>
                <td>${formatCurrency(row.growth)}</td>
                <td class="compliance-col" style="display: none;"></td>
                <td>${formatCurrency(row.lifestyleWithdrawal)}</td>
                <td>${formatCurrency(row.tax)}</td>
                <td><strong>${formatCurrency(row.netEnding)}</strong></td>
            `;
        }

        tbody.appendChild(tr);
    });
}

// Create comparison chart
function createComparisonChart(traditionalData, method453Data, startAge) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const labels = traditionalData.map(d => d.age);
    const traditionalValues = traditionalData.map(d => d.netEnding);
    const method453Values = method453Data.map(d => d.netEnding);

    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Net Ending - Traditional',
                    data: traditionalValues,
                    borderColor: '#c44d4d',
                    backgroundColor: 'rgba(196, 77, 77, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#c44d4d',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Net Ending - DST Trust 453',
                    data: method453Values,
                    borderColor: '#d4a958',
                    backgroundColor: 'rgba(212, 169, 88, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#d4a958',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20,
                        usePointStyle: true,
                        color: '#1a1a1a'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 15,
                    titleFont: {
                        size: 16
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#1a1a1a'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#4a4a4a'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Ending Value',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#1a1a1a'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCompactCurrency(value);
                        },
                        color: '#4a4a4a'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)'
                    }
                }
            }
        }
    });
}

// Toggle scenario buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing toggle buttons');
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Toggle button clicked:', this.getAttribute('data-scenario'));
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const scenario = this.getAttribute('data-scenario');
            const complianceCols = document.querySelectorAll('.compliance-col');

            if (scenario === '453') {
                complianceCols.forEach(col => col.style.display = '');
                renderProjectionTable(method453Projections, '453');
            } else {
                complianceCols.forEach(col => col.style.display = 'none');
                renderProjectionTable(traditionalProjections, 'traditional');
            }
        });
    });
});

// Main form submission handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up form submission handler');

    const form = document.getElementById('taxCalculatorForm');
    if (!form) {
        console.error('Form not found!');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted!');

        try {
            // Get and validate form values
            console.log('Getting form values...');

            const assetValue = validateNumericInput(document.getElementById('assetValue').value, 'Asset Value');
            const costBasis = validateNumericInput(document.getElementById('costBasis').value, 'Cost Basis');

            // Check for short term gain radio
            const shortTermRadio = document.querySelector('input[name="shortTermGain"]:checked');
            if (!shortTermRadio) {
                alert('Please select whether the asset was purchased within the last year');
                return;
            }
            const isShortTerm = shortTermRadio.value === 'yes';

            const age = parseInt(document.getElementById('age').value);
            if (!age || age < 1 || age > 120) {
                alert('Please enter a valid age between 1 and 120');
                return;
            }

            const gender = document.getElementById('gender').value;
            if (!gender) {
                alert('Please select your gender');
                return;
            }

            const filingStatus = document.getElementById('filingStatus').value;
            if (!filingStatus) {
                alert('Please select your tax filing status');
                return;
            }

            const annualIncome = validateNumericInput(document.getElementById('annualIncome').value, 'Annual Income');

            const stateSelect = document.getElementById('state');
            if (!stateSelect.value) {
                alert('Please select your state of residence');
                return;
            }
            const stateRate = parseFloat(stateSelect.value) / 100;

            const rateOfReturn = parseFloat(document.getElementById('rateOfReturn').value) / 100;
            if (isNaN(rateOfReturn) || rateOfReturn < 0) {
                alert('Please enter a valid rate of return');
                return;
            }

            const annualWithdrawal = validateNumericInput(document.getElementById('annualWithdrawal').value, 'Annual Withdrawal');

            // Get growth period
            const growthPeriod = parseInt(document.getElementById('growthPeriod').value);
            if (!growthPeriod || growthPeriod < 1) {
                alert('Please enter a valid Tax-Protected Growth Period');
                return;
            }

            // Get compliance fee
            const complianceFee = parseFloat(document.getElementById('complianceFee').value);
            if (isNaN(complianceFee) || complianceFee < 0) {
                alert('Please enter a valid Compliance Support Fee percentage');
                return;
            }
            const complianceFeeRate = complianceFee / 100;

            // Get life expectancy to validate growth period
            const lifeExpectancy = getLifeExpectancy(age, gender);
            const maxYears = Math.floor(lifeExpectancy);

            if (growthPeriod > maxYears) {
                alert(`Tax-Protected Growth Period cannot exceed ${maxYears} years (your life expectancy based on age and gender)`);
                return;
            }

            console.log('All inputs validated:', {
                assetValue,
                costBasis,
                isShortTerm,
                age,
                gender,
                filingStatus,
                annualIncome,
                stateRate,
                rateOfReturn,
                annualWithdrawal,
                growthPeriod,
                complianceFeeRate
            });

            // Calculate capital gain
            const capitalGain = assetValue - costBasis;
            if (capitalGain < 0) {
                alert('Cost Basis cannot be greater than Asset Value');
                return;
            }

            console.log('Life expectancy:', lifeExpectancy, 'Growth period:', growthPeriod);

            // Calculate upfront taxes for Traditional Method
            const capitalGainsTax = calculateCapitalGainsTax(capitalGain, annualIncome, filingStatus, isShortTerm);
            const niitTax = calculateNIIT(capitalGain, annualIncome, filingStatus);
            const stateTax = capitalGain * stateRate;
            const federalIncomeTax = calculateFederalTax(annualIncome, filingStatus);

            const totalUpfrontTax = capitalGainsTax + niitTax + stateTax;
            const afterTaxAmount = assetValue - totalUpfrontTax;

            console.log('Tax calculations:', {
                capitalGainsTax,
                niitTax,
                stateTax,
                totalUpfrontTax,
                afterTaxAmount
            });

            // Get state name
            const stateName = stateSelect.options[stateSelect.selectedIndex].text;

            // Populate tax breakdown table
            console.log('Populating tax breakdown table...');
            populateTaxBreakdownTable(assetValue, costBasis, capitalGain, capitalGainsTax, niitTax, stateTax, stateRate, isShortTerm, filingStatus, stateName, annualWithdrawal);

            // Update compliance fee header
            document.getElementById('complianceFeeHeader').textContent = `(${complianceFee}%)`;

            // Generate projections
            console.log('Generating projections...');
            traditionalProjections = generateTraditionalProjections(age, growthPeriod, assetValue, totalUpfrontTax, rateOfReturn, annualWithdrawal, filingStatus, stateRate);
            method453Projections = generate453Projections(age, growthPeriod, assetValue, complianceFeeRate, rateOfReturn, annualWithdrawal, filingStatus, stateRate);

            const traditionalFinalValue = traditionalProjections.length > 0 ? traditionalProjections[traditionalProjections.length - 1].netEnding : 0;
            const method453FinalValue = method453Projections.length > 0 ? method453Projections[method453Projections.length - 1].netEnding : 0;
            const finalAdvantage = method453FinalValue - traditionalFinalValue;

            // Calculate total taxes paid over lifetime
            const traditionalTotalTax = totalUpfrontTax + traditionalProjections.reduce((sum, p) => sum + p.tax, 0);
            const method453TotalTax = method453Projections.reduce((sum, p) => sum + p.tax, 0);
            const taxSavings = traditionalTotalTax - method453TotalTax;

            // Get Year 1 net proceeds for both scenarios
            const traditionalYear1NetProceeds = afterTaxAmount;
            const method453Year1NetProceeds = method453Projections[0].netEnding;

            console.log('Projection results:', {
                traditionalFinalValue,
                method453FinalValue,
                finalAdvantage,
                taxSavings
            });

            // Update summary stats with new format
            document.getElementById('summary-trad-tax-bill').textContent = '-' + formatCurrency(totalUpfrontTax);
            document.getElementById('summary-trad-net-proceeds').textContent = formatCurrency(traditionalYear1NetProceeds);

            document.getElementById('summary-453-tax-bill').textContent = '$0';
            document.getElementById('summary-453-net-proceeds').textContent = formatCurrency(method453Year1NetProceeds);

            document.getElementById('summary-trad-final').textContent = formatCurrency(traditionalFinalValue);
            document.getElementById('summary-453-final').textContent = formatCurrency(method453FinalValue);
            document.getElementById('summary-additional-value').textContent = formatCurrency(finalAdvantage);

            // Display summary results
            document.getElementById('result-asset-value').textContent = formatCurrency(assetValue);
            document.getElementById('result-cost-basis').textContent = formatCurrency(costBasis);
            document.getElementById('result-capital-gain').textContent = formatCurrency(capitalGain);
            document.getElementById('result-gain-type').textContent = isShortTerm ? 'Short-term' : 'Long-term';
            document.getElementById('result-filing-status').textContent = formatFilingStatus(filingStatus);
            document.getElementById('result-state-name').textContent = stateName;
            document.getElementById('result-annual-withdrawal').textContent = formatCurrency(annualWithdrawal);
            document.getElementById('result-projection-period').textContent = growthPeriod + ' years';

            // Display Traditional Method results
            document.getElementById('result-trad-federal').textContent = formatCurrency(federalIncomeTax);
            document.getElementById('result-trad-state').textContent = formatCurrency(stateTax);
            document.getElementById('result-trad-niit').textContent = formatCurrency(niitTax);
            document.getElementById('result-trad-cap-gains').textContent = formatCurrency(capitalGainsTax);
            document.getElementById('result-trad-total').textContent = formatCurrency(totalUpfrontTax);
            document.getElementById('result-trad-after-tax').textContent = formatCurrency(afterTaxAmount);

            // Render table and chart
            console.log('Rendering table and chart...');
            renderProjectionTable(traditionalProjections, 'traditional');
            createComparisonChart(traditionalProjections, method453Projections, age);

            // Show results section
            const resultsSection = document.getElementById('results');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                console.log('Results section displayed');

                // Scroll to results
                setTimeout(() => {
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }

            console.log('Calculation completed successfully!');

        } catch (error) {
            console.error('Error during calculation:', error);
            alert('Error: ' + error.message + '\n\nPlease check all your inputs and try again.');
        }
    });

    console.log('Form handler setup complete');
});
