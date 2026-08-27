import type { FieldOption, StateConfig } from "@/lib/state-config";

/**
 * ============================================================================
 * MICHIGAN — src/data/states/michigan.ts
 * ----------------------------------------------------------------------------
 * Data source: research/michigan.json (+ research/michigan.md), verified
 * 2026-07-18 against the live Michigan DNR eLicense portal
 * (https://mdnr-elicense.com/) and three official fee sources (michigan.gov
 * license-info page, official eRegulations digest, DNR press release).
 *
 * Portal quirks preserved verbatim (research/michigan.md sec.5):
 *  - "AMERICAN SOMOA" misspelling is the portal's own (State/Prov dropdown).
 *  - MICHIGAN appears twice in the State/Prov list (pinned default +
 *    alphabetical); UNITED STATES likewise in the Country list.
 *  - No SSN field anywhere on the portal -> requiresSSN: false.
 *  - No eye-color / hair-color / race fields on the current profile form.
 *  - Michigan has NO fishing stamps/endorsements (all-species licenses);
 *    the 72-hour $30 license (2016) is discontinued and intentionally excluded.
 *
 * Type mapping: every JSON type/residency/category/mask value already falls
 * inside the StateConfig unions, so no value remapping was needed. The JSON
 * top-level `sources` array has no StateConfig slot and is folded into
 * researchNotes below.
 * ============================================================================
 */

/**
 * Verbatim 76-entry "Driver's License State" / "State/Prov" option list from
 * the eLicense portal (MICHIGAN pinned first AND repeated alphabetically;
 * "AMERICAN SOMOA" is the portal's own spelling). Shared by the
 * driversLicenseState, resState and mailState fields.
 */
const stateProvOptions: FieldOption[] = [
  {
    value: "MICHIGAN",
    label: "MICHIGAN"
  },
  {
    value: "ALABAMA",
    label: "ALABAMA"
  },
  {
    value: "ALASKA",
    label: "ALASKA"
  },
  {
    value: "ALBERTA",
    label: "ALBERTA"
  },
  {
    value: "AMERICAN SOMOA",
    label: "AMERICAN SOMOA"
  },
  {
    value: "ARIZONA",
    label: "ARIZONA"
  },
  {
    value: "ARKANSAS",
    label: "ARKANSAS"
  },
  {
    value: "BRITISH COLUMBIA",
    label: "BRITISH COLUMBIA"
  },
  {
    value: "CALIFORNIA",
    label: "CALIFORNIA"
  },
  {
    value: "COLORADO",
    label: "COLORADO"
  },
  {
    value: "CONNECTICUT",
    label: "CONNECTICUT"
  },
  {
    value: "DELAWARE",
    label: "DELAWARE"
  },
  {
    value: "DISTRICT OF COLUMBIA",
    label: "DISTRICT OF COLUMBIA"
  },
  {
    value: "FEDERATED STATES OF MICRONESIA",
    label: "FEDERATED STATES OF MICRONESIA"
  },
  {
    value: "FLORIDA",
    label: "FLORIDA"
  },
  {
    value: "GEORGIA",
    label: "GEORGIA"
  },
  {
    value: "GUAM",
    label: "GUAM"
  },
  {
    value: "HAWAII",
    label: "HAWAII"
  },
  {
    value: "IDAHO",
    label: "IDAHO"
  },
  {
    value: "ILLINOIS",
    label: "ILLINOIS"
  },
  {
    value: "INDIANA",
    label: "INDIANA"
  },
  {
    value: "IOWA",
    label: "IOWA"
  },
  {
    value: "KANSAS",
    label: "KANSAS"
  },
  {
    value: "KENTUCKY",
    label: "KENTUCKY"
  },
  {
    value: "LOUISIANA",
    label: "LOUISIANA"
  },
  {
    value: "MAINE",
    label: "MAINE"
  },
  {
    value: "MANITOBA",
    label: "MANITOBA"
  },
  {
    value: "MARSHALL ISLANDS",
    label: "MARSHALL ISLANDS"
  },
  {
    value: "MARYLAND",
    label: "MARYLAND"
  },
  {
    value: "MASSACHUSETTS",
    label: "MASSACHUSETTS"
  },
  {
    value: "MICHIGAN",
    label: "MICHIGAN"
  },
  {
    value: "MINNESOTA",
    label: "MINNESOTA"
  },
  {
    value: "MISSISSIPPI",
    label: "MISSISSIPPI"
  },
  {
    value: "MISSOURI",
    label: "MISSOURI"
  },
  {
    value: "MONTANA",
    label: "MONTANA"
  },
  {
    value: "NEBRASKA",
    label: "NEBRASKA"
  },
  {
    value: "NEW BRUNSWICK",
    label: "NEW BRUNSWICK"
  },
  {
    value: "NEW HAMPSHIRE",
    label: "NEW HAMPSHIRE"
  },
  {
    value: "NEW JERSEY",
    label: "NEW JERSEY"
  },
  {
    value: "NEW MEXICO",
    label: "NEW MEXICO"
  },
  {
    value: "NEW YORK",
    label: "NEW YORK"
  },
  {
    value: "NEWFOUNDLAND AND LABRADOR",
    label: "NEWFOUNDLAND AND LABRADOR"
  },
  {
    value: "NEVADA",
    label: "NEVADA"
  },
  {
    value: "NORTH CAROLINA",
    label: "NORTH CAROLINA"
  },
  {
    value: "NORTH DAKOTA",
    label: "NORTH DAKOTA"
  },
  {
    value: "NORTHERN MARIANA ISLANDS",
    label: "NORTHERN MARIANA ISLANDS"
  },
  {
    value: "NORTHWEST TERRITORIES",
    label: "NORTHWEST TERRITORIES"
  },
  {
    value: "NOVA SCOTIA",
    label: "NOVA SCOTIA"
  },
  {
    value: "NUNAVAT TERRITORY",
    label: "NUNAVAT TERRITORY"
  },
  {
    value: "OHIO",
    label: "OHIO"
  },
  {
    value: "OKLAHOMA",
    label: "OKLAHOMA"
  },
  {
    value: "ONTARIO",
    label: "ONTARIO"
  },
  {
    value: "OREGON",
    label: "OREGON"
  },
  {
    value: "PALAU",
    label: "PALAU"
  },
  {
    value: "PENNSYLVANIA",
    label: "PENNSYLVANIA"
  },
  {
    value: "PRINCE EDWARD ISLAND",
    label: "PRINCE EDWARD ISLAND"
  },
  {
    value: "PUERTO RICO",
    label: "PUERTO RICO"
  },
  {
    value: "QUEBEC",
    label: "QUEBEC"
  },
  {
    value: "RHODE ISLAND",
    label: "RHODE ISLAND"
  },
  {
    value: "SASKATCHEWAN",
    label: "SASKATCHEWAN"
  },
  {
    value: "SOUTH CAROLINA",
    label: "SOUTH CAROLINA"
  },
  {
    value: "SOUTH DAKOTA",
    label: "SOUTH DAKOTA"
  },
  {
    value: "TENNESSEE",
    label: "TENNESSEE"
  },
  {
    value: "TEXAS",
    label: "TEXAS"
  },
  {
    value: "UTAH",
    label: "UTAH"
  },
  {
    value: "VIRGINIA",
    label: "VIRGINIA"
  },
  {
    value: "VERMONT",
    label: "VERMONT"
  },
  {
    value: "WASHINGTON",
    label: "WASHINGTON"
  },
  {
    value: "WISCONSIN",
    label: "WISCONSIN"
  },
  {
    value: "WEST VIRGINIA",
    label: "WEST VIRGINIA"
  },
  {
    value: "WYOMING",
    label: "WYOMING"
  },
  {
    value: "YUKON TERRITORY",
    label: "YUKON TERRITORY"
  },
  {
    value: "ARMED FORCES EUROPE, THE MIDDLE EAST, AND CANADA",
    label: "ARMED FORCES EUROPE, THE MIDDLE EAST, AND CANADA"
  },
  {
    value: "ARMED FORCES PACIFIC",
    label: "ARMED FORCES PACIFIC"
  },
  {
    value: "ARMED FORCES AMERICAS (EXCEPT CANADA)",
    label: "ARMED FORCES AMERICAS (EXCEPT CANADA)"
  },
  {
    value: "OTHER",
    label: "OTHER"
  }
];

