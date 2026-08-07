# Strategic Sourcing — Stamping Intake Questionnaire

Export of the agent questionnaire in `lib/questionnaire.json` (source of truth for the guided sourcing flow), plus the pill/chip labels from `components/supplier-results.tsx`.

**13 questions · 302 answer options.** Ranks run Q1–Q14 with no Q7. Tier `core` questions are always asked; `adaptive` questions are asked when relevant. `multi` indicates multiple answers may be selected.

**Pill/chip labels:** each logged answer appears as a dismissible pill in the results header under a short uppercase facet label (the "chip label" below, e.g. `TOOLING`). In the chat transcript, logged answers render as chips using the question title, e.g. `Tooling & die status: New die design & build · logged`.

## Question index

| Rank | Chip label | Question | Title | Tier | Select | Importance | Options |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | `PROCESS` | Which stamping process does your part need? | Stamping process / press method | core | single | 96 | 15 |
| Q2 | `MATERIAL` | What material will the part be stamped from? | Material | core | single | 94 | 39 |
| Q3 | `THICKNESS` | How thick is the material? | Stock thickness & feed format | core | single | 90 | 8 |
| Q4 | `QUANTITY` | How many parts do you need? | Quantity & production volume | core | single | 88 | 6 |
| Q5 | `SIZE` | Roughly how big is the part? | Part size & complexity | core | single | 84 | 9 |
| Q6 | `TOOLING` | What's the tooling situation? | Tooling & die status | core | single | 80 | 4 |
| Q8 | `TOLERANCE` | How tight are the tolerances? | Tolerance & precision class | adaptive | single | 70 | 4 |
| Q9 | `LOCATION` | Where should suppliers be located? | Supplier location | core | single | 60 | 1 |
| Q10 | `FEATURES` | Does the part need anything beyond the stamping itself? | Features & secondary operations | adaptive | multi | 55 | 22 |
| Q11 | `PART TYPE` | What is the part, in plain terms? | Part type | adaptive | single | 45 | 18 |
| Q12 | `INDUSTRY` | What industry is this for? | Industry & application | adaptive | multi | 40 | 25 |
| Q13 | `CERTIFICATIONS` | Do suppliers need to hold any certifications? | Certifications & standards | adaptive | multi | 32 | 129 |
| Q14 | `DIVERSITY` | Does this purchase need to count toward supplier-diversity goals? | Diverse supplier requirements | adaptive | multi | 25 | 22 |

---

## Q1 — Which stamping process does your part need?

*Progressive die, fine blanking, deep draw, and other ways the part is formed.*

**Chip label:** `PROCESS` · **Title:** Stamping process / press method · **Tier:** core · **single-select** · **Importance:** 96 · **id:** `process`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Progressive Die | 1007308 · multi-stage, one dieset, coil-fed | 78654001 |
| Transfer Die | 1007360 · part carried between dies | 79380721 |
| Transfer Press | 1007853 · press-level transfer | 62781661 |
| Punch Press | 996936 · single-station punch press | 62781661 |
| Compound Die | 1007307 · cut + form in one stroke | 78361003 |
| Fourslide | 1007220 · wireform-style bends | 78520301 |
| Multislide® | 1007839 · Multislide® | 78570207 |
| Fine blanking | 1007362 · fully sheared, no die-roll | 29420601 |
| Blanking only | 1007309 | 5432679 |
| Coining | 1007225 | 97007055 |
| Reel-to-reel | 1007364 · continuous carrier | 97003698 |
| Robotic stamping | 965919 | 97002094 |
| High speed | 965653 · hundreds of parts/min | 7683 |
| Deep drawing | routes to Deep Drawing Services family | 21911300 |
| Not sure — recommend | agent proposes from part geometry | 97001062 |

## Q2 — What material will the part be stamped from?

*Aluminum, steel, brass, copper, and other metals the blank is made from.*

