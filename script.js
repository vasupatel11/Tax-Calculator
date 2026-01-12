/**
 * DST Trust 453 Tax Calculator
 *
 * This script uses centralized tax data from taxData.js
 * All tax brackets and rates for 2026 are loaded from that file.
 */

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

/**
 * Tax calculation functions are imported from taxData.js:
 * - calculateFederalTax(income, filingStatus)
 * - calculateCapitalGainsTax(capitalGain, filingStatus)
 * - calculateNIIT(netInvestmentIncome, modifiedAGI, filingStatus)
 * - calculateStateTax(income, state)
 * - getStateTaxRate(state)
 * - formatCurrency(amount)
 * - formatPercentage(rate)
 * - formatFilingStatus(status)
 */

// Wrapper for capital gains that handles short-term vs long-term
function calculateCapitalGainsTaxWrapper(capitalGain, income, filingStatus, isShortTerm) {
    if (isShortTerm) {
        // Short-term capital gains are taxed as ordinary income
        return calculateFederalTax(income + capitalGain, filingStatus) - calculateFederalTax(income, filingStatus);
    }
    // Long-term capital gains use special brackets
    return calculateCapitalGainsTax(capitalGain, filingStatus);
}

// Wrapper for NIIT to match old signature
function calculateNIITWrapper(capitalGain, income, filingStatus) {
    const modifiedAGI = income + capitalGain;
    return calculateNIIT(capitalGain, modifiedAGI, filingStatus);
}