/**
 * Verbatim 242-entry "Country" option list from the eLicense portal
 * (UNITED STATES pinned first AND repeated alphabetically). Shared by the
 * resCountry and mailCountry fields.
 */
const countryOptions: FieldOption[] = [
  {
    value: "UNITED STATES",
    label: "UNITED STATES"
  },
  {
    value: "AFGHANISTAN",
    label: "AFGHANISTAN"
  },
  {
    value: "ALBANIA",
    label: "ALBANIA"
  },
  {
    value: "ALGERIA",
    label: "ALGERIA"
  },
  {
    value: "AMERICAN SAMOA",
    label: "AMERICAN SAMOA"
  },
  {
    value: "ANDORRA",
    label: "ANDORRA"
  },
  {
    value: "ANGOLA",
    label: "ANGOLA"
  },
  {
    value: "ANGUILLA",
    label: "ANGUILLA"
  },
  {
    value: "ANTARCTICA",
    label: "ANTARCTICA"
  },
  {
    value: "ANTIGUA AND BARBUDA",
    label: "ANTIGUA AND BARBUDA"
  },
  {
    value: "ARGENTINA",
    label: "ARGENTINA"
  },
  {
    value: "ARMENIA",
    label: "ARMENIA"
  },
  {
    value: "ARUBA",
    label: "ARUBA"
  },
  {
    value: "AUSTRALIA",
    label: "AUSTRALIA"
  },
  {
    value: "AUSTRIA",
    label: "AUSTRIA"
  },
  {
    value: "AZERBAIJAN",
    label: "AZERBAIJAN"
  },
  {
    value: "BAHAMAS",
    label: "BAHAMAS"
  },
  {
    value: "BAHRAIN",
    label: "BAHRAIN"
  },
  {
    value: "BANGLADESH",
    label: "BANGLADESH"
  },
  {
    value: "BARBADOS",
    label: "BARBADOS"
  },
  {
    value: "BELARUS",
    label: "BELARUS"
  },
  {
    value: "BELGIUM",
    label: "BELGIUM"
  },
  {
    value: "BELIZE",
    label: "BELIZE"
  },
  {
    value: "BENIN",
    label: "BENIN"
  },
  {
    value: "BERMUDA",
    label: "BERMUDA"
  },
  {
    value: "BHUTAN",
    label: "BHUTAN"
  },
  {
    value: "BOLIVIA",
    label: "BOLIVIA"
  },
  {
    value: "BOSNIA AND HERZEGOWINA",
    label: "BOSNIA AND HERZEGOWINA"
  },
  {
    value: "BOTSWANA",
    label: "BOTSWANA"
  },
  {
    value: "BOUVET ISLAND",
    label: "BOUVET ISLAND"
  },
  {
    value: "BRAZIL",
    label: "BRAZIL"
  },
  {
    value: "BRITISH INDIAN OCEAN TERRITORY",
    label: "BRITISH INDIAN OCEAN TERRITORY"
  },
  {
    value: "BRUNEI DARUSSALAM",
    label: "BRUNEI DARUSSALAM"
  },
  {
    value: "BULGARIA",
    label: "BULGARIA"
  },
  {
    value: "BURKINA FASO",
    label: "BURKINA FASO"
  },
  {
    value: "BURUNDI",
    label: "BURUNDI"
  },
  {
    value: "CAMBODIA",
    label: "CAMBODIA"
  },
  {
    value: "CAMEROON",
    label: "CAMEROON"
  },
  {
    value: "CANADA",
    label: "CANADA"
  },
  {
    value: "CAPE VERDE",
    label: "CAPE VERDE"
  },
  {
    value: "CAYMAN ISLANDS",
    label: "CAYMAN ISLANDS"
  },
  {
    value: "CENTRAL AFRICAN REPUBLIC",
    label: "CENTRAL AFRICAN REPUBLIC"
  },
  {
    value: "CHAD",
    label: "CHAD"
  },
  {
    value: "CHILE",
    label: "CHILE"
  },
  {
    value: "CHINA",
    label: "CHINA"
  },
  {
    value: "CHRISTMAS ISLAND",
    label: "CHRISTMAS ISLAND"
  },
  {
    value: "COCOS (KEELING) ISLANDS",
    label: "COCOS (KEELING) ISLANDS"
  },
  {
    value: "COLOMBIA",
    label: "COLOMBIA"
  },
  {
    value: "COMOROS",
    label: "COMOROS"
  },
  {
    value: "CONGO",
    label: "CONGO"
  },
  {
    value: "COOK ISLANDS",
    label: "COOK ISLANDS"
  },
  {
    value: "COSTA RICA",
    label: "COSTA RICA"
  },
  {
    value: "COTE D'IVOIRE",
    label: "COTE D'IVOIRE"
  },
  {
    value: "CROATIA",
    label: "CROATIA"
  },
  {
    value: "CUBA",
    label: "CUBA"
  },
  {
    value: "CYPRUS",
    label: "CYPRUS"
  },
  {
    value: "CZECH REPUBLIC",
    label: "CZECH REPUBLIC"
  },
  {
    value: "DENMARK",
    label: "DENMARK"
  },
  {
    value: "DJIBOUTI",
    label: "DJIBOUTI"
  },
  {
    value: "DOMINICA",
    label: "DOMINICA"
  },
  {
    value: "DOMINICAN REPUBLIC",
    label: "DOMINICAN REPUBLIC"
  },
  {
    value: "EAST TIMOR",
    label: "EAST TIMOR"
  },
  {
    value: "ECUADOR",
    label: "ECUADOR"
  },
  {
    value: "EGYPT",
    label: "EGYPT"
  },
  {
    value: "EL SALVADOR",
    label: "EL SALVADOR"
  },
  {
    value: "EQUATORIAL GUINEA",
    label: "EQUATORIAL GUINEA"
  },
  {
    value: "ERITREA",
    label: "ERITREA"
  },
  {
    value: "ESTONIA",
    label: "ESTONIA"
  },
  {
    value: "ETHIOPIA",
    label: "ETHIOPIA"
  },
  {
    value: "FALKLAND ISLANDS (MALVINAS)",
    label: "FALKLAND ISLANDS (MALVINAS)"
  },
  {
    value: "FAROE ISLANDS",
    label: "FAROE ISLANDS"
  },
  {
    value: "FEDERATED STATES OF MICRONESIA",
    label: "FEDERATED STATES OF MICRONESIA"
  },
  {
    value: "FIJI",
    label: "FIJI"
  },
  {
    value: "FINLAND",
    label: "FINLAND"
  },
  {
    value: "FRANCE",
    label: "FRANCE"
  },
  {
    value: "FRANCE, METROPOLITAN",
    label: "FRANCE, METROPOLITAN"
  },
  {
    value: "FRENCH GUIANA",
    label: "FRENCH GUIANA"
  },
  {
    value: "FRENCH POLYNESIA",
    label: "FRENCH POLYNESIA"
  },
  {
    value: "FRENCH SOUTHERN TERRITORIES",
    label: "FRENCH SOUTHERN TERRITORIES"
  },
  {
    value: "GABON",
    label: "GABON"
  },
  {
    value: "GAMBIA",
    label: "GAMBIA"
  },
  {
    value: "GEORGIA",
    label: "GEORGIA"
  },
  {
    value: "GERMANY",
    label: "GERMANY"
  },
  {
    value: "GHANA",
    label: "GHANA"
  },
  {
    value: "GIBRALTAR",
    label: "GIBRALTAR"
  },
  {
    value: "GREECE",
    label: "GREECE"
  },
  {
    value: "GREENLAND",
    label: "GREENLAND"
  },
  {
    value: "GRENADA",
    label: "GRENADA"
  },
  {
    value: "GUADELOUPE",
    label: "GUADELOUPE"
  },
  {
    value: "GUAM",
    label: "GUAM"
  },
  {
    value: "GUATEMALA",
    label: "GUATEMALA"
  },
  {
    value: "GUINEA",
    label: "GUINEA"
  },
  {
    value: "GUINEA-BISSAU",
    label: "GUINEA-BISSAU"
  },
  {
    value: "GUYANA",
    label: "GUYANA"
  },
  {
    value: "HAITI",
    label: "HAITI"
  },
  {
    value: "HEARD AND MC DONALD ISLANDS",
    label: "HEARD AND MC DONALD ISLANDS"
  },
  {
    value: "HONDURAS",
    label: "HONDURAS"
  },
  {
    value: "HONG KONG",
    label: "HONG KONG"
  },
  {
    value: "HUNGARY",
    label: "HUNGARY"
  },
  {
    value: "ICELAND",
    label: "ICELAND"
  },
  {
    value: "INDIA",
    label: "INDIA"
  },
  {
    value: "INDONESIA",
    label: "INDONESIA"
  },
  {
    value: "IRAN",
    label: "IRAN"
  },
  {
    value: "IRAQ",
    label: "IRAQ"
  },
  {
    value: "IRELAND",
    label: "IRELAND"
  },
  {
    value: "ISRAEL",
    label: "ISRAEL"
  },
  {
    value: "ITALY",
    label: "ITALY"
  },
  {
    value: "JAMAICA",
    label: "JAMAICA"
  },
  {
    value: "JAPAN",
    label: "JAPAN"
  },
  {
    value: "JORDAN",
    label: "JORDAN"
  },
  {
    value: "KAZAKHSTAN",
    label: "KAZAKHSTAN"
  },
  {
    value: "KENYA",
    label: "KENYA"
  },
  {
    value: "KIRIBATI",
    label: "KIRIBATI"
  },
  {
    value: "KOREA, DPR",
    label: "KOREA, DPR"
  },
  {
    value: "KOREA, REPUBLIC OF",
    label: "KOREA, REPUBLIC OF"
  },
  {
    value: "KUWAIT",
    label: "KUWAIT"
  },
  {
    value: "KYRGYZSTAN",
    label: "KYRGYZSTAN"
  },
  {
    value: "LAO PEOPLE'S DEMOCRATIC REPUBLIC",
    label: "LAO PEOPLE'S DEMOCRATIC REPUBLIC"
  },
  {
    value: "LATVIA",
    label: "LATVIA"
  },
  {
    value: "LEBANON",
    label: "LEBANON"
  },
  {
    value: "LESOTHO",
    label: "LESOTHO"
  },
  {
    value: "LIBERIA",
    label: "LIBERIA"
  },
  {
    value: "LIBYAN ARAB JAMAHIRIYA",
    label: "LIBYAN ARAB JAMAHIRIYA"
  },
  {
    value: "LIECHTENSTEIN",
    label: "LIECHTENSTEIN"
  },
  {
    value: "LITHUANIA",
    label: "LITHUANIA"
  },
  {
    value: "LUXEMBOURG",
    label: "LUXEMBOURG"
  },
  {
    value: "MACAU",
    label: "MACAU"
  },
  {
    value: "MACEDONIA",
    label: "MACEDONIA"
  },
  {
    value: "MADAGASCAR",
    label: "MADAGASCAR"
  },
  {
    value: "MALAWI",
    label: "MALAWI"
  },
  {
    value: "MALAYSIA",
    label: "MALAYSIA"
  },
  {
    value: "MALDIVES",
    label: "MALDIVES"
  },
  {
    value: "MALI",
    label: "MALI"
  },
  {
    value: "MALTA",
    label: "MALTA"
  },
  {
    value: "MARSHALL ISLANDS",
    label: "MARSHALL ISLANDS"
  },
  {
    value: "MARTINIQUE",
    label: "MARTINIQUE"
  },
  {
    value: "MAURITANIA",
    label: "MAURITANIA"
  },
  {
    value: "MAURITIUS",
    label: "MAURITIUS"
  },
  {
    value: "MAYOTTE",
    label: "MAYOTTE"
  },
  {
    value: "MEXICO",
    label: "MEXICO"
  },
  {
    value: "MOLDOVA, REPUBLIC OF",
    label: "MOLDOVA, REPUBLIC OF"
  },
  {
    value: "MONACO",
    label: "MONACO"
  },
  {
    value: "MONGOLIA",
    label: "MONGOLIA"
  },
  {
    value: "MONTENEGRO",
    label: "MONTENEGRO"
  },
  {
    value: "MONTSERRAT",
    label: "MONTSERRAT"
  },
  {
    value: "MOROCCO",
    label: "MOROCCO"
  },
  {
    value: "MOZAMBIQUE",
    label: "MOZAMBIQUE"
  },
  {
    value: "MYANMAR",
    label: "MYANMAR"
  },
  {
    value: "NAMIBIA",
    label: "NAMIBIA"
  },
  {
    value: "NAURU",
    label: "NAURU"
  },
  {
    value: "NEPAL",
    label: "NEPAL"
  },
  {
    value: "NETHERLANDS",
    label: "NETHERLANDS"
  },
  {
    value: "NETHERLANDS ANTILLES",
    label: "NETHERLANDS ANTILLES"
  },
  {
    value: "NEW CALEDONIA",
    label: "NEW CALEDONIA"
  },
  {
    value: "NEW ZEALAND",
    label: "NEW ZEALAND"
  },
  {
    value: "NICARAGUA",
    label: "NICARAGUA"
  },
  {
    value: "NIGER",
    label: "NIGER"
  },
  {
    value: "NIGERIA",
    label: "NIGERIA"
  },
  {
    value: "NIUE",
    label: "NIUE"
  },
  {
    value: "NORFOLK ISLAND",
    label: "NORFOLK ISLAND"
  },
  {
    value: "NORTHERN MARIANA ISLANDS",
    label: "NORTHERN MARIANA ISLANDS"
  },
  {
    value: "NORWAY",
    label: "NORWAY"
  },
  {
    value: "OMAN",
    label: "OMAN"
  },
  {
    value: "PAKISTAN",
    label: "PAKISTAN"
  },
  {
    value: "PALAU",
    label: "PALAU"
  },
  {
    value: "PANAMA",
    label: "PANAMA"
  },
  {
    value: "PAPUA NEW GUINEA",
    label: "PAPUA NEW GUINEA"
  },
  {
    value: "PARAGUAY",
    label: "PARAGUAY"
  },
  {
    value: "PERU",
    label: "PERU"
  },
  {
    value: "PHILIPPINES",
    label: "PHILIPPINES"
  },
  {
    value: "PITCAIRN",
    label: "PITCAIRN"
  },
  {
    value: "POLAND",
    label: "POLAND"
  },
  {
    value: "PORTUGAL",
    label: "PORTUGAL"
  },
  {
    value: "PUERTO RICO",
    label: "PUERTO RICO"
  },
  {
    value: "QATAR",
    label: "QATAR"
  },
  {
    value: "REUNION",
    label: "REUNION"
  },
  {
    value: "ROMANIA",
    label: "ROMANIA"
  },
  {
    value: "RUSSIAN FEDERATION",
    label: "RUSSIAN FEDERATION"
  },
  {
    value: "RWANDA",
    label: "RWANDA"
  },
  {
    value: "SAINT KITTS AND NEVIS",
    label: "SAINT KITTS AND NEVIS"
  },
  {
    value: "SAINT LUCIA",
    label: "SAINT LUCIA"
  },
  {
    value: "SAINT VINCENT AND THE GRENADINES",
    label: "SAINT VINCENT AND THE GRENADINES"
  },
  {
    value: "SAMOA",
    label: "SAMOA"
  },
  {
    value: "SAN MARINO",
    label: "SAN MARINO"
  },
  {
    value: "SAO TOME AND PRINCIPE",
    label: "SAO TOME AND PRINCIPE"
  },
  {
    value: "SAUDI ARABIA",
    label: "SAUDI ARABIA"
  },
  {
    value: "SENEGAL",
    label: "SENEGAL"
  },
  {
    value: "SERBIA",
    label: "SERBIA"
  },
  {
    value: "SEYCHELLES",
    label: "SEYCHELLES"
  },
  {
    value: "SIERRA LEONE",
    label: "SIERRA LEONE"
  },
  {
    value: "SINGAPORE",
    label: "SINGAPORE"
  },
  {
    value: "SLOVAKIA (SLOVAK REPUBLIC)",
    label: "SLOVAKIA (SLOVAK REPUBLIC)"
  },
  {
    value: "SLOVENIA",
    label: "SLOVENIA"
  },
  {
    value: "SOLOMON ISLANDS",
    label: "SOLOMON ISLANDS"
  },
  {
    value: "SOMALIA",
    label: "SOMALIA"
  },
  {
    value: "SOUTH AFRICA",
    label: "SOUTH AFRICA"
  },
  {
    value: "SOUTH GEORGIA / SANDWICH ISLANDS",
    label: "SOUTH GEORGIA / SANDWICH ISLANDS"
  },
  {
    value: "SPAIN",
    label: "SPAIN"
  },
  {
    value: "SR. PIERRE AND MIQUELON",
    label: "SR. PIERRE AND MIQUELON"
  },
  {
    value: "SRI LANKA",
    label: "SRI LANKA"
  },
  {
    value: "ST. HELENA",
    label: "ST. HELENA"
  },
  {
    value: "SUDAN",
    label: "SUDAN"
  },
  {
    value: "SURINAME",
    label: "SURINAME"
  },
  {
    value: "SVALBARD AND JAN MAYEN ISLANDS",
    label: "SVALBARD AND JAN MAYEN ISLANDS"
  },
  {
    value: "SWAZILAND",
    label: "SWAZILAND"
  },
  {
    value: "SWEDEN",
    label: "SWEDEN"
  },
  {
    value: "SWITZERLAND",
    label: "SWITZERLAND"
  },
  {
    value: "SYRIAN ARAB REPUBLIC",
    label: "SYRIAN ARAB REPUBLIC"
  },
  {
    value: "TAIWAN",
    label: "TAIWAN"
  },
  {
    value: "TAJIKISTAN",
    label: "TAJIKISTAN"
  },
  {
    value: "TANZANIA, UNITED REPUBLIC OF",
    label: "TANZANIA, UNITED REPUBLIC OF"
  },
  {
    value: "THAILAND",
    label: "THAILAND"
  },
  {
    value: "TOGO",
    label: "TOGO"
  },
  {
    value: "TOKELAU",
    label: "TOKELAU"
  },
  {
    value: "TONGA",
    label: "TONGA"
  },
  {
    value: "TRINIDAD AND TOBAGO",
    label: "TRINIDAD AND TOBAGO"
  },
  {
    value: "TUNISIA",
    label: "TUNISIA"
  },
  {
    value: "TURKEY",
    label: "TURKEY"
  },
  {
    value: "TURKMENISTAN",
    label: "TURKMENISTAN"
  },
  {
    value: "TURKS AND CAICOS ISLANDS",
    label: "TURKS AND CAICOS ISLANDS"
  },
  {
    value: "TUVALU",
    label: "TUVALU"
  },
  {
    value: "UGANDA",
    label: "UGANDA"
  },
  {
    value: "UKRAINE",
    label: "UKRAINE"
  },
  {
    value: "UNITED ARAB EMIRATES",
    label: "UNITED ARAB EMIRATES"
  },
  {
    value: "UNITED KINGDOM",
    label: "UNITED KINGDOM"
  },
  {
    value: "UNITED STATES",
    label: "UNITED STATES"
  },
  {
    value: "URUGUAY",
    label: "URUGUAY"
  },
  {
    value: "US MINOR OUTLYING ISLANDS",
    label: "US MINOR OUTLYING ISLANDS"
  },
  {
    value: "UZBEKISTAN",
    label: "UZBEKISTAN"
  },
  {
    value: "VANUATU",
    label: "VANUATU"
  },
  {
    value: "VATICAN CITY STATE",
    label: "VATICAN CITY STATE"
  },
  {
    value: "VENEZUELA",
    label: "VENEZUELA"
  },
  {
    value: "VIETNAM",
    label: "VIETNAM"
  },
  {
    value: "VIRGIN ISLANDS",
    label: "VIRGIN ISLANDS"
  },
  {
    value: "VIRGIN ISLANDS (BRITISH)",
    label: "VIRGIN ISLANDS (BRITISH)"
  },
  {
    value: "WALLIS ABD FUTUNA ISLANDS",
    label: "WALLIS ABD FUTUNA ISLANDS"
  },
  {
    value: "WESTERN SAHARA",
    label: "WESTERN SAHARA"
  },
  {
    value: "YEMEN",
    label: "YEMEN"
  },
  {
    value: "YUGOSLAVIA",
    label: "YUGOSLAVIA"
  },
  {
    value: "ZAIRE",
    label: "ZAIRE"
  },
  {
    value: "ZAMBIA",
    label: "ZAMBIA"
  },
  {
    value: "ZIMBABWE",
    label: "ZIMBABWE"
  }
];