**Chip label:** `MATERIAL` · **Title:** Material · **Tier:** core · **single-select** · **Importance:** 94 · **id:** `material`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Metal | 908908 · 16 suppliers | 78560109 |
| Aluminum | 907909 · 2 suppliers | 78270204 |
| Sheet Metal | 908916 · 2 suppliers | 78680154 |
| Brass | 907925 · 1 suppliers | 78330404 |
| Bronze | 908831 · 1 suppliers | 78330404 |
| Copper | 907931 · 1 suppliers | 78330404 |
| Precious Metals | 907956 · 1 suppliers | 78630605 |
| Stainless Steel | 907964 · 1 suppliers | 79340808 |
| Steel | 907965 · 1 suppliers | 79360202 |
| Beryllium Copper | 908896 | 78320603 |
| Beryllium Nickel | 1030548 | 97008178 |
| Bi-Metal | 908830 | 96013289 |
| Carbon Steel | 908897 | 78350006 |
| Cobalt Steel | 908898 | 97002022 |
| Exotic Metal Alloy | 908900 | 96067566 |
| Ferrous | 908901 | 78500303 |
| Fibre | 908902 | 78500402 |
| Foil | 911470 | 78520202 |
| Gold | 907937 | 2332 |
| Kapton® | 997909 | 97012794 |
| Kovar® | 908905 | 96002589 |
| Lead | 907944 | 78540408 |
| Leather | 908906 | 78540804 |
| Magnesium | 907947 | 78541208 |
| Manganese Steel | 908907 | 78550209 |
| Mica | 908909 | 78560208 |
| Nickel | 907951 | 78600400 |
| Nickel Alloy | 908835 | 78600400 |
| Nickel Steel | 908839 | 78610201 |
| Nitinol® | 908910 | 96129879 |
| Non-Metallic | 908911 | 78620101 |
| PTFE | 908918 | 97008929 |
| Plastics | 908912 | 78620804 |
| Rubber | 908915 | 95916110 |
| Solder | 907963 | 76250604 |
| Spring Steel | 908917 | 79335006 |
| Tempered Steel | 908919 | 79380309 |
| Titanium | 907972 | 79380606 |
| Wire Cloth / Woven Wire | 908920 | 79381000 |

## Q3 — How thick is the material?

*Foil, thin gauge, heavy gauge, coil, or sheet — how thick the stock is.*

**Chip label:** `THICKNESS` · **Title:** Stock thickness & feed format · **Tier:** core · **single-select** · **Importance:** 90 · **id:** `stock`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Foil gauge | 911470 | 78520202 |
| Thin gauge | 1007864 | 97012658 |
| Thin wall | 1006889 | 97002028 |
| Standard gauge | no dedicated node |  |
| Heavy gauge | 1007856 | 78520525 |
| Continuous strip feed | 1007831 | 95919536 |
| Sheet / blank feed | 908916 · 2 suppliers | 78680154 |
| Coil feed | no dedicated node |  |

## Q4 — How many parts do you need?

*Prototype, short run, production, or high volume — how many parts you need.*

**Chip label:** `QUANTITY` · **Title:** Quantity & production volume · **Tier:** core · **single-select** · **Importance:** 88 · **id:** `qty`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Prototype | 881268 · 1 suppliers | 78655008 |
| Short Run | 881269 · stock tooling | 79140208 |
| Production Runs | 965372 · 4 suppliers | 96013743 |
| Long Run | 908952 | 78540903 |
| High Volume | 881267 · 2 suppliers | 78520657 |
| Order pattern: one-time / blanket / recurring releases |  |  |

## Q5 — Roughly how big is the part?

*Micro, miniature, small, or large — roughly how big the part is.*

