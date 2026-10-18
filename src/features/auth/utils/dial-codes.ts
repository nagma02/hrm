export interface DialCountry {
  /** ISO 3166-1 alpha-2, lowercase (used for the flag image) */
  iso: string
  name: string
  dialCode: string
}

// Shared codes (e.g. +1, +7) resolve to the most common country for that code;
// NANP territories use their full 4-digit code (+1 876 Jamaica) so they still match.
const DIAL_COUNTRIES: DialCountry[] = [
  { iso: 'us', name: 'United States', dialCode: '1' },
  { iso: 'ca', name: 'Canada', dialCode: '1' },
  { iso: 'ag', name: 'Antigua and Barbuda', dialCode: '1268' },
  { iso: 'ai', name: 'Anguilla', dialCode: '1264' },
  { iso: 'as', name: 'American Samoa', dialCode: '1684' },
  { iso: 'bb', name: 'Barbados', dialCode: '1246' },
  { iso: 'bm', name: 'Bermuda', dialCode: '1441' },
  { iso: 'bs', name: 'Bahamas', dialCode: '1242' },
  { iso: 'dm', name: 'Dominica', dialCode: '1767' },
  { iso: 'do', name: 'Dominican Republic', dialCode: '1809' },
  { iso: 'gd', name: 'Grenada', dialCode: '1473' },
  { iso: 'gu', name: 'Guam', dialCode: '1671' },
  { iso: 'jm', name: 'Jamaica', dialCode: '1876' },
  { iso: 'kn', name: 'Saint Kitts and Nevis', dialCode: '1869' },
  { iso: 'ky', name: 'Cayman Islands', dialCode: '1345' },
  { iso: 'lc', name: 'Saint Lucia', dialCode: '1758' },
  { iso: 'mp', name: 'Northern Mariana Islands', dialCode: '1670' },
  { iso: 'ms', name: 'Montserrat', dialCode: '1664' },
  { iso: 'pr', name: 'Puerto Rico', dialCode: '1787' },
  { iso: 'sx', name: 'Sint Maarten', dialCode: '1721' },
  { iso: 'tc', name: 'Turks and Caicos Islands', dialCode: '1649' },
  { iso: 'tt', name: 'Trinidad and Tobago', dialCode: '1868' },
  { iso: 'vc', name: 'Saint Vincent and the Grenadines', dialCode: '1784' },
  { iso: 'vg', name: 'British Virgin Islands', dialCode: '1284' },
  { iso: 'vi', name: 'U.S. Virgin Islands', dialCode: '1340' },
  { iso: 'ru', name: 'Russia', dialCode: '7' },
  { iso: 'kz', name: 'Kazakhstan', dialCode: '7' },
  { iso: 'eg', name: 'Egypt', dialCode: '20' },
  { iso: 'za', name: 'South Africa', dialCode: '27' },
  { iso: 'gr', name: 'Greece', dialCode: '30' },
  { iso: 'nl', name: 'Netherlands', dialCode: '31' },
  { iso: 'be', name: 'Belgium', dialCode: '32' },
  { iso: 'fr', name: 'France', dialCode: '33' },
  { iso: 'es', name: 'Spain', dialCode: '34' },
  { iso: 'hu', name: 'Hungary', dialCode: '36' },
  { iso: 'it', name: 'Italy', dialCode: '39' },
  { iso: 'ro', name: 'Romania', dialCode: '40' },
  { iso: 'ch', name: 'Switzerland', dialCode: '41' },
  { iso: 'at', name: 'Austria', dialCode: '43' },
  { iso: 'gb', name: 'United Kingdom', dialCode: '44' },
  { iso: 'dk', name: 'Denmark', dialCode: '45' },
  { iso: 'se', name: 'Sweden', dialCode: '46' },
  { iso: 'no', name: 'Norway', dialCode: '47' },
  { iso: 'pl', name: 'Poland', dialCode: '48' },
  { iso: 'de', name: 'Germany', dialCode: '49' },
  { iso: 'pe', name: 'Peru', dialCode: '51' },
  { iso: 'mx', name: 'Mexico', dialCode: '52' },
  { iso: 'cu', name: 'Cuba', dialCode: '53' },
  { iso: 'ar', name: 'Argentina', dialCode: '54' },
  { iso: 'br', name: 'Brazil', dialCode: '55' },
  { iso: 'cl', name: 'Chile', dialCode: '56' },
  { iso: 'co', name: 'Colombia', dialCode: '57' },
  { iso: 've', name: 'Venezuela', dialCode: '58' },
  { iso: 'my', name: 'Malaysia', dialCode: '60' },
  { iso: 'au', name: 'Australia', dialCode: '61' },
  { iso: 'id', name: 'Indonesia', dialCode: '62' },
  { iso: 'ph', name: 'Philippines', dialCode: '63' },
  { iso: 'nz', name: 'New Zealand', dialCode: '64' },
  { iso: 'sg', name: 'Singapore', dialCode: '65' },
  { iso: 'th', name: 'Thailand', dialCode: '66' },
  { iso: 'jp', name: 'Japan', dialCode: '81' },
  { iso: 'kr', name: 'South Korea', dialCode: '82' },
  { iso: 'vn', name: 'Vietnam', dialCode: '84' },
  { iso: 'cn', name: 'China', dialCode: '86' },
  { iso: 'tr', name: 'Turkey', dialCode: '90' },
  { iso: 'in', name: 'India', dialCode: '91' },
  { iso: 'pk', name: 'Pakistan', dialCode: '92' },
  { iso: 'af', name: 'Afghanistan', dialCode: '93' },
  { iso: 'lk', name: 'Sri Lanka', dialCode: '94' },
  { iso: 'mm', name: 'Myanmar', dialCode: '95' },
  { iso: 'ir', name: 'Iran', dialCode: '98' },
  { iso: 'ss', name: 'South Sudan', dialCode: '211' },
  { iso: 'ma', name: 'Morocco', dialCode: '212' },
  { iso: 'dz', name: 'Algeria', dialCode: '213' },
  { iso: 'tn', name: 'Tunisia', dialCode: '216' },
  { iso: 'ly', name: 'Libya', dialCode: '218' },
  { iso: 'gm', name: 'Gambia', dialCode: '220' },
  { iso: 'sn', name: 'Senegal', dialCode: '221' },
  { iso: 'mr', name: 'Mauritania', dialCode: '222' },
  { iso: 'ml', name: 'Mali', dialCode: '223' },
  { iso: 'gn', name: 'Guinea', dialCode: '224' },
  { iso: 'ci', name: "Côte d'Ivoire", dialCode: '225' },
  { iso: 'bf', name: 'Burkina Faso', dialCode: '226' },
  { iso: 'ne', name: 'Niger', dialCode: '227' },
  { iso: 'tg', name: 'Togo', dialCode: '228' },
  { iso: 'bj', name: 'Benin', dialCode: '229' },
  { iso: 'mu', name: 'Mauritius', dialCode: '230' },
  { iso: 'lr', name: 'Liberia', dialCode: '231' },
  { iso: 'sl', name: 'Sierra Leone', dialCode: '232' },
  { iso: 'gh', name: 'Ghana', dialCode: '233' },
  { iso: 'ng', name: 'Nigeria', dialCode: '234' },
  { iso: 'td', name: 'Chad', dialCode: '235' },
  { iso: 'cf', name: 'Central African Republic', dialCode: '236' },
  { iso: 'cm', name: 'Cameroon', dialCode: '237' },
  { iso: 'cv', name: 'Cape Verde', dialCode: '238' },
  { iso: 'st', name: 'São Tomé and Príncipe', dialCode: '239' },
  { iso: 'gq', name: 'Equatorial Guinea', dialCode: '240' },
  { iso: 'ga', name: 'Gabon', dialCode: '241' },
  { iso: 'cg', name: 'Republic of the Congo', dialCode: '242' },
  { iso: 'cd', name: 'DR Congo', dialCode: '243' },
  { iso: 'ao', name: 'Angola', dialCode: '244' },
  { iso: 'gw', name: 'Guinea-Bissau', dialCode: '245' },
  { iso: 'io', name: 'British Indian Ocean Territory', dialCode: '246' },
  { iso: 'sc', name: 'Seychelles', dialCode: '248' },
  { iso: 'sd', name: 'Sudan', dialCode: '249' },
  { iso: 'rw', name: 'Rwanda', dialCode: '250' },
  { iso: 'et', name: 'Ethiopia', dialCode: '251' },
  { iso: 'so', name: 'Somalia', dialCode: '252' },
  { iso: 'dj', name: 'Djibouti', dialCode: '253' },
  { iso: 'ke', name: 'Kenya', dialCode: '254' },
  { iso: 'tz', name: 'Tanzania', dialCode: '255' },
  { iso: 'ug', name: 'Uganda', dialCode: '256' },
  { iso: 'bi', name: 'Burundi', dialCode: '257' },
  { iso: 'mz', name: 'Mozambique', dialCode: '258' },
  { iso: 'zm', name: 'Zambia', dialCode: '260' },
  { iso: 'mg', name: 'Madagascar', dialCode: '261' },
  { iso: 're', name: 'Réunion', dialCode: '262' },
  { iso: 'zw', name: 'Zimbabwe', dialCode: '263' },
  { iso: 'na', name: 'Namibia', dialCode: '264' },
  { iso: 'mw', name: 'Malawi', dialCode: '265' },
  { iso: 'ls', name: 'Lesotho', dialCode: '266' },
  { iso: 'bw', name: 'Botswana', dialCode: '267' },
  { iso: 'sz', name: 'Eswatini', dialCode: '268' },
  { iso: 'km', name: 'Comoros', dialCode: '269' },
  { iso: 'sh', name: 'Saint Helena', dialCode: '290' },
  { iso: 'er', name: 'Eritrea', dialCode: '291' },
  { iso: 'aw', name: 'Aruba', dialCode: '297' },
  { iso: 'fo', name: 'Faroe Islands', dialCode: '298' },
  { iso: 'gl', name: 'Greenland', dialCode: '299' },
  { iso: 'gi', name: 'Gibraltar', dialCode: '350' },
  { iso: 'pt', name: 'Portugal', dialCode: '351' },
  { iso: 'lu', name: 'Luxembourg', dialCode: '352' },
  { iso: 'ie', name: 'Ireland', dialCode: '353' },
  { iso: 'is', name: 'Iceland', dialCode: '354' },
  { iso: 'al', name: 'Albania', dialCode: '355' },
  { iso: 'mt', name: 'Malta', dialCode: '356' },
  { iso: 'cy', name: 'Cyprus', dialCode: '357' },
  { iso: 'fi', name: 'Finland', dialCode: '358' },
  { iso: 'bg', name: 'Bulgaria', dialCode: '359' },
  { iso: 'lt', name: 'Lithuania', dialCode: '370' },
  { iso: 'lv', name: 'Latvia', dialCode: '371' },
  { iso: 'ee', name: 'Estonia', dialCode: '372' },
  { iso: 'md', name: 'Moldova', dialCode: '373' },
  { iso: 'am', name: 'Armenia', dialCode: '374' },
  { iso: 'by', name: 'Belarus', dialCode: '375' },
  { iso: 'ad', name: 'Andorra', dialCode: '376' },
  { iso: 'mc', name: 'Monaco', dialCode: '377' },
  { iso: 'sm', name: 'San Marino', dialCode: '378' },
  { iso: 'va', name: 'Vatican City', dialCode: '379' },
  { iso: 'ua', name: 'Ukraine', dialCode: '380' },
  { iso: 'rs', name: 'Serbia', dialCode: '381' },
  { iso: 'me', name: 'Montenegro', dialCode: '382' },
  { iso: 'xk', name: 'Kosovo', dialCode: '383' },
  { iso: 'hr', name: 'Croatia', dialCode: '385' },
  { iso: 'si', name: 'Slovenia', dialCode: '386' },
  { iso: 'ba', name: 'Bosnia and Herzegovina', dialCode: '387' },
  { iso: 'mk', name: 'North Macedonia', dialCode: '389' },
  { iso: 'cz', name: 'Czechia', dialCode: '420' },
  { iso: 'sk', name: 'Slovakia', dialCode: '421' },
  { iso: 'li', name: 'Liechtenstein', dialCode: '423' },
  { iso: 'fk', name: 'Falkland Islands', dialCode: '500' },
  { iso: 'bz', name: 'Belize', dialCode: '501' },
  { iso: 'gt', name: 'Guatemala', dialCode: '502' },
  { iso: 'sv', name: 'El Salvador', dialCode: '503' },
  { iso: 'hn', name: 'Honduras', dialCode: '504' },
  { iso: 'ni', name: 'Nicaragua', dialCode: '505' },
  { iso: 'cr', name: 'Costa Rica', dialCode: '506' },
  { iso: 'pa', name: 'Panama', dialCode: '507' },
  { iso: 'pm', name: 'Saint Pierre and Miquelon', dialCode: '508' },
  { iso: 'ht', name: 'Haiti', dialCode: '509' },
  { iso: 'gp', name: 'Guadeloupe', dialCode: '590' },
  { iso: 'bo', name: 'Bolivia', dialCode: '591' },
  { iso: 'gy', name: 'Guyana', dialCode: '592' },
  { iso: 'ec', name: 'Ecuador', dialCode: '593' },
  { iso: 'gf', name: 'French Guiana', dialCode: '594' },
  { iso: 'py', name: 'Paraguay', dialCode: '595' },
  { iso: 'mq', name: 'Martinique', dialCode: '596' },
  { iso: 'sr', name: 'Suriname', dialCode: '597' },
  { iso: 'uy', name: 'Uruguay', dialCode: '598' },
  { iso: 'cw', name: 'Curaçao', dialCode: '599' },
  { iso: 'tl', name: 'Timor-Leste', dialCode: '670' },
  { iso: 'nf', name: 'Norfolk Island', dialCode: '672' },
  { iso: 'bn', name: 'Brunei', dialCode: '673' },
  { iso: 'nr', name: 'Nauru', dialCode: '674' },
  { iso: 'pg', name: 'Papua New Guinea', dialCode: '675' },
  { iso: 'to', name: 'Tonga', dialCode: '676' },
  { iso: 'sb', name: 'Solomon Islands', dialCode: '677' },
  { iso: 'vu', name: 'Vanuatu', dialCode: '678' },
  { iso: 'fj', name: 'Fiji', dialCode: '679' },
  { iso: 'pw', name: 'Palau', dialCode: '680' },
  { iso: 'wf', name: 'Wallis and Futuna', dialCode: '681' },
  { iso: 'ck', name: 'Cook Islands', dialCode: '682' },
  { iso: 'nu', name: 'Niue', dialCode: '683' },
  { iso: 'ws', name: 'Samoa', dialCode: '685' },
  { iso: 'ki', name: 'Kiribati', dialCode: '686' },
  { iso: 'nc', name: 'New Caledonia', dialCode: '687' },
  { iso: 'tv', name: 'Tuvalu', dialCode: '688' },
  { iso: 'pf', name: 'French Polynesia', dialCode: '689' },
  { iso: 'tk', name: 'Tokelau', dialCode: '690' },
  { iso: 'fm', name: 'Micronesia', dialCode: '691' },
  { iso: 'mh', name: 'Marshall Islands', dialCode: '692' },
  { iso: 'kp', name: 'North Korea', dialCode: '850' },
  { iso: 'hk', name: 'Hong Kong', dialCode: '852' },
  { iso: 'mo', name: 'Macau', dialCode: '853' },
  { iso: 'kh', name: 'Cambodia', dialCode: '855' },
  { iso: 'la', name: 'Laos', dialCode: '856' },
  { iso: 'bd', name: 'Bangladesh', dialCode: '880' },
  { iso: 'tw', name: 'Taiwan', dialCode: '886' },
  { iso: 'mv', name: 'Maldives', dialCode: '960' },
  { iso: 'lb', name: 'Lebanon', dialCode: '961' },
  { iso: 'jo', name: 'Jordan', dialCode: '962' },
  { iso: 'sy', name: 'Syria', dialCode: '963' },
  { iso: 'iq', name: 'Iraq', dialCode: '964' },
  { iso: 'kw', name: 'Kuwait', dialCode: '965' },
  { iso: 'sa', name: 'Saudi Arabia', dialCode: '966' },
  { iso: 'ye', name: 'Yemen', dialCode: '967' },
  { iso: 'om', name: 'Oman', dialCode: '968' },
  { iso: 'ps', name: 'Palestine', dialCode: '970' },
  { iso: 'ae', name: 'United Arab Emirates', dialCode: '971' },
  { iso: 'il', name: 'Israel', dialCode: '972' },
  { iso: 'bh', name: 'Bahrain', dialCode: '973' },
  { iso: 'qa', name: 'Qatar', dialCode: '974' },
  { iso: 'bt', name: 'Bhutan', dialCode: '975' },
  { iso: 'mn', name: 'Mongolia', dialCode: '976' },
  { iso: 'np', name: 'Nepal', dialCode: '977' },
  { iso: 'tj', name: 'Tajikistan', dialCode: '992' },
  { iso: 'tm', name: 'Turkmenistan', dialCode: '993' },
  { iso: 'az', name: 'Azerbaijan', dialCode: '994' },
  { iso: 'ge', name: 'Georgia', dialCode: '995' },
  { iso: 'kg', name: 'Kyrgyzstan', dialCode: '996' },
  { iso: 'uz', name: 'Uzbekistan', dialCode: '998' },
]

