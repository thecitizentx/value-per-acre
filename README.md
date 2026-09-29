# Value per Acre — The Cost of Place

A small, responsive calculator for comparing value per taxable acre with value per gross development acre. Two editable scenarios make the effect of the denominator visible.

**Public calculator:** [thecitizentx.github.io/value-per-acre/](https://thecitizentx.github.io/value-per-acre/)

Published from [thecitizentx/value-per-acre](https://github.com/thecitizentx/value-per-acre) and listed alongside the other tools in [The Citizen's visuals repository](https://github.com/thecitizentx/thecitizen_visuals).

Plain HTML, CSS, and JavaScript. No build step, packages, account, API keys, external fonts, or network services are required. Calculations stay in the browser. Inputs are not transmitted or persisted; reloading restores the examples.

## Files

```text
value-per-acre/
├── index.html
├── styles.css
├── calculator.js
├── app.js
├── banner.html
├── favicon.svg
├── .nojekyll
├── README.md
├── assets/
│   └── value-per-acre-cta.png
└── tests/
    └── calculator.test.cjs
```

`calculator.js` contains input validation, calculations, number formatting, illustrative defaults, and the text summary. `app.js` connects those functions to the page. All assets use relative paths, including under a GitHub project URL.

## Open locally

Unzip the download and open `index.html` in a current browser. No installation is necessary. Automatic copying depends on browser clipboard permissions; if unavailable, the page provides a selected text summary for manual copying.

An optional local server also works. From this folder, if Python 3 is installed:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy with GitHub Pages

1. Create a GitHub repository, for example `value-per-acre`. Use a public repository for GitHub Free.
2. Upload the **contents** of this folder to the repository's `main` branch. Keep `index.html` at the repository root, not inside a second `value-per-acre` folder. Include the empty `.nojekyll` file to disable Jekyll processing. If your file picker hides dotfiles, create a file named `.nojekyll` in GitHub's editor.
3. Go to **Settings → Pages → Build and deployment**.
4. Set **Source** to **Deploy from a branch**. Select **main** and **/(root)**, then **Save**.
5. When deployment finishes, use the **Visit site** link in Pages settings. For a project repository, the default address is `https://YOUR-USERNAME.github.io/value-per-acre/`.

Future commits to the selected source publish updates. There is no custom build command or workflow to configure. If the page fails to appear, confirm the source branch/folder and that `index.html` is at its root, then inspect the repository's Actions tab for deployment errors.

References: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Call-to-action banner

The publication banner is included at `assets/value-per-acre-cta.png` (2172 × 724 pixels). `banner.html` is a responsive, clickable version linked to the calculator's public Citizen address.

For an article, insert the PNG and link it to `https://thecitizentx.github.io/value-per-acre/`. The image itself does not contain a clickable link.

Direct banner image: `https://thecitizentx.github.io/value-per-acre/assets/value-per-acre-cta.png`.

## Use the calculator

- Rename either scenario by editing its title.
- Enter the measured value in US dollars, taxable acreage, and four additional land categories. Enter `0` for a category that adds no land.
- Results update as you type. The acreage bar shows composition within each scenario; both bars span 100%, so their lengths do not compare absolute project sizes. Hover a segment for its acreage; assistive technology can read the full composition.
- Read the comparison table using consistent definitions for both scenarios. The displayed percentage is the change between denominators **within each scenario**, not the percentage difference between Scenario A and Scenario B.
- **Reset** restores that scenario's example. **Reset examples** restores both names and all inputs.
- **Copy summary** copies both scenarios, all acreage inputs, results, formulas, and the analytical caveat. Invalid inputs disable copying until corrected. A manual-copy panel is provided if clipboard access fails.

## Formulas and meaning

Let `V` be the measured value, `AT` taxable acreage, `AR` roads/right-of-way, `AD` drainage/detention, `AC` common/open space, and `AE` easements/other.

```text
Gross acreage:             AG = AT + AR + AD + AC + AE
Value per taxable acre:    VTA = V / AT
Value per gross acre:      VGA = V / AG
Percentage reduction:      ((VTA - VGA) / VTA) × 100
```

The percentage uses the taxable-acre result as its baseline. With a positive measured value it also equals `(AG - AT) / AG × 100`. It is therefore independent of the dollar amount and expresses the effect of the acreage denominator. It is not a symmetric percentage difference or the reverse percentage increase.

The numerator is held fixed within each scenario. If the measured value is zero, both per-acre rates are `$0`; the percentage is undefined and displayed as `N/A`. With a positive value and no additional land, the rates are equal and the percentage is `0.0%`.

Displayed dollar values round to at most two decimal places, acreage to four, and percentages to one. Calculations use unrounded rates. Tiny positive percentages display as `<0.1%`; percentages below 100% that would round to 100% display as `>99.9%`. A very small nonzero dollar rate may round to `$0`.

### Analytical caveat

**Results are only comparable when the acreage boundary is defined consistently.**

Count every acre once. The additional categories must be mutually exclusive and must exclude land already included in taxable acreage. A private drive, detention facility, common area, or easement may already lie within a taxable parcel. Its presence does not automatically make that land additional or non-taxable. The tool sums the entered areas; it cannot detect geographic overlaps or establish tax status.

Use the same measured-value definition (for example, assessed or taxable value), assessment date, and treatment of shared land across scenarios. Saleable acreage is not necessarily taxable acreage. If comparing gross development boundaries, use the appropriate measured value for each full boundary and document your scope. The 40-acre example assumes that its 28 acres are the taxable acres being measured.

This is a measure of value density. It does not estimate tax revenue, service costs, or net fiscal impact.

### Illustrative defaults

| Input / result | Scenario A | Scenario B |
| --- | ---: | ---: |
| Name | 40-acre neighborhood | 5-acre development |
| Measured value | $28,000,000 | $2,000,000 |
| Taxable acres | 28 | 2 |
| Roads / right-of-way | 5 | 1 |
| Drainage / detention | 4 | 0.75 |
| Common / open space | 3 | 1 |
| Easements / other | 0 | 0.25 |
| Gross acres | 40 | 5 |
| Value per taxable acre | $1,000,000 | $1,000,000 |
| Value per gross acre | $700,000 | $400,000 |
| Reduction using gross acreage | 30.0% | 60.0% |

All example values and category allocations are illustrative, not property records.

## Validation and accessibility

Taxable acreage must be greater than zero. All other numeric inputs must be zero or positive; blanks are treated as incomplete rather than silently assumed to be zero. Invalid fields have an inline message and `aria-invalid`, and calculated results for that scenario are cleared to prevent stale comparisons.

The parser accepts plain decimals and correctly grouped US thousands, such as `1250`, `1,250`, and `0.75`; the measured-value field also accepts a leading `$`. It rejects malformed comma grouping, scientific notation, non-numeric text, negative values, and non-finite values. Use at most two decimal places for measured value and four for acreage. Limits are $1 trillion per measured value and 1 billion acres per acreage input. These explicit bounds keep scaled input arithmetic within JavaScript's safe integer range. Gross acreage is summed in ten-thousandths to prevent visible decimal addition drift.

The interface includes explicit labels, grouped inputs, a keyboard skip link, visible focus states, a comparison table with headers, a debounced results announcement, reduced-motion support, and text explanations alongside colors. The layout stacks on smaller screens. The visual style uses white, navy, muted blue/green/gold, and system fonts to work offline.

## Verify or customize

An optional dependency-free test suite uses Node.js 18 or later. It is not needed to run or deploy the site:

```sh
node --test tests/calculator.test.cjs
```

Browser smoke checks: edit both scenarios; try blank, negative, and zero taxable acreage; try zero measured value; verify independent resets and the full reset; copy a summary and inspect its caveat; deny clipboard permission and confirm the manual-copy panel; inspect at desktop and phone widths.

Edit the CSS custom properties at the top of `styles.css` for colors and type. Change illustrative defaults in `calculator.js`. No hosting-specific absolute paths are used.