**Chip label:** `SIZE` · **Title:** Part size & complexity · **Tier:** core · **single-select** · **Importance:** 84 · **id:** `size`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Micro | 1007363 · 2 suppliers | 95924544 |
| Microminiature | 965680 | 78560224 |
| Subminiature | 1007863 | 79363206 |
| Miniature | 965678 | 95961371 |
| Small | 1007862 · 1 suppliers | 79240404 |
| Medium-to-large | 1007861 | 95962734 |
| Complex geometry | 1007855 | 78360609 |
| Intricate detail | 1007858 | 78520806 |
| Deep drawn — formed depth greater than width | routes to Deep Drawing family | 21911300 |

## Q6 — What's the tooling situation?

*New die, open/stock tooling, or an existing die you want transferred.*

**Chip label:** `TOOLING` · **Title:** Tooling & die status · **Tier:** core · **single-select** · **Importance:** 80 · **id:** `tooling`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| New die design & build | 1007311 | 78474004 |
| Open / stock tooling | 1007840 · no die investment | 96202353 |
| Custom-engineered tooling | 880862 · 2 suppliers | 78362001 |
| Existing die — transfer to new supplier |  |  |

## Q8 — How tight are the tolerances?

*Commercial, close, precision, or high precision — how tight the dimensions must be.*

**Chip label:** `TOLERANCE` · **Title:** Tolerance & precision class · **Tier:** adaptive · **single-select** · **Importance:** 70 · **id:** `tol`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Standard commercial tolerance |  |  |
| Close tolerance | 965676 | 95914222 |
| Precision | 965679 · 4 suppliers | 78630803 |
| High precision | 965677 · 2 suppliers | 96004619 |

## Q9 — Where should suppliers be located?

*A ZIP, city, or state you prefer — or National for anywhere.*

**Chip label:** `LOCATION` · **Title:** Supplier location · **Tier:** core · **single-select** · **Importance:** 60 · **id:** `loc` · location question (free-form ZIP / city / state)

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| National | no geographic preference |  |

## Q10 — Does the part need anything beyond the stamping itself?

*Heat treat, tapping, plating, embossing, and other finishing beyond the stamp.*

**Chip label:** `FEATURES` · **Title:** Features & secondary operations · **Tier:** adaptive · **multi-select** · **Importance:** 55 · **id:** `features`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Heat treated | 908959 | 78520491 |
| Tapped | 908966 | 79380200 |
| Embossed | 908956 | 97004452 |
| Countersunk | 908954 | 97004453 |
| Flat / flatness critical | 908958 | 78515004 |
| Shape critical | 908963 | 78679156 |
| Surface critical (Class A) | 908965 | 97004451 |
| Coated | 908860 | 79380267 |
| Enameled | 908957 | 78500204 |
| Decorative / ornamental | 908961 | 78365202 |
| Strain relief | 908964 | 97005019 |
| Cruciform | 908955 | 97005258 |
| In-die assembly | 1033204 | 97010148 |
| Assembly | 907345 · stamped assemblies | 78290004 |
| Engineering / design assistance | 907346 | 95927604 |
| Laminated | 1007006 | 78540200 |
| Perforated | 1007841 | 78620606 |
| Fully sheared edges | 1007838 | 97003098 |
| High strength | 1007857 | 78520616 |
| Contract manufacturing | 907726 · 1 suppliers | 97003671 |
| Deburring / edge finishing | burrs are inherent to stamping |  |
| Plating |  |  |

## Q11 — What is the part, in plain terms?

*End caps, connectors, brackets, filters, and similar part types.*

**Chip label:** `PART TYPE` · **Title:** Part type · **Tier:** adaptive · **single-select** · **Importance:** 45 · **id:** `part`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| End Caps | 908971 · 1 suppliers | 78500246 |
| Connectors | 908861 | 96023700 |
| Electronic Connectors | 908970 | 96195573 |
| Filter Components | 909749 | 97004745 |
| Furniture Parts | 908972 | 96124110 |
| Fuses | 908973 | 78520350 |
| Hardware | 909750 | 78520467 |
| Heatsinks | 909751 | 96173687 |
| Inflators | 908975 | 97005257 |
| Lead Frames | 909753 | 78540457 |
| Mass Volume Parts | 1007859 | 95927596 |
| Medical Diaphragms | 909755 | 96168786 |
| Pressure Vessels | 909757 | 97005259 |
| Printed Circuit Contacts | 908977 | 95938593 |
| Printer Cartridge Blades | 909758 | 78323003 |
| Sensor Components | 909759 | 96195581 |
| Service Parts | 909760 | 97004826 |
| Surface Mount Pins | 908978 | 95938619 |

