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

// Get life expectancy based on age and gender
function getLifeExpectancy(age, gender) {
    const table = LIFE_EXPECTANCY_TABLE[gender];
    if (!table) return 0;

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

// Generate year-by-year projections for Traditional scenario
function generateTraditionalProjections(startAge, yearsRemaining, startingAsset, rateOfReturn, lifestyleWithdrawal, filingStatus, stateRate) {
    const projections = [];
    let currentAsset = startingAsset;

    for (let year = 0; year < yearsRemaining; year++) {
        const age = startAge + year;
        const assetBeginning = currentAsset;
        const growth = assetBeginning * rateOfReturn;

        // Tax is calculated on the withdrawal amount only (as if it's their only income)
        const withdrawalTax = calculateFederalTax(lifestyleWithdrawal, filingStatus) + (lifestyleWithdrawal * stateRate);

        const netEnding = assetBeginning + growth - lifestyleWithdrawal - withdrawalTax;

        projections.push({
            age: age,
            assetBeginning: assetBeginning,
            growth: growth,
            lifestyleWithdrawal: lifestyleWithdrawal,
            tax: withdrawalTax,
            netEnding: netEnding > 0 ? netEnding : 0
        });

        currentAsset = netEnding > 0 ? netEnding : 0;

        if (currentAsset <= 0) break;
    }

    return projections;
}

// Generate year-by-year projections for 453 scenario
function generate453Projections(startAge, yearsRemaining, startingAsset, rateOfReturn, lifestyleWithdrawal, filingStatus, stateRate) {
    const projections = [];
    let currentAsset = startingAsset;
    const complianceFeeRate = 0.015; // 1.5%

    for (let year = 0; year < yearsRemaining; year++) {
        const age = startAge + year;
        const assetBeginning = currentAsset;
        const growth = assetBeginning * rateOfReturn;
        const complianceFee = assetBeginning * complianceFeeRate;

        // Tax is calculated on the withdrawal amount only
        const withdrawalTax = calculateFederalTax(lifestyleWithdrawal, filingStatus) + (lifestyleWithdrawal * stateRate);

        const netEnding = assetBeginning + growth - complianceFee - lifestyleWithdrawal - withdrawalTax;

        projections.push({
            age: age,
            assetBeginning: assetBeginning,
            growth: growth,
            complianceFee: complianceFee,
            lifestyleWithdrawal: lifestyleWithdrawal,
            tax: withdrawalTax,
            netEnding: netEnding > 0 ? netEnding : 0
        });

        currentAsset = netEnding > 0 ? netEnding : 0;

        if (currentAsset <= 0) break;
    }

    return projections;
}

// Render projection table
function renderProjectionTable(projections, scenario) {
    const tbody = document.getElementById('projectionTableBody');
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
                    backgroundColor: 'rgba(196, 77, 77, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Net Ending - Carmel Estate 453',
                    data: method453Values,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
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
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Ending Value',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCompactCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Toggle scenario buttons
document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
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
document.getElementById('taxCalculatorForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const assetValue = parseFloat(document.getElementById('assetValue').value);
    const costBasis = parseFloat(document.getElementById('costBasis').value);
    const isShortTerm = document.querySelector('input[name="shortTermGain"]:checked').value === 'yes';
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const filingStatus = document.getElementById('filingStatus').value;
    const annualIncome = parseFloat(document.getElementById('annualIncome').value);
    const stateRate = parseFloat(document.getElementById('state').value) / 100;
    const rateOfReturn = parseFloat(document.getElementById('rateOfReturn').value) / 100;
    const annualWithdrawal = parseFloat(document.getElementById('annualWithdrawal').value);

    // Calculate capital gain
    const capitalGain = assetValue - costBasis;

    // Get life expectancy
    const lifeExpectancy = getLifeExpectancy(age, gender);
    const yearsRemaining = Math.round(lifeExpectancy);

    // Calculate upfront taxes for Traditional Method
    const capitalGainsTax = calculateCapitalGainsTax(capitalGain, annualIncome, filingStatus, isShortTerm);
    const niitTax = calculateNIIT(capitalGain, annualIncome, filingStatus);
    const stateTax = capitalGain * stateRate;
    const federalIncomeTax = calculateFederalTax(annualIncome, filingStatus);

    const totalUpfrontTax = capitalGainsTax + niitTax + stateTax;
    const afterTaxAmount = assetValue - totalUpfrontTax;

    // Generate projections
    traditionalProjections = generateTraditionalProjections(age, yearsRemaining, afterTaxAmount, rateOfReturn, annualWithdrawal, filingStatus, stateRate);
    method453Projections = generate453Projections(age, yearsRemaining, assetValue, rateOfReturn, annualWithdrawal, filingStatus, stateRate);

    const traditionalFinalValue = traditionalProjections.length > 0 ? traditionalProjections[traditionalProjections.length - 1].netEnding : 0;
    const method453FinalValue = method453Projections.length > 0 ? method453Projections[method453Projections.length - 1].netEnding : 0;
    const finalAdvantage = method453FinalValue - traditionalFinalValue;

    // Calculate total taxes paid over lifetime
    const traditionalTotalTax = totalUpfrontTax + traditionalProjections.reduce((sum, p) => sum + p.tax, 0);
    const method453TotalTax = method453Projections.reduce((sum, p) => sum + p.tax, 0);
    const taxSavings = traditionalTotalTax - method453TotalTax;

    // Update summary stats
    document.getElementById('summary-upfront-tax').textContent = formatCurrency(totalUpfrontTax);
    document.getElementById('summary-453-savings').textContent = formatCurrency(taxSavings);
    document.getElementById('summary-final-advantage').textContent = formatCurrency(finalAdvantage);

    // Display basic results
    document.getElementById('result-capital-gain').textContent = formatCurrency(capitalGain);
    document.getElementById('result-holding-period').textContent = isShortTerm ? 'Less than 1 year' : 'More than 1 year';
    document.getElementById('result-gain-type').textContent = isShortTerm ? 'Short-term' : 'Long-term';

    document.getElementById('result-age').textContent = age;
    document.getElementById('result-life-expectancy').textContent = lifeExpectancy.toFixed(1) + ' years';
    document.getElementById('result-years-remaining').textContent = yearsRemaining + ' years';

    document.getElementById('result-trad-federal').textContent = formatCurrency(federalIncomeTax);
    document.getElementById('result-trad-state').textContent = formatCurrency(stateTax);
    document.getElementById('result-trad-niit').textContent = formatCurrency(niitTax);
    document.getElementById('result-trad-cap-gains').textContent = formatCurrency(capitalGainsTax);
    document.getElementById('result-trad-total').textContent = formatCurrency(totalUpfrontTax);
    document.getElementById('result-trad-after-tax').textContent = formatCurrency(afterTaxAmount);

    document.getElementById('result-453-deferral').textContent = formatCurrency(totalUpfrontTax);
    document.getElementById('result-453-payment').textContent = 'N/A';
    document.getElementById('result-453-annual-tax').textContent = formatCurrency(method453TotalTax / yearsRemaining);
    document.getElementById('result-453-savings').textContent = formatCurrency(taxSavings);

    document.getElementById('comp-trad-start').textContent = formatCurrency(afterTaxAmount);
    document.getElementById('comp-trad-10y').textContent = traditionalProjections.length >= 10 ? formatCurrency(traditionalProjections[9].netEnding) : 'N/A';
    document.getElementById('comp-trad-20y').textContent = traditionalProjections.length >= 20 ? formatCurrency(traditionalProjections[19].netEnding) : 'N/A';
    document.getElementById('comp-trad-life').textContent = formatCurrency(traditionalFinalValue);

    document.getElementById('comp-453-start').textContent = formatCurrency(assetValue);
    document.getElementById('comp-453-10y').textContent = method453Projections.length >= 10 ? formatCurrency(method453Projections[9].netEnding) : 'N/A';
    document.getElementById('comp-453-20y').textContent = method453Projections.length >= 20 ? formatCurrency(method453Projections[19].netEnding) : 'N/A';
    document.getElementById('comp-453-life').textContent = formatCurrency(method453FinalValue);

    document.getElementById('total-advantage').textContent = formatCurrency(finalAdvantage);

    // Render table and chart
    renderProjectionTable(traditionalProjections, 'traditional');
    createComparisonChart(traditionalProjections, method453Projections, age);

    // Show results section
    document.getElementById('results').style.display = 'block';

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