export const config: StateConfig = {
  slug: "michigan",
  stateName: "Michigan",
  officialAgencyName: "Michigan Department of Natural Resources",
  officialPortalName: "Michigan DNR eLicense",
  officialPortalUrl: "https://mdnr-elicense.com/",
  lastVerified: "2026-07-18",
  requiresSSN: false,
  ssnExplainer: "Michigan does NOT require a Social Security number to buy a fishing license. The official eLicense customer profile form (mdnr-elicense.com/Customer/Create) has no SSN field; identity is established with a driver's license/state ID, DNR Sportcard, or DNR customer number.",
  // The official portal asks a single 'Michigan resident' Yes/No declaration,
  // so the research defines exactly two residency options. Senior (65+ or
  // legally blind) and youth (16 & under) licenses below carry residency
  // 'senior'/'youth' per the research; on the portal they are gated by the
  // resident declaration + age, not by a separate residency dropdown.
  residencyOptions: [
    {
      value: "resident",
      label: "Yes, MI Resident"
    },
    {
      value: "nonresident",
      label: "No, Non-Resident"
    }
  ],
  licenseYearNote: "Annual licenses are valid from March 1 of a given year through March 31 of the following year. Current license year: March 1, 2026 - March 31, 2027 (2026 fishing regulation season applies April 1, 2026 - March 31, 2027). Daily license is valid 24 hours from the date/time the purchaser selects.",
  licenses: [
    {
      id: "annual-all-species-resident",
      name: "Annual all species resident",
      price: 19.9833333333,
      residency: "resident",
      duration: "Annual",
      category: "all-water",
      description: "Good for all species allowed for harvest. Price includes a $1 conservation-education surcharge. Valid Mar 1 - Mar 31 of the following year.",
      officialNote: "Name/price per michigan.gov/dnr/things-to-do/fishing/license-info and 2026 DNR press release (Mar 2, 2026).",
    },
    {
      id: "annual-all-species-nonresident",
      name: "Annual all species nonresident",
      price: 49.9833333333,
      residency: "nonresident",
      duration: "Annual",
      category: "all-water",
      description: "Good for all species allowed for harvest. Price includes a $1 conservation-education surcharge. Valid Mar 1 - Mar 31 of the following year.",
      officialNote: "Name/price per michigan.gov/dnr/things-to-do/fishing/license-info and 2026 DNR press release (Mar 2, 2026).",
    },
    // Portal gates senior items behind the 'Michigan resident' = Yes declaration
    // plus age 65+ (eLicense FAQ: 'DNR will perform random audits').
    {
      id: "annual-all-species-senior",
      name: "Annual all species senior (65+ or who are legally blind, Michigan residents only)",
      price: 11,
      residency: "senior",
      duration: "Annual",
      category: "all-water",
      description: "For Michigan residents age 65 or older, or Michigan residents who are legally blind. Includes $1 surcharge.",
      officialNote: "Name/price per michigan.gov/dnr/things-to-do/fishing/license-info; senior discount age 65+ confirmed in eLicense FAQ.",
    },
    // Purchase flow: on the official portal the buyer of a daily license sets
    // the date/time the license starts (valid 24 hours). Resolved in QA phase —
    // see the conditional `licenseStartDate` field appended to formFields.
    {
      id: "daily-all-species",
      name: "Daily all species resident/nonresident",
      price: 13.3166666667,
      residency: "any",
      duration: "1-Day",
      category: "all-water",
      description: "Valid for 24 hours; the purchaser sets the date/time for the license to start. May be purchased as needed ($10/day).",
      officialNote: "Name/price per michigan.gov/dnr/things-to-do/fishing/license-info and eRegulations official digest.",
    },
    // Multi-day all-species licenses (nonresident). MDNR's daily all-species
    // license is $10/day and may be bought for multiple consecutive days; these
    // fixed 2–9 day SKUs package that so a nonresident angler can choose the
    // duration up front. Base price is set so displayPrice() (×PRICE_MARKUP)
    // lands on the advertised multi-day total. Residents use the 1-Day
    // "daily-all-species" SKU (residency: any) and add days as needed.
    {
      id: "nonresident-2-day-all-species",
      name: "2-Day all species (nonresident)",
      price: 18.3166666667,
      residency: "nonresident",
      duration: "2-Day",
      category: "all-water",
      description: "Valid for two consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for two consecutive days.",
    },
    {
      id: "nonresident-3-day-all-species",
      name: "3-Day all species (nonresident)",
      price: 23.3166666667,
      residency: "nonresident",
      duration: "3-Day",
      category: "all-water",
      description: "Valid for three consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for three consecutive days.",
    },
    {
      id: "nonresident-4-day-all-species",
      name: "4-Day all species (nonresident)",
      price: 26.65,
      residency: "nonresident",
      duration: "4-Day",
      category: "all-water",
      description: "Valid for four consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for four consecutive days.",
    },
    {
      id: "nonresident-5-day-all-species",
      name: "5-Day all species (nonresident)",
      price: 29.9833333333,
      residency: "nonresident",
      duration: "5-Day",
      category: "all-water",
      description: "Valid for five consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for five consecutive days.",
    },
    {
      id: "nonresident-6-day-all-species",
      name: "6-Day all species (nonresident)",
      price: 33.3166666667,
      residency: "nonresident",
      duration: "6-Day",
      category: "all-water",
      description: "Valid for six consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for six consecutive days.",
    },
    {
      id: "nonresident-7-day-all-species",
      name: "7-Day all species (nonresident)",
      price: 36.65,
      residency: "nonresident",
      duration: "7-Day",
      category: "all-water",
      description: "Valid for seven consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for seven consecutive days.",
    },
    {
      id: "nonresident-8-day-all-species",
      name: "8-Day all species (nonresident)",
      price: 39.9833333333,
      residency: "nonresident",
      duration: "8-Day",
      category: "all-water",
      description: "Valid for eight consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for eight consecutive days.",
    },
    {
      id: "nonresident-9-day-all-species",
      name: "9-Day all species (nonresident)",
      price: 44.9833333333,
      residency: "nonresident",
      duration: "9-Day",
      category: "all-water",
      description: "Valid for nine consecutive days from your selected start date. Michigan daily all-species fishing for nonresidents.",
      officialNote: "MDNR daily all-species license ($10/day) purchased for nine consecutive days.",
    },
    // eLicense catalog item '(204) Voluntary Fish All Species Youth'. Portal gates
    // youth (16 & under) items by date of birth, not by a residency dropdown.
    {
      id: "voluntary-youth-annual-all-species",
      name: "Annual all-species youth (voluntary license for residents or nonresidents under the age of 17)",
      price: 2,
      residency: "youth",
      duration: "Annual",
      category: "all-water",
      description: "Voluntary license for anglers age 16 and under (not required). Includes $1 surcharge. eLicense catalog item: '(204) Voluntary Fish All Species Youth'.",
      officialNote: "Name/price per michigan.gov license-info page; catalog name/item #204 per official DNR how-to page.",
    },
    // Free ($0) official license; harvest/effort reporting required after harvest.
    {
      id: "underwater-spearfishing",
      name: "Underwater spearfishing (resident or nonresident)",
      price: 0,
      residency: "any",
      duration: "Annual",
      category: "other",
      description: "No cost. Required for underwater spearfishing as described in the Bow & Spear Fishing Regulations; harvest/effort reporting is required. A DNR Sportcard may be needed.",
      officialNote: "Per michigan.gov/dnr/things-to-do/fishing/license-info and eRegulations official digest.",
    },
    {
      id: "hunt-fish-combo-resident",
      name: "Hunt/Fish Combo Resident",
      price: 49.9833333333,
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description: "Combo includes base hunting license, 2 deer licenses and annual all-species fishing. Includes $1 surcharge.",
      officialNote: "Per michigan.gov/dnr/things-to-do/fishing/license-info and eRegulations official digest.",
    },
    {
      id: "hunt-fish-combo-senior",
      name: "Hunt/Fish Combo Senior",
      price: 43,
      residency: "senior",
      duration: "Annual",
      category: "combo",
      description: "For Michigan residents 65+. Combo includes base hunting license, 2 deer licenses and annual all-species fishing. Includes $1 surcharge.",
      officialNote: "Per michigan.gov/dnr/things-to-do/fishing/license-info and eRegulations official digest.",
    },
    {
      id: "hunt-fish-combo-nonresident",
      name: "Hunt/Fish Combo Nonresident",
      price: 126.65,
      residency: "nonresident",
      duration: "Annual",
      category: "combo",
      description: "Combo includes base hunting license, 2 deer licenses and annual all-species fishing. Includes $1 surcharge.",
      officialNote: "Per michigan.gov/dnr/things-to-do/fishing/license-info and eRegulations official digest.",
    },
  ],
  addOns: [
    // NOT a fishing endorsement and NOT required for all buyers: the portal adds it to
    // the cart only via 'Purchase a Sportcard instead' when the buyer has no driver's
    // license/state ID. Two proofs of Michigan residency are requested when buying one.
    {
      id: "dnr-sportcard",
      name: "DNR Sportcard",
      price: 1,
      required: false,
      description: "Identification card (eLicense item 000). Not a fishing endorsement: it is added to the cart only when the buyer chooses 'Purchase a Sportcard instead' in the Provide Identification dialog (i.e., has no driver's license/state ID to use). When a Sportcard is purchased, two proofs of Michigan residency are requested for resident pricing.",
      officialNote: "Price/item per michigan.gov license-info page and official DNR youth-license how-to; residency-proof note per 2026 Michigan Fishing Regulations.",
    },
  ],
  formFields: [
    {
      name: "idType",
      section: "Identification",
      label: "Choose an identification option",
      type: "select",
      required: true,
      options: [
        {
          value: "Driver's License/State ID",
          label: "Driver's License/State ID"
        },
        {
          value: "Sportcard Number",
          label: "Sportcard Number"
        },
        {
          value: "Customer Number",
          label: "Customer Number"
        }
      ],
      step: 2,
      officialNote: "Exact label/options from eLicense 'ID & Birthdate Search' dialog; same ID options are used by the purchase-time 'Provide Identification' dialog (per official DNR how-to).",
    },
    {
      name: "idNumber",
      section: "Identification",
      label: "Identification Number",
      type: "text",
      required: true,
      step: 2,
      officialNote: "Exact label from eLicense 'ID & Birthdate Search' dialog.",
    },
    // Shown only when idType === "Driver's License/State ID" (mirrors the portal's
    // conditional 'Driver's License State' dropdown in the ID & Birthdate dialog).
    {
      name: "driversLicenseState",
      section: "Identification",
      label: "Driver's License State",
      type: "select",
      required: true,
      options: stateProvOptions,
      conditional: {
        field: "idType",
        equals: "Driver's License/State ID"
      },
      step: 2,
      officialNote: "Exact label + full option list copied verbatim from eLicense (MICHIGAN pinned first and repeated alphabetically; 'AMERICAN SOMOA' spelling is the portal's own).",
    },
    // Display order First -> Middle -> Last intentionally differs from the
    // official DNR portal (which lists Last -> First -> Middle). We are a
    // consumer-facing assistance service, so we use the familiar consumer
    // order matching usafishingassistant.com. Field NAMES/values are
    // unchanged, so the data submitted to the official portal is identical.
    {
      name: "firstName",
      section: "Personal details",
      label: "First Name",
      type: "text",
      required: true,
      autocomplete: "given-name",
      step: 2,
    },
    {
      name: "middleName",
      section: "Personal details",
      label: "Middle Name",
      type: "text",
      required: false,
      autocomplete: "additional-name",
      step: 2,
    },
    {
      name: "lastName",
      section: "Personal details",
      label: "Last Name",
      type: "text",
      required: true,
      autocomplete: "family-name",
      step: 2,
    },
    {
      name: "suffix",
      section: "Personal details",
      label: "Suffix",
      type: "select",
      required: false,
      options: [
        {
          value: "JR",
          label: "JR"
        },
        {
          value: "SR",
          label: "SR"
        },
        {
          value: "II",
          label: "II"
        },
        {
          value: "III",
          label: "III"
        },
        {
          value: "IV",
          label: "IV"
        },
        {
          value: "V",
          label: "V"
        },
        {
          value: "I",
          label: "I"
        },
        {
          value: "VI",
          label: "VI"
        },
        {
          value: "VII",
          label: "VII"
        },
        {
          value: "VIII",
          label: "VIII"
        }
      ],
      step: 2,
      officialNote: "Option order is exactly as rendered on the portal.",
    },
    {
      name: "dateOfBirth",
      section: "Personal details",
      label: "Date of Birth",
      type: "date",
      required: true,
      placeholder: "mm/dd/yyyy",
      mask: "dob",
      step: 2,
    },
    {
      name: "gender",
      section: "Personal details",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        {
          value: "FEMALE",
          label: "FEMALE"
        },
        {
          value: "MALE",
          label: "MALE"
        },
        {
          value: "NON-BINARY",
          label: "NON-BINARY"
        },
        {
          value: "OTHER",
          label: "OTHER"
        }
      ],
      step: 2,
    },
    {
      name: "heightFt",
      section: "Personal details",
      label: "Height (ft)",
      type: "select",
      required: true,
      options: [
        {
          value: "0",
          label: "0"
        },
        {
          value: "1",
          label: "1"
        },
        {
          value: "2",
          label: "2"
        },
        {
          value: "3",
          label: "3"
        },
        {
          value: "4",
          label: "4"
        },
        {
          value: "5",
          label: "5"
        },
        {
          value: "6",
          label: "6"
        },
        {
          value: "7",
          label: "7"
        },
        {
          value: "8",
          label: "8"
        },
        {
          value: "9",
          label: "9"
        },
        {
          value: "10",
          label: "10"
        }
      ],
      step: 2,
    },
    {
      name: "heightIn",
      section: "Personal details",
      label: "Height (in)",
      type: "select",
      required: true,
      options: [
        {
          value: "0",
          label: "0"
        },
        {
          value: "1",
          label: "1"
        },
        {
          value: "2",
          label: "2"
        },
        {
          value: "3",
          label: "3"
        },
        {
          value: "4",
          label: "4"
        },
        {
          value: "5",
          label: "5"
        },
        {
          value: "6",
          label: "6"
        },
        {
          value: "7",
          label: "7"
        },
        {
          value: "8",
          label: "8"
        },
        {
          value: "9",
          label: "9"
        },
        {
          value: "10",
          label: "10"
        },
        {
          value: "11",
          label: "11"
        }
      ],
      step: 2,
    },
    // TODO(verify): portal states no min/max for weight — the 1-999 validation is a
    // sane UI constraint flagged in the research, not an official rule.
    {
      name: "weightPounds",
      section: "Personal details",
      label: "Weight (pounds)",
      type: "number",
      required: true,
      validation: {
        min: 1,
        max: 999
      },
      step: 2,
      officialNote: "Rendered as a numeric free-text field on the portal; no bounds stated \u2014 min/max here are a sane form constraint, not an official rule.",
    },
    {
      name: "driversLicense",
      section: "Personal details",
      label: "Driver's License",
      type: "text",
      required: false,
      hidden: true,
      step: 2,
      officialNote: "Optional free-text field in the portal's Customer Detail section (no asterisk).",
    },
    // 'I wish to receive DNR updates:' group — both checkboxes are PRE-CHECKED on
    // the portal; rendered here as optional checkboxes (scaffold has no default-
    // checked checkbox support; values still submit true/false).
    {
      name: "updatesEmail",
      section: "Personal details",
      label: "I wish to receive DNR updates: via email",
      type: "checkbox",
      required: false,
      hidden: true,
      step: 2,
      officialNote: "Checkbox group label 'I wish to receive DNR updates:' with 'via email' option; checked by default on the portal.",
    },
    {
      name: "updatesText",
      section: "Personal details",
      label: "via text message",
      type: "checkbox",
      required: false,
      hidden: true,
      step: 2,
      officialNote: "Second option of the 'I wish to receive DNR updates:' group; checked by default on the portal.",
    },
    {
      name: "email",
      section: "Personal details",
      label: "Email",
      type: "email",
      required: true,
      autocomplete: "email",
      step: 2,
    },
    {
      name: "primaryPhone",
      section: "Personal details",
      label: "Primary Phone",
      type: "tel",
      required: false,
      mask: "phone",
      autocomplete: "tel",
      step: 2,
    },
    {
      name: "secondaryPhone",
      section: "Personal details",
      label: "Secondary Phone",
      type: "tel",
      required: false,
      mask: "phone",
      step: 2,
    },
    {
      name: "resStreet1",
      section: "Residence",
      label: "Street 1",
      type: "text",
      required: true,
      helpText: "Residence Address",
      autocomplete: "address-line1",
      step: 2,
    },
    {
      name: "resStreet2",
      section: "Residence",
      label: "Street 2",
      type: "text",
      required: false,
      autocomplete: "address-line2",
      step: 2,
    },
    {
      name: "resCity",
      section: "Residence",
      label: "City",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      step: 2,
    },
    {
      name: "resState",
      section: "Residence",
      label: "State/Prov",
      type: "select",
      required: true,
      options: stateProvOptions,
      step: 2,
      officialNote: "Same verbatim State/Prov list as the portal; defaults to MICHIGAN.",
    },
    {
      name: "resZip",
      section: "Residence",
      label: "Zip/Postal Code",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "postal-code",
      step: 2,
    },
    {
      name: "resCountry",
      section: "Residence",
      label: "Country",
      type: "select",
      required: true,
      options: countryOptions,
      step: 2,
      officialNote: "Full 242-entry country list copied verbatim from the portal; defaults to UNITED STATES.",
    },
    {
      name: "mailStreet1",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "Street 1",
      type: "text",
      required: false,
      helpText: "Where should mail be sent, if different from your residence?",
      step: 2,
    },
    {
      name: "mailStreet2",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "Street 2",
      type: "text",
      required: false,
      step: 2,
    },
    {
      name: "mailCity",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "City",
      type: "text",
      required: false,
      step: 2,
    },
    {
      name: "mailState",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "State/Prov",
      type: "select",
      required: false,
      options: stateProvOptions,
      step: 2,
    },
    {
      name: "mailZip",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "Zip/Postal Code",
      type: "zip",
      required: false,
      mask: "zip",
      step: 2,
    },
    {
      name: "mailCountry",
      section: "Mailing address",
      conditional: { field: "mailingDifferent", equals: "true" },
      label: "Country",
      type: "select",
      required: false,
      options: countryOptions,
      step: 2,
    },
    // Portal 'Customer Declaration Information' section. This Yes/No declaration is
    // what gates resident-only catalog items on the official portal (residency proof
    // is enforced via the ID/Sportcard requirement at purchase).
    {
      name: "michiganResident",
      section: "Residence",
      // Auto-derived from the Step 1 residency choice (syncResidencyField), so
      // we never re-ask it on the applicant form. Still validated + submitted.
      hidden: true,
      label: "Michigan resident",
      type: "select",
      required: true,
      options: [
        {
          value: "Yes",
          label: "Yes"
        },
        {
          value: "No",
          label: "No"
        }
      ],
      helpText: "Select YES if you are a Michigan resident.",
      step: 2,
      officialNote: "Exact label/help text from the portal's 'Customer Declaration Information' section. Resident = domiciled in MI with intent to remain, full-time MI college student residing in MI, or full-time U.S. military stationed in MI / maintaining MI residency.",
    },
    // Purchase-flow addition (NOT part of the official Create New Customer
    // form): the official portal asks the buyer of the 24-hour Daily all
    // species license to set the date/time the license starts. Shown only
    // when the daily license is selected in step 1 (conditional on licenseId).
    {
      name: "licenseStartDate",
      section: "License start date",
      label: "License start date",
      type: "date",
      required: true,
      conditional: {
        field: "licenseId",
        oneOf: [
          "daily-all-species",
          "nonresident-2-day-all-species",
          "nonresident-3-day-all-species",
          "nonresident-4-day-all-species",
          "nonresident-5-day-all-species",
          "nonresident-6-day-all-species",
          "nonresident-7-day-all-species",
          "nonresident-8-day-all-species",
          "nonresident-9-day-all-species",
        ],
      },
      helpText: "Choose when your license should start — daily and multi-day licenses are valid for the number of consecutive days shown on your selected license.",
      step: 2,
      officialNote: "Portal purchase flow sets the start date/time for the Daily all species license ($10/day, valid from the selected date). Multi-day licenses run consecutive days from that start date. Collected here so the purchase can be completed on the applicant's behalf.",
    },
  ],
  stateIdentifiers: [
    {
      name: "DNR Sportcard",
      label: "Sportcard Number",
      required: false,
      helpText: "$1 identification card issued by license dealers (eLicense item 000). Used as the ID for license purchases when the buyer has no driver's license/state ID; two proofs of Michigan residency are requested when buying one."
    },
    {
      name: "DNR Customer Number",
      label: "Customer Number",
      required: false,
      helpText: "Existing eLicense customer ID; can be used (with date of birth) to sign in and purchase without an account."
    }
  ],
  consentExtra: "Customer Profile Acknowledgement Review: \"By selecting the 'Save' button you are agreeing to the State of Michigan policies, terms, and conditions and acknowledging the customer profile is accurate.\" (verbatim from the eLicense Create New Customer page)",
  researchNotes: "Portal flow (verified 2026-07-18 on mdnr-elicense.com): Sign in via (a) Username & Password or (b) ID & Birthdate (identification option: Driver's License/State ID, Sportcard Number, or Customer Number + Identification Number + Driver's License State + Date of Birth). New users without an ID record use the 'New Customer' / Create New Customer form whose fields are mirrored 1:1 in formFields. Purchase: Product Catalog > Fish tab > select license > 'Provide Identification' dialog (enter ID or 'Purchase a Sportcard instead', $1) > cart > Checkout > optional 'Hunters Feeding Michigan' donation prompt (declinable; NOT a license fee) > shipping info review > credit card > Purchase Product(s). Auto-renew is offered at online checkout for annual licenses. NO SSN is collected and there are NO eye-color/hair-color/race fields on the current eLicense profile form (observed directly). Michigan has no trout/salmon stamps: all fishing licenses are good for all species. Sturgeon permit/harvest tags were eliminated (free online harvest registration within 24 hours instead). Fees verified on three official sources for the current (2026-27) license year: michigan.gov license-info page, official eRegulations digest, and the DNR's Mar 2, 2026 press release \u2014 resident annual $26, nonresident annual $76, senior annual $11 (MI residents 65+ or legally blind), daily $10/24 hrs, voluntary youth $2 (16 & under), underwater spearfishing free, Hunt/Fish combos $76/$43/$266, DNR Sportcard $1. Annual/combo prices include a $1 conservation-education surcharge. A 72-hour $30 fishing license existed in 2016 but is NO LONGER offered \u2014 do not include it. Free licenses: MI-resident active-duty military; MI-resident veterans rated 100% disabled or individually unemployable. eLicense catalog item names verified only for '(000) DNR Sportcard' and '(204) Voluntary Fish All Species Youth'; other catalog display names are not publicly visible without an account \u2014 license 'name' values use the official names from michigan.gov's license-info page instead.\n\nSources (verified 2026-07-18):\n- https://mdnr-elicense.com/\n- https://mdnr-elicense.com/Customer/Login?mode=0\n- https://mdnr-elicense.com/Customer/Create\n- https://www.mdnr-elicense.com/home/FAQ\n- https://www.michigan.gov/dnr/things-to-do/fishing/license-info\n- https://www.michigan.gov/dnr/things-to-do/fishing/license-info/youth-voluntary-fishing-license-how-to\n- https://www.michigan.gov/dnr/about/newsroom/releases/2026/03/02/2026-michigan-fishing-licenses-now-available\n- https://www.michigan.gov/dnr/about/newsroom/releases/2025/03/03/2025-michigan-fishing-licenses-now-available\n- https://www.eregulations.com/michigan/fishing/fishing-license-information\n- https://www.michigan.gov/dnr/-/media/Project/Websites/dnr/Documents/LED/digests/2026-Michigan-Fishing-Regulations_web_accessible.pdf",
};

export default config;