## Q12 — What industry is this for?

*Aerospace, automotive, medical, electronics, and other industries.*

**Chip label:** `INDUSTRY` · **Title:** Industry & application · **Tier:** adaptive · **multi-select** · **Importance:** 40 · **id:** `app`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Aerospace | 879450 | 78230000 |
| Agriculture | 882780 | 95921581 |
| Automotive | 879452 · 2 suppliers | 78300407 |
| Construction | 891994 | 78361151 |
| Electrical | 895056 · 1 suppliers | 96167804 |
| Electronics | 904084 · 1 suppliers | 78480209 |
| Medical and Dental | 879457 · 1 suppliers | 78550407 |
| Semiconductor | 879851 | 78670205 |
| Telecommunications | 880871 | 95914230 |
| Air Bags | 908856 | 96173679 |
| Aircraft | 895532 | 78250404 |
| All Terrain Vehicles (ATV) | 966888 | 96064324 |
| Appliances | 888909 · 1 suppliers | 78276003 |
| Batteries | 889389 | 95924460 |
| Carrier Circuits | 925166 | 95938577 |
| Cathode Ray Tubes (CRT) | 897532 | 95924452 |
| Cleanrooms | 905524 | 78355005 |
| Electric Motors | 908874 | 52510005 |
| Electric Vehicle (EV) | 1037570 | 97016367 |
| Lighting Fixtures | 908881 | 97002142 |
| Microelectronics | 908884 | 95938585 |
| Ordnance | 908885 | 96084272 |
| Pyrotechnics | 925165 | 97005256 |
| Trucks | 896569 | 95921599 |
| X-Ray Machines | 908984 | 97000907 |

## Q13 — Do suppliers need to hold any certifications?

*ISO, Mil-Spec, Made in USA, AS9100, and other certifications.*

