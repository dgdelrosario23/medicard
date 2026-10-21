# MediCard SME Choice proposal studio

Requires Node.js 18 or newer. No package installation is needed.

Run `npm start`, then use port 3000. Run `npm run check` for JavaScript syntax checks.

The supplied 50% and 100% pre-existing condition rate sheets are bundled: 6 MBL tiers × 2 hospital access options × 2 PEC options × annual/semi-annual payment × principal/dependent member types (96 prices). The former No-PEC option has been replaced by 50% of MBL. Legacy browser edits to No-PEC rates are ignored rather than reused for the new coverage.

Enter principal and dependent counts separately and select the payment mode. Semi-annual rates are per installment, with 2 installments shown for the yearly total. Room-and-board descriptions and AHMC/CSMC exclusions follow the supplied table.

Open **Manage rates** to review or edit VAT-inclusive prices. Edits persist in this browser's local storage. Select **VAT included (12%)** (default) or **Zero-rated (0% VAT)** in the proposal form. Zero-rated pricing divides each stored rate by 1.12 and rounds to centavos per member before multiplying by member counts. Stored rates stay VAT-inclusive. Preview or print proposals to PDF. Legacy single-member-type rates are not reused because they cannot distinguish principal/dependent or payment mode.

This initial version does not provide shared storage, authentication, or saved customer proposals. Company details are held only in the current page. Taxes are disclosed rather than calculated; confirm pricing rules before issuing proposals.

The generated `public/index.html` bundles its JavaScript and CSS so pricing also works when the HTML is opened directly in a browser. Run `npm run build` after editing `src/index.html`, `public/app.js`, or `public/style.css`. HTML viewers that block JavaScript cannot run the calculator; use a full browser.

## GitHub Pages

The published site is generated into `docs/` by `npm run build`. In repository Settings → Pages, select **Deploy from a branch**, **main**, and **/docs**, then Save. The expected URL is https://dgdelrosario23.github.io/medicard/ . Future edits must run `npm run build` and commit the updated `docs/index.html` along with source changes.

The public site includes the supplied rates. Browser edits are local to each device, and no customer proposals are uploaded or stored on a server.