// Note: formatCurrency is now imported from taxData.js

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

    // Federal Capital Gains Tax with progressive breakdown
    const gainType = isShortTerm ? 'Short-term' : 'Long-term';
    const capGainsRate = ((capitalGainsTax / capitalGain) * 100).toFixed(2);

    row = tbody.insertRow();
    row.innerHTML = `
        <td>Federal Capital Gains Tax (${gainType})</td>
        <td>${capGainsRate}% effective rate (progressive brackets apply)</td>
        <td>${formatCurrency(capitalGainsTax)}</td>
    `;

    // Add progressive bracket explanation for long-term gains
    if (!isShortTerm && capitalGain > 100000) {
        const brackets = CAPITAL_GAINS_BRACKETS_2026[filingStatus];
        if (brackets) {
            let remainingGain = capitalGain;
            let bracketDetails = '<div style="font-size: 0.85em; color: var(--text-tertiary); margin-left: 1rem;">';

            brackets.forEach((bracket, idx) => {
                if (remainingGain > 0) {
                    const bracketSize = Math.min(remainingGain, bracket.max - bracket.min);
                    const bracketTax = bracketSize * bracket.rate;
                    if (bracketSize > 0) {
                        const rangeText = bracket.max === Infinity
                            ? `Above ${formatCurrency(bracket.min)}`
                            : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`;
                        bracketDetails += `• ${rangeText} @ ${(bracket.rate * 100)}%: ${formatCurrency(bracketTax)}<br>`;
                        remainingGain -= bracketSize;
                    }
                }
            });
            bracketDetails += '</div>';

            row = tbody.insertRow();
            row.innerHTML = `
                <td colspan="3" style="background: rgba(43, 95, 143, 0.05); padding: 0.75rem; font-size: 0.9em;">
                    <strong>Progressive Calculation:</strong><br>${bracketDetails}
                </td>
            `;
        }
    }

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

    // Update summary
    const totalTax = capitalGainsTax + niitTax + stateTax;
    const effectiveRate = (totalTax / assetValue) * 100;
    const netProceeds = assetValue - totalTax;

    document.getElementById('breakdown-total-tax').textContent = formatCurrency(totalTax);
    document.getElementById('breakdown-effective-rate').textContent = effectiveRate.toFixed(2) + '%';
    document.getElementById('breakdown-net-proceeds').textContent = formatCurrency(netProceeds);
}

// Helper function to format filing status
// Note: formatFilingStatus is now imported from taxData.js

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
                <td class="growth-col">${formatCurrency(row.growth)}</td>
                <td class="compliance-col">${formatCurrency(row.complianceFee)}</td>
                <td>${formatCurrency(row.lifestyleWithdrawal)}</td>
                <td>${formatCurrency(row.tax)}</td>
                <td><strong>${formatCurrency(row.netEnding)}</strong></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${row.age}</td>
                <td>${formatCurrency(row.assetBeginning)}</td>
                <td class="growth-col">${formatCurrency(row.growth)}</td>
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
    const valueDifference = method453Values.map((val, idx) => val - traditionalValues[idx]);

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
                    pointBorderWidth: 2,
                    yAxisID: 'y'
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
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Value Added (453 vs Traditional)',
                    data: valueDifference,
                    type: 'bar',
                    backgroundColor: 'rgba(16, 185, 129, 0.3)',
                    borderColor: 'rgba(16, 185, 129, 0.6)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    order: 1
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
                    },
                    position: 'left'
                },
                y1: {
                    title: {
                        display: true,
                        text: 'Value Added',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#10b981'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCompactCurrency(value);
                        },
                        color: '#10b981'
                    },
                    grid: {
                        display: false
                    },
                    position: 'right'
                }
            }
        }
    });
}

// Populate Lifestyle Withdrawal Tax Section
function populateWithdrawalTaxSection(annualWithdrawal, filingStatus, stateRate, stateName) {
    const section = document.getElementById('withdrawalTaxSection');

    if (!section || annualWithdrawal <= 0) {
        if (section) section.style.display = 'none';
        return;
    }

    // Calculate taxes on withdrawal (assuming it's the only income)
    const federalTax = calculateFederalTax(annualWithdrawal, filingStatus);
    const stateTaxAmount = annualWithdrawal * stateRate;
    const totalTax = federalTax + stateTaxAmount;
    const effectiveRate = (totalTax / annualWithdrawal) * 100;
    const netAmount = annualWithdrawal - totalTax;

    // Update all fields
    document.getElementById('withdrawal-amount').textContent = formatCurrency(annualWithdrawal);
    document.getElementById('withdrawal-federal-tax').textContent = formatCurrency(federalTax);
    document.getElementById('withdrawal-state-tax').textContent = formatCurrency(stateTaxAmount);
    document.getElementById('withdrawal-total-tax').textContent = formatCurrency(totalTax);
    document.getElementById('withdrawal-tax-rate').textContent = effectiveRate.toFixed(2) + '%';
    document.getElementById('withdrawal-net-amount').textContent = formatCurrency(netAmount);

    // Show the section
    section.style.display = 'block';
}

// Generate AI-Powered Analysis
function generateAIAnalysis(inputs, results) {
    const {
        assetValue,
        capitalGain,
        growthPeriod,
        annualWithdrawal,
        rateOfReturn,
        age,
        gender,
        lifeExpectancy
    } = inputs;

    const {
        totalUpfrontTax,
        traditionalFinalValue,
        method453FinalValue,
        additionalValue
    } = results;

    const taxSavingsPercent = ((additionalValue / assetValue) * 100).toFixed(1);
    const yearlyGrowthProtected = growthPeriod;
    const compoundBenefit = (((method453FinalValue / traditionalFinalValue) - 1) * 100).toFixed(1);

    // Calculate generational impact (assuming 30 years per generation)
    const generationsImpacted = Math.floor(lifeExpectancy / 30) + 1;

    const analysisText = `Based on your ${formatCurrency(assetValue)} asset sale with ${formatCurrency(capitalGain)} in capital gains, the DST Trust 453 structure offers compelling advantages for long-term wealth preservation and multi-generational value creation. By deferring ${formatCurrency(totalUpfrontTax)} in immediate taxes, you preserve ${taxSavingsPercent}% more capital to work for you during your ${yearlyGrowthProtected}-year tax-protected growth period. This tax deferral strategy, combined with your ${(rateOfReturn * 100).toFixed(1)}% annual return and ${formatCurrency(annualWithdrawal)} in lifestyle withdrawals, creates ${formatCurrency(additionalValue)} in additional wealth—a ${compoundBenefit}% enhancement over traditional liquidation. The power of tax-protected compounding during these critical growth years means your wealth continues to multiply unencumbered by immediate tax obligations, creating sustainable value that can benefit ${generationsImpacted} ${generationsImpacted > 1 ? 'generations' : 'generation'} of your family. This structure transforms what would be a one-time tax burden into a strategic wealth multiplication tool, ensuring that more of your hard-earned capital stays invested and working to build lasting family wealth rather than being immediately depleted by taxation.`;

    const analysisContainer = document.querySelector('.ai-analysis-text');
    if (analysisContainer) {
        analysisContainer.textContent = analysisText;
    }
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

// PDF Generation Function
function generateClientReport() {
    console.log('PDF generation started');

    // Check if results are available
    if (!traditionalProjections || traditionalProjections.length === 0 || !method453Projections || method453Projections.length === 0) {
        alert('Please calculate tax savings first before generating a report.');
        return;
    }

    console.log('Projections available:', {
        traditional: traditionalProjections.length,
        method453: method453Projections.length
    });

    // Prompt for client name
    const clientName = prompt('Please enter the client name for the report:');
    if (!clientName || clientName.trim() === '') {
        alert('Client name is required to generate the report.');
        return;
    }

    // Generate serial number (timestamp-based)
    const serialNumber = Date.now().toString().slice(-6);
    const fileName = `${clientName.trim().replace(/\s+/g, '_')}_${serialNumber}.pdf`;

    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library not loaded. Please refresh the page and try again.');
        }

        console.log('jsPDF library found');

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        console.log('jsPDF initialized');

        // Check if autoTable is available
        if (typeof doc.autoTable !== 'function') {
            throw new Error('jsPDF autoTable plugin not loaded. Please refresh the page and try again.');
        }

        console.log('autoTable plugin found');

        // Check if formatCurrency is available
        if (typeof formatCurrency !== 'function') {
            throw new Error('formatCurrency function not available. Please refresh the page and try again.');
        }

        console.log('formatCurrency function available');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = 20;

        // Brand colors
        const brandBlue = [43, 95, 143];
        const brandGold = [212, 169, 88];
        const textPrimary = [26, 26, 26];
        const textSecondary = [107, 114, 128];

        // Helper function to check page break
        function checkPageBreak(neededSpace) {
            if (yPos + neededSpace > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        }

        // Header with logo area and client info
        doc.setFillColor(...brandBlue);
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('DST TRUST', margin, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('453 Tax Savings Analysis Report', margin, 28);

        doc.setFontSize(10);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, 36);
        doc.text(`Report #: ${serialNumber}`, pageWidth - margin - 40, 36);

        // Client Name Section
        yPos = 55;
        doc.setFillColor(...brandGold);
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Client: ${clientName.toUpperCase()}`, margin + 5, yPos + 5);

        yPos += 20;

        // Get all the calculated values from the DOM
        const assetValue = parseFloat(document.getElementById('result-asset-value').textContent.replace(/[$,]/g, '')) || 0;
        const costBasis = parseFloat(document.getElementById('result-cost-basis').textContent.replace(/[$,]/g, '')) || 0;
        const capitalGain = parseFloat(document.getElementById('result-capital-gain').textContent.replace(/[$,]/g, '')) || 0;
        const totalTax = parseFloat(document.getElementById('result-total-tax').textContent.replace(/[$,]/g, '')) || 0;
        const afterTaxAmount = parseFloat(document.getElementById('result-trad-after-tax').textContent.replace(/[$,]/g, '')) || 0;

        const trad453TotalTax = parseFloat(document.getElementById('result-453-total-tax').textContent.replace(/[$,]/g, '')) || 0;
        const taxSavings = parseFloat(document.getElementById('result-tax-savings').textContent.replace(/[$,]/g, '')) || 0;
        const traditionalFinalValue = parseFloat(document.getElementById('result-trad-final').textContent.replace(/[$,]/g, '')) || 0;
        const method453FinalValue = parseFloat(document.getElementById('result-453-final').textContent.replace(/[$,]/g, '')) || 0;
        const finalAdvantage = parseFloat(document.getElementById('result-final-advantage').textContent.replace(/[$,]/g, '')) || 0;

        // Executive Summary Section
        doc.setTextColor(...brandBlue);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EXECUTIVE SUMMARY', margin, yPos);
        yPos += 8;

        doc.setDrawColor(...brandBlue);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // Summary table
        const summaryData = [
            ['Asset Value', formatCurrency(assetValue)],
            ['Cost Basis', formatCurrency(costBasis)],
            ['Capital Gain', formatCurrency(capitalGain)],
            ['Traditional Sale - Total Tax', formatCurrency(totalTax)],
            ['Traditional Sale - After-Tax Amount', formatCurrency(afterTaxAmount)],
            ['DST Trust 453 - Total Lifetime Tax', formatCurrency(trad453TotalTax)],
            ['Tax Savings with 453 Structure', formatCurrency(taxSavings)],
            ['Traditional - Final Value', formatCurrency(traditionalFinalValue)],
            ['DST Trust 453 - Final Value', formatCurrency(method453FinalValue)],
            ['Total Financial Advantage', formatCurrency(finalAdvantage)]
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: {
                fillColor: brandBlue,
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textPrimary
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: 90, fontStyle: 'bold' },
                1: { cellWidth: 'auto', halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Tax Breakdown Section
        checkPageBreak(40);
        doc.setTextColor(...brandBlue);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TRADITIONAL SALE - TAX BREAKDOWN', margin, yPos);
        yPos += 8;

        doc.setDrawColor(...brandBlue);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // Get tax breakdown from table
        const taxBreakdownRows = [];
        const taxTableBody = document.querySelector('#taxBreakdownTable tbody');
        if (taxTableBody) {
            const rows = taxTableBody.querySelectorAll('tr');
            rows.forEach(row => {
                if (row.cells.length >= 3 && !row.querySelector('[colspan="3"]')) {
                    const category = row.cells[0].textContent.trim();
                    const rate = row.cells[1].textContent.trim();
                    const amount = row.cells[2].textContent.trim();
                    if (category && !category.includes('Progressive Calculation')) {
                        taxBreakdownRows.push([category, rate, amount]);
                    }
                }
            });
        }

        if (taxBreakdownRows.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Tax Category', 'Rate/Details', 'Amount']],
                body: taxBreakdownRows,
                theme: 'striped',
                headStyles: {
                    fillColor: brandBlue,
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: textPrimary
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                columnStyles: {
                    0: { cellWidth: 70 },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 'auto', halign: 'right' }
                },
                margin: { left: margin, right: margin }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Withdrawal Tax Analysis
        const withdrawalSection = document.getElementById('withdrawalTaxSection');
        if (withdrawalSection && withdrawalSection.style.display !== 'none') {
            checkPageBreak(40);

            doc.setTextColor(...brandBlue);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('LIFESTYLE WITHDRAWAL TAX ANALYSIS', margin, yPos);
            yPos += 8;

            doc.setDrawColor(...brandBlue);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 6;

            const withdrawalData = [
                ['Annual Withdrawal Amount', document.getElementById('withdrawal-amount')?.textContent || '$0'],
                ['Federal Income Tax', document.getElementById('withdrawal-federal-tax')?.textContent || '$0'],
                ['State Income Tax', document.getElementById('withdrawal-state-tax')?.textContent || '$0'],
                ['Total Tax on Withdrawal', document.getElementById('withdrawal-total-tax')?.textContent || '$0'],
                ['Effective Tax Rate', document.getElementById('withdrawal-tax-rate')?.textContent || '0%'],
                ['Net After-Tax Withdrawal', document.getElementById('withdrawal-net-amount')?.textContent || '$0']
            ];

            doc.autoTable({
                startY: yPos,
                body: withdrawalData,
                theme: 'plain',
                bodyStyles: {
                    fontSize: 9,
                    textColor: textPrimary
                },
                columnStyles: {
                    0: { cellWidth: 90, fontStyle: 'bold' },
                    1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
                },
                margin: { left: margin, right: margin },
                didParseCell: function(data) {
                    if (data.row.index === 3 || data.row.index === 5) {
                        data.cell.styles.fillColor = [248, 249, 250];
                    }
                }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Year-by-Year Projection - Traditional Scenario
        checkPageBreak(60);
        doc.setTextColor(...brandBlue);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('YEAR-BY-YEAR PROJECTION - TRADITIONAL SCENARIO', margin, yPos);
        yPos += 8;

        doc.setDrawColor(...brandBlue);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // Traditional projections table
        const maxRows = Math.min(20, traditionalProjections.length);
        const tradProjectionData = traditionalProjections.slice(0, maxRows).map(row => {
            try {
                return [
                    String(row.age || ''),
                    formatCurrency(row.assetBeginning || 0),
                    formatCurrency(row.growth || 0),
                    formatCurrency(row.lifestyleWithdrawal || 0),
                    formatCurrency(row.tax || 0),
                    formatCurrency(row.netEnding || 0)
                ];
            } catch (error) {
                console.error('Error formatting row:', row, error);
                return ['Error', '$0', '$0', '$0', '$0', '$0'];
            }
        });

        console.log('Traditional projection data prepared:', tradProjectionData.length, 'rows');

        doc.autoTable({
            startY: yPos,
            head: [['Age', 'Asset (Beg)', 'Growth', 'Withdrawal', 'Tax', 'Net Ending']],
            body: tradProjectionData,
            theme: 'striped',
            headStyles: {
                fillColor: [196, 77, 77],
                textColor: 255,
                fontSize: 8,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 7,
                textColor: textPrimary
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center' },
                1: { cellWidth: 30, halign: 'right', fontSize: 7 },
                2: { cellWidth: 25, halign: 'right', fontSize: 7 },
                3: { cellWidth: 30, halign: 'right', fontSize: 7 },
                4: { cellWidth: 25, halign: 'right', fontSize: 7 },
                5: { cellWidth: 32, halign: 'right', fontSize: 7, fontStyle: 'bold' }
            },
            margin: { left: margin, right: margin }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Year-by-Year Projection - DST Trust 453 Scenario
        checkPageBreak(60);
        doc.setTextColor(...brandBlue);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('YEAR-BY-YEAR PROJECTION - DST TRUST 453 SCENARIO', margin, yPos);
        yPos += 8;

        doc.setDrawColor(...brandBlue);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // 453 projections table
        const max453Rows = Math.min(20, method453Projections.length);
        const method453ProjectionData = method453Projections.slice(0, max453Rows).map(row => {
            try {
                return [
                    String(row.age || ''),
                    formatCurrency(row.assetBeginning || 0),
                    formatCurrency(row.growth || 0),
                    formatCurrency(row.complianceFee || 0),
                    formatCurrency(row.lifestyleWithdrawal || 0),
                    formatCurrency(row.tax || 0),
                    formatCurrency(row.netEnding || 0)
                ];
            } catch (error) {
                console.error('Error formatting 453 row:', row, error);
                return ['Error', '$0', '$0', '$0', '$0', '$0', '$0'];
            }
        });

        console.log('453 projection data prepared:', method453ProjectionData.length, 'rows');

        doc.autoTable({
            startY: yPos,
            head: [['Age', 'Asset (Beg)', 'Growth', 'Compliance', 'Withdrawal', 'Tax', 'Net Ending']],
            body: method453ProjectionData,
            theme: 'striped',
            headStyles: {
                fillColor: brandGold,
                textColor: 255,
                fontSize: 8,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 7,
                textColor: textPrimary
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 27, halign: 'right', fontSize: 7 },
                2: { cellWidth: 22, halign: 'right', fontSize: 7 },
                3: { cellWidth: 22, halign: 'right', fontSize: 7 },
                4: { cellWidth: 27, halign: 'right', fontSize: 7 },
                5: { cellWidth: 22, halign: 'right', fontSize: 7 },
                6: { cellWidth: 30, halign: 'right', fontSize: 7, fontStyle: 'bold' }
            },
            margin: { left: margin, right: margin }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // AI Analysis Section
        const aiAnalysisText = document.querySelector('.ai-analysis-text')?.textContent;
        if (aiAnalysisText && aiAnalysisText.trim()) {
            checkPageBreak(40);

            doc.setTextColor(...brandBlue);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('AI-POWERED WEALTH STRATEGY ANALYSIS', margin, yPos);
            yPos += 8;

            doc.setDrawColor(...brandGold);
            doc.setLineWidth(1);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setTextColor(...textPrimary);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const splitText = doc.splitTextToSize(aiAnalysisText.trim(), pageWidth - 2 * margin);
            splitText.forEach(line => {
                checkPageBreak(10);
                doc.text(line, margin, yPos);
                yPos += 5;
            });
        }

        // Footer on last page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...textSecondary);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'This report is for informational purposes only. Consult with a qualified tax professional.',
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth - margin,
                pageHeight - 10,
                { align: 'right' }
            );
            doc.text(
                '© 2025 DST Trust. All rights reserved.',
                margin,
                pageHeight - 10
            );
        }

        // Save the PDF
        doc.save(fileName);
        alert(`Report generated successfully!\nFile name: ${fileName}`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        alert(`An error occurred while generating the PDF:\n\n${error.message}\n\nPlease check the browser console for more details or try refreshing the page.`);
    }
}

// Helper function to safely get text content from element
function safeGetElementText(elementId, defaultValue = '$0') {
    try {
        const element = document.getElementById(elementId);
        if (element && element.textContent) {
            return element.textContent.trim();
        }
        console.warn(`Element not found or empty: ${elementId}`);
        return defaultValue;
    } catch (error) {
        console.error(`Error getting element ${elementId}:`, error);
        return defaultValue;
    }
}

// Session Management Functions
function saveSessionData(formData) {
    try {
        localStorage.setItem('taxCalculatorSession', JSON.stringify(formData));
        console.log('Session data saved');
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

function loadSessionData() {
    try {
        const data = localStorage.getItem('taxCalculatorSession');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading session:', error);
        return null;
    }
}

function populateFormWithSessionData(data) {
    if (!data) return;

    // Populate all form fields
    Object.keys(data).forEach(key => {
        const field = document.getElementById(key);
        if (field) {
            if (field.type === 'radio') {
                const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else if (field.tagName === 'SELECT') {
                field.value = data[key];
            } else {
                field.value = data[key];
            }
        }
    });

    console.log('Form populated with session data');
}

// Reload Session Button Handler
document.addEventListener('DOMContentLoaded', function() {
    const reloadBtn = document.getElementById('reloadSessionBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
            const sessionData = loadSessionData();
            if (sessionData) {
                populateFormWithSessionData(sessionData);
                alert('Last session data loaded successfully!');
            } else {
                alert('No previous session data found.');
            }
        });
    }
});

// Download Report Button Handler
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            generateClientReport();
        });
    }
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

            // Save session data to localStorage
            const formData = {
                assetValue: assetValue.toString(),
                costBasis: costBasis.toString(),
                shortTermGain: shortTermRadio.value,
                age: age.toString(),
                gender: gender,
                filingStatus: filingStatus,
                annualIncome: annualIncome.toString(),
                state: stateSelect.value,
                rateOfReturn: document.getElementById('rateOfReturn').value,
                annualWithdrawal: annualWithdrawal.toString(),
                growthPeriod: growthPeriod.toString(),
                complianceFee: complianceFee.toString()
            };
            saveSessionData(formData);

            // Calculate capital gain
            const capitalGain = assetValue - costBasis;
            if (capitalGain < 0) {
                alert('Cost Basis cannot be greater than Asset Value');
                return;
            }

            console.log('Life expectancy:', lifeExpectancy, 'Growth period:', growthPeriod);

            // Calculate upfront taxes for Traditional Method
            const capitalGainsTax = calculateCapitalGainsTaxWrapper(capitalGain, annualIncome, filingStatus, isShortTerm);
            const niitTax = calculateNIITWrapper(capitalGain, annualIncome, filingStatus);
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

            // Populate withdrawal tax section
            populateWithdrawalTaxSection(annualWithdrawal, filingStatus, stateRate, stateName);

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

            // Generate AI analysis
            generateAIAnalysis(
                {
                    assetValue,
                    capitalGain,
                    growthPeriod,
                    annualWithdrawal,
                    rateOfReturn,
                    age,
                    gender,
                    lifeExpectancy
                },
                {
                    totalUpfrontTax,
                    traditionalFinalValue,
                    method453FinalValue,
                    additionalValue: finalAdvantage
                }
            );

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