**Chip label:** `CERTIFICATIONS` · **Title:** Certifications & standards · **Tier:** adaptive · **multi-select** · **Importance:** 32 · **id:** `cert`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Mil-Spec (MS) | 880649 | 78560265 |
| Government specifications | 908855 | 78520400 |
| ISO 9001:2015 | 918 suppliers | cert |
| Made in the USA | 523 suppliers | cert |
| ISO 9001:2008 | 455 suppliers | cert |
| AS9100D | 275 suppliers | cert |
| Conflict Minerals Disclosure | 199 suppliers | cert |
| ISO 9000 | 167 suppliers | cert |
| REACH | 161 suppliers | cert |
| ITAR Registered | 157 suppliers | cert |
| RoHS Compliant | 146 suppliers | cert |
| ISO 14001:2015 | 145 suppliers | cert |
| IATF 16949:2016 | 114 suppliers | cert |
| AS9100C | 113 suppliers | cert |
| ISO 9001 | 99 suppliers | cert |
| RoHS 2 Compliant (RoHS Recast) | 96 suppliers | cert |
| Nadcap | 83 suppliers | cert |
| ISO 9002 | 79 suppliers | cert |
| DFARS | 66 suppliers | cert |
| ISO 14001:2004 | 62 suppliers | cert |
| ISO 9001:2000 | 62 suppliers | cert |
| ISO 13485:2016 | 58 suppliers | cert |
| AS9120B | 55 suppliers | cert |
| ISO 45001:2018 | 51 suppliers | cert |
| FDA Registered | 50 suppliers | cert |
| Lean Manufacturing | 48 suppliers | cert |
| ISO/TS 16949:2009 | 47 suppliers | cert |
| ASME Boiler and Pressure Vessel (BPVC) | 45 suppliers | cert |
| ISO/IEC 17025:2017 | 45 suppliers | cert |
| ISO 14001 | 42 suppliers | cert |
| Pressure Equipment Directive (2014/68/EU) | 42 suppliers | cert |
| Drug-Free Workplace Program | 36 suppliers | cert |
| OHSAS 18001:2007 | 35 suppliers | cert |
| Buy American Act | 32 suppliers | cert |
| MIL-SPEC 45208A | 32 suppliers | cert |
| Six Sigma | 32 suppliers | cert |
| ISO/IEC 17025:2005 | 31 suppliers | cert |
| AS9100 | 30 suppliers | cert |
| Good Manufacturing Practices (GMP) | 26 suppliers | cert |
| ISO/TS 16949 | 24 suppliers | cert |
| AS9120A | 23 suppliers | cert |
| QS 9000 | 23 suppliers | cert |
| AISC | 19 suppliers | cert |
| NIST 800-171 | 19 suppliers | cert |
| Other | 19 suppliers | cert |
| ISO 13485:2003 | 16 suppliers | cert |
| NBBI Boiler & Pressure Vessel | 16 suppliers | cert |
| OHSAS 18001 | 16 suppliers | cert |
| Berry Amendment Compliance | 14 suppliers | cert |
| External Specialist Certification | 14 suppliers | cert |
| GSA Approved | 14 suppliers | cert |
| C-TPAT | 13 suppliers | cert |
| ISO 13485 | 13 suppliers | cert |
| ISO 50001:2011 | 12 suppliers | cert |
| SQF Certified | 12 suppliers | cert |
| API Spec Q1 | 10 suppliers | cert |
| AS9120 | 10 suppliers | cert |
| FFL | 10 suppliers | cert |
| ISO/IEC 17025 | 10 suppliers | cert |
| EPA Facility Compliance | 9 suppliers | cert |
| OSHA SHARP | 9 suppliers | cert |
| ASME Nuclear Quality Assurance (NQA-1) | 8 suppliers | cert |
| FAA Certified Repair Station | 8 suppliers | cert |
| ISO 14000 | 8 suppliers | cert |
| AS9100B | 7 suppliers | cert |
| CGP Registered | 7 suppliers | cert |
| CMMC | 7 suppliers | cert |
| ISO 9000:2001 | 7 suppliers | cert |
| CSA W47.1 | 6 suppliers | cert |
| ISO 9001:2002 | 6 suppliers | cert |
| ISO 9001:2004 | 6 suppliers | cert |
| ANSI/ESD S20.20-2007 | 5 suppliers | cert |
| Association of American Railroads Quality Assurance (AAR QA) | 5 suppliers | cert |
| EN ISO 13485:2012 | 5 suppliers | cert |
| European Aviation Safety Agency (EASA) Part 145 Approval | 5 suppliers | cert |
| FSC Chain-of-Custody | 5 suppliers | cert |
| IPC/WHMA-A-620 | 5 suppliers | cert |
| ISO 50001 | 5 suppliers | cert |
| ISO 9001:1994 | 5 suppliers | cert |
| ISO 9001:2001 | 5 suppliers | cert |
| ISO/TS 16949:2002 | 5 suppliers | cert |
| International Railway Industry Standard (IRIS) | 5 suppliers | cert |
| JCP Certified (DD 2345) | 5 suppliers | cert |
| ASME N-Type | 4 suppliers | cert |
| IPC-A-610 | 4 suppliers | cert |
| ISO 14001:1996 | 4 suppliers | cert |
| ISO 17034:2016 | 4 suppliers | cert |
| ISPM 15 | 4 suppliers | cert |
| ANSI/NCSL Z540.1-1994 | 3 suppliers | cert |
| AS9000 | 3 suppliers | cert |
| AS9100A | 3 suppliers | cert |
| ASME MO | 3 suppliers | cert |
| CSA N299.3-16 | 3 suppliers | cert |
| E-Stewards | 3 suppliers | cert |
| FSC Controlled Wood | 3 suppliers | cert |
| NQS 9000 | 3 suppliers | cert |
| NSF GMP Registration Program | 3 suppliers | cert |
| Responsible Distribution | 3 suppliers | cert |
| ANSI/ESD S20.20-2014 | 2 suppliers | cert |
| AS6081:2012 | 2 suppliers | cert |
| Build America, Buy America (BABA) Act | 2 suppliers | cert |
| CMMC Level 2 | 2 suppliers | cert |
| Department of Transportation (DOT) Approved Cylinder Requalification Facility | 2 suppliers | cert |
| FSSC 22000 | 2 suppliers | cert |
| G7 Master Qualification | 2 suppliers | cert |
| IPC J-STD-001 | 2 suppliers | cert |
| ISO 14644-1:2015 | 2 suppliers | cert |
| ISO 9000:2000 | 2 suppliers | cert |
| QS 9000:1998 | 2 suppliers | cert |
| SFI Chain-of-Custody | 2 suppliers | cert |
| TL9000 | 2 suppliers | cert |
| USFCR Verified Vendor | 2 suppliers | cert |
| 7 CFR Part 205 | 1 suppliers | cert |
| ANSI/MSE 50021:2013 | 1 suppliers | cert |
| ANSI/NCSL Z540.1 | 1 suppliers | cert |
| ANSI/NCSL Z540.3-2006 | 1 suppliers | cert |
| AS7101A | 1 suppliers | cert |
| AS9003:2001 | 1 suppliers | cert |
| CMMC Level 1 | 1 suppliers | cert |
| DEAC Accredited | 1 suppliers | cert |
| ISO 22000:2005 | 1 suppliers | cert |
| ISO 9002:1994 | 1 suppliers | cert |
| ISO 9003 | 1 suppliers | cert |
| ISO/IEC 27000 | 1 suppliers | cert |
| ISO/IEC 27001 | 1 suppliers | cert |
| ISO/IEC 27001:2005 | 1 suppliers | cert |
| MIL-PRF-31032 | 1 suppliers | cert |
| R2 | 1 suppliers | cert |
| No requirement |  |  |

