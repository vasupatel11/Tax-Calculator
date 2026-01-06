# DST Trust - 453 Tax Savings Calculator

A comprehensive web-based tax calculator that helps users understand the tax savings benefits of using a 453 structure compared to traditional asset sale methods.

## Features

### Input Fields
- **Asset Information**
  - Asset value
  - Purchase date (determines short-term vs long-term capital gains)
  - Cost basis

- **Personal Information**
  - Age (for life expectancy calculations)
  - Gender (affects life expectancy)
  - Tax filing status (Single, Married Filing Jointly, Married Filing Separately, Head of Household)
  - Annual gross income
  - State of residence (all 50 states with accurate tax rates)

- **Investment Projections**
  - Expected annual rate of return (default: 8%)
  - Annual income needed for living expenses

### Tax Calculations

The calculator computes:
- **Federal Income Tax** - Based on IRS 2025 tax brackets
- **Capital Gains Tax** - Short-term (< 1 year) vs Long-term rates
- **NIIT (Net Investment Income Tax)** - 3.8% on applicable income
- **State Tax** - Based on selected state's tax rate

### Comparison Models

#### Traditional Method (No 453)
- Immediate tax payment on full capital gain in year 1
- Reduced principal for investment
- Annual withdrawals for living expenses

#### 453 Structure Method
- Tax deferral over life expectancy
- Full asset value available for investment
- Spread tax payments over lifetime
- Annual withdrawals for living expenses + annual tax

### Life Expectancy Calculations
- Based on Social Security Administration's Actuarial Life Table (2024)
- Separate tables for male and female
- Interpolation for ages between table entries
- Detailed reference table page included

### Wealth Projections
- 10-year projection
- 20-year projection
- Life expectancy projection
- Shows total advantage of 453 structure

## Design

### Brand Colors
- Primary Blue: `#2b5f8f`
- Primary Gold: `#d4a958`
- Primary Red: `#c44d4d`
- Gray: `#6B7280`

### Features
- Modern, clean design
- Rounded buttons and cards
- Responsive layout for mobile devices
- Smooth animations and transitions
- Easy-to-read result cards
- Highlighted 453 structure benefits

## Files

- `index.html` - Main calculator interface
- `life-expectancy-table.html` - Reference page for Social Security life expectancy data
- `styles.css` - All styling with brand colors
- `script.js` - Tax calculation logic and algorithms

## Tax Tables Included

### IRS Tax Brackets 2025
- All filing statuses
- Progressive tax calculation
- Accurate bracket thresholds

### Capital Gains Tax Brackets 2025
- Long-term capital gains (0%, 15%, 20%)
- Short-term treated as ordinary income
- Filing status-specific thresholds

### NIIT Thresholds
- $200,000 for Single and Head of Household
- $250,000 for Married Filing Jointly
- $125,000 for Married Filing Separately

### State Tax Rates
- All 50 states included
- Tax-free states: AK, FL, NV, SD, TN, TX, WA, WY
- Rates from 2.9% (North Dakota) to 13.3% (California)

## How to Use

1. Open `index.html` in a web browser
2. Fill in all required fields:
   - Enter your asset details
   - Provide personal information
   - Set investment parameters
3. Click "Calculate Tax Savings"
4. Review comprehensive results showing:
   - Tax breakdown
   - Life expectancy
   - Comparison between methods
   - Wealth projections
5. Use "View Life Expectancy Table" button to see detailed actuarial data

## Technical Details

### Calculations
- **Life Expectancy**: Linear interpolation between SSA table values
- **Federal Tax**: Progressive bracket calculation
- **Capital Gains**: Separate logic for short-term vs long-term
- **NIIT**: Applied when Modified Adjusted Gross Income exceeds thresholds
- **Future Value**: Compound interest with annual withdrawals

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and tablet
- No external dependencies required

## Future Enhancements

Potential additions mentioned for future development:
- Charts and graphs for visual comparison
- Detailed year-by-year breakdown
- PDF report generation
- Additional investment scenarios
- Monte Carlo simulations for market volatility

## About DST Trust

This calculator is designed to help clients understand the potential tax benefits of using a 453 structure for asset sales. Always consult with a qualified tax professional before making financial decisions.