// First entry wins for shared codes, so typed +1 / +7 resolve to US / Russia.
const BY_CODE = new Map<string, DialCountry>()
for (const country of DIAL_COUNTRIES) if (!BY_CODE.has(country.dialCode)) BY_CODE.set(country.dialCode, country)

export const INDIA: DialCountry = BY_CODE.get('91')!

/**
 * Display-only country detection for a phone entry. Numbers typed with an
 * international prefix (+ or 00) resolve by longest matching dial code; numbers
 * without one default to India, matching normalizePhoneNumber.
 * Returns null while an international prefix is still incomplete or unknown.
 */
export function detectDialCountry(value: string): DialCountry | null {
  const compact = value.trim().replace(/[\s().-]/g, '')
  const international = compact.startsWith('+') || compact.startsWith('00')
  if (!international) return INDIA
  const digits = compact.replace(/^(\+|00)/, '').replace(/\D/g, '')
  for (let length = Math.min(4, digits.length); length > 0; length -= 1) {
    const match = BY_CODE.get(digits.slice(0, length))
    if (match) return match
  }
  return null
}

/**
 * Detects a country from digits typed without + or 00 (e.g. "966570490448").
 * Only used once the entry is longer than a 10-digit Indian mobile number, so
 * regular Indian numbers keep defaulting to India.
 */
export function detectDialCountryFromDigits(value: string): DialCountry | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10 || digits.startsWith('0')) return null
  return detectDialCountry(`+${digits}`)
}

/** Countries for the picker: India first, then alphabetical. */
export const PICKER_COUNTRIES: DialCountry[] = [
  INDIA,
  ...DIAL_COUNTRIES.filter((country) => country !== INDIA).sort((a, b) => a.name.localeCompare(b.name)),
]

/** True when the entry starts with an international prefix (+ or 00). */
export function hasInternationalPrefix(value: string) {
  return /^\s*(\+|00)/.test(value)
}

/** Removes a leading +code / 00code for the given country, leaving the local number. */
export function stripDialCode(value: string, country: DialCountry) {
  return value.replace(new RegExp(`^\\s*(?:\\+|00)\\s*${country.dialCode}[\\s-]*`), '').trimStart()
}

export function flagUrl(country: DialCountry, width: 40 | 80 = 40) {
  return `https://flagcdn.com/w${width}/${country.iso}.png`
}