## Q14 — Does this purchase need to count toward supplier-diversity goals?

*Woman-owned, veteran-owned, small business, and other diversity classifications.*

**Chip label:** `DIVERSITY` · **Title:** Diverse supplier requirements · **Tier:** adaptive · **multi-select** · **Importance:** 25 · **id:** `diverse`

| Answer option | Note | Taxonomy ID |
| --- | --- | --- |
| Woman Owned | 213 suppliers | cert |
| Small Business Enterprise (SBE) | 126 suppliers | cert |
| Veteran-Owned | 125 suppliers | cert |
| Small Disadvantaged Business (SDB) | 83 suppliers | cert |
| Women's Business Enterprise (WBE) | 68 suppliers | cert |
| Woman Owned Small Business (WOSB) | 62 suppliers | cert |
| Minority Business Enterprise (MBE) | 39 suppliers | cert |
| Hispanic American | 36 suppliers | cert |
| Minority Owned (Not Specified) | 29 suppliers | cert |
| HubZone | 27 suppliers | cert |
| Asian-Indian | 24 suppliers | cert |
| Asian-Pacific American | 20 suppliers | cert |
| Disadvantaged Business Enterprise (DBE) | 19 suppliers | cert |
| Service Disabled Veteran Owned Small Business | 18 suppliers | cert |
| SBA 8(a) | 16 suppliers | cert |
| Veteran Owned Small Business | 16 suppliers | cert |
| Black American | 11 suppliers | cert |
| Native American | 7 suppliers | cert |
| Historically Underutilized Business (HUB) | 4 suppliers | cert |
| AbilityOne | 1 suppliers | cert |
| LGBT Business Enterprise (LGBTBE) | 1 suppliers | cert |
| No requirement |  |  |

