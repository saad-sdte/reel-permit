export type Locale = "en" | "es";

export const LOCALE_COOKIE = "ap_lang";
export const LOCALE_STORAGE_KEY = "preferredLanguage";

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  "nav.home": "Home",
  "nav.howItWorks": "How It Works",
  "nav.states": "States",
  "nav.faq": "FAQ",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.startApplication": "Start My Application",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.primary": "Primary",
  "nav.mobile": "Mobile",
  "nav.homeAria": "ReelPermit — home",

  // Footer
  "footer.site": "Site",
  "footer.legal": "Legal",
  "footer.blurb":
    "A private license-assistance service that handles the paperwork so you can get on the water faster.",
  "footer.howItWorks": "How It Works",
  "footer.faq": "FAQ",
  "footer.statesWeServe": "States We Serve",
  "footer.officialSites": "Official State Websites",
  "footer.aboutUs": "About Us",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.refund": "Refund Policy",
  "footer.disclaimer": "Disclaimer",
  "footer.dataNote":
    "Your data is transmitted over encrypted connections. Sensitive identifiers such as Social Security numbers are masked in all notifications and logs and are never displayed after submission. See our",
  "footer.dataNoteEnd": "for details on how we collect, use, and protect your information.",
  "footer.rights": "All rights reserved.",

  // Apply chrome
  "apply.title": "Apply for {state} Fishing License",
  "apply.subtitle":
    "Complete the form below to order your {state} fishing license. This will take some minutes.",
  "apply.subtitleAdvisors":
    "Complete the form below and our advisors will handle your application.",

  // Shared wizard chrome
  "wizard.continue": "Continue →",
  "wizard.continueShort": "Continue",
  "wizard.continuePayment": "Continue to Payment",
  "wizard.back": "← Back",
  "wizard.backShort": "Back",
  "wizard.remove": "Remove",
  "wizard.completeOrder": "Complete Order",
  "wizard.payment": "Payment",
  "wizard.yourInformation": "Your Information",
  "wizard.idLicense": "ID & License",
  "wizard.applicantInfo": "Applicant Info",
  "wizard.residencyLicense": "Residency & License",
  "wizard.licenseSelection": "License Selection",
  "wizard.personalDetails": "Personal Details",
  "wizard.personalInformation": "Personal information",
  "wizard.yourPersonalInformation": "Your Personal Information",
  "wizard.demographics": "Demographics",
  "wizard.residentialAddress": "Residential Address",
  "wizard.contactInformation": "Contact information",
  "wizard.declarationConsent": "Declaration & Consent",
  "wizard.readMore": "Read More",
  "wizard.showLess": "Show less",
  "wizard.applicationReceived": "Application received",
  "wizard.referenceNumber": "Your reference number",
  "wizard.confirmationEmail": "A confirmation email is on its way to",
  "wizard.state": "State",
  "wizard.firstName": "First name",
  "wizard.middleName": "Middle name",
  "wizard.lastName": "Last name",
  "wizard.dob": "Date of birth",
  "wizard.day": "Day",
  "wizard.month": "Month",
  "wizard.year": "Year",
  "wizard.email": "Email address",
  "wizard.phone": "Phone number",
  "wizard.street": "Street Address",
  "wizard.city": "City",
  "wizard.zip": "ZIP",
  "wizard.zipCode": "ZIP Code",
  "wizard.gender": "Gender",
  "wizard.height": "Height",
  "wizard.heightFt": "Height (ft)",
  "wizard.heightIn": "Height (in)",
  "wizard.weight": "Weight (lbs)",
  "wizard.ssn": "Social Security Number",
  "wizard.country": "Country",
  "wizard.issuingState": "Issuing State",
  "wizard.selectIssuingState": "Select issuing state",
  "wizard.selectState": "Select state",
  "wizard.selectGender": "Select gender",
  "wizard.male": "Male",
  "wizard.female": "Female",
  "wizard.nonBinary": "Non-binary",
  "wizard.preferNot": "Prefer not to say",
  "wizard.idType": "ID Type",
  "wizard.identificationType": "Identification Type",
  "wizard.driversLicense": "Driver's License",
  "wizard.optional": "optional",
  "wizard.dlScanTitle": "Scan Driver's License",
  "wizard.dlScanHint": "Upload a photo or scan of your driver's license. Front and back.",
  "wizard.dlFront": "Driver's License — Front",
  "wizard.dlBack": "Driver's License — Back",
  "wizard.dlClickFront": "Click to upload front",
  "wizard.dlClickBack": "Click to upload back",
  "wizard.dlFileHint": "JPG, PNG or PDF — max 5MB",
  "wizard.dlTooLarge": "Driver's license upload must be 5MB or smaller.",
  "wizard.dlBadType": "Upload must be JPG, PNG, or PDF.",
  "wizard.personalId": "Personal ID Card",
  "wizard.passport": "Passport",
  "wizard.greenCard": "Green Card",
  "wizard.foreignGovId": "Foreign Gov. ID",
  "wizard.stateIdDrivers": "State ID / Driver's License",
  "wizard.enterIdNumber": "Enter your ID number",
  "wizard.consent":
    "I confirm that all information provided is accurate and I agree to the terms and conditions.",
  "wizard.fishingLicenses": "Fishing Licenses",
  "wizard.shortTermLicenses": "Short-Term Fishing Licenses",

  // CA
  "ca.step0Title": "Identification & License Selection",
  "ca.step0Sub": "Select your residency, provide identification, then choose your license type.",
  "ca.primaryResidence": "Primary Residence Type",
  "ca.resident": "California Resident",
  "ca.usCitizen": "U.S. Citizen",
  "ca.international": "International Customer",
  "ca.idNumber": "ID / Driver's License Number",
  "ca.sportFishing": "Sport Fishing Licenses",
  "ca.shortTerm": "Short-Term Options",
  "ca.qualifyResident": "✓ You qualify as a California Resident",
  "ca.personalIntro":
    "Please provide us with some personal information — this is essential for your CA Fishing License guidance.",
  "ca.received":
    "Thank you — your California fishing license application and payment have been received.",

  // FL
  "fl.residencyInfo": "Residency Information",
  "fl.primaryResidence": "Primary Residence Type",
  "fl.resident": "Florida Resident",
  "fl.usCitizen": "U.S. Citizen",
  "fl.international": "International Customer",
  "fl.continuePersonal": "Continue to Personal Details",
  "fl.secure": "Secure Application",

  // TX
  "tx.step0Title": "Residency & License Selection",
  "tx.step0Sub": "Tell us about your residency and select your license type.",
  "tx.primaryInTexas": "Is your primary residence in Texas?",
  "tx.yes": "Yes",
  "tx.no": "No",
  "tx.residentBanner": "✓ You are a Texas Resident",
  "tx.nonResidentBanner": "You are a Non-Resident of Texas",
  "tx.digitalCustomer": "Do you want to be a digital customer?",
  "tx.digitalYes": "Yes (Digital License)",
  "tx.digitalNo": "No (Paper License)",
  "tx.personalIntro":
    "Please provide us with some personal information — this is essential for your TX Fishing License guidance.",

  // MI
  "mi.step0Title": "Identification & License",
  "mi.step0Sub": "Tell us about your residency and provide your ID details.",
  "mi.areYouResident": "Are you a Michigan Resident?",
  "mi.yesResident": "Yes, MI Resident",
  "mi.noNonResident": "No, Non-Resident",
  "mi.residentBanner": "✓ You are a Michigan Resident",

  // NC
  "nc.step0Title": "Identification & License",
  "nc.step0Sub": "Tell us about your residency and provide your ID details.",
  "nc.residencyStatus": "Residency Status",
  "nc.resident": "NC Resident",
  "nc.usCitizen": "US Citizen",
  "nc.international": "International",

  // SC
  "sc.personalIntro":
    "Please provide us with some personal information — this is essential for your SC Fishing License guidance.",
  "sc.resident": "SC Resident",

  // CO
  "co.step0Title": "Residency & License Selection",
  "co.step0Sub": "Tell us about your residency and select your Colorado fishing license.",
  "co.areYouResident": "Are you a Colorado resident?",
  "co.residentBanner": "✓ You are a Colorado Resident",
  "co.nonResidentBanner": "You are a Non-Resident of Colorado",

  // Payment
  "pay.cardNumber": "Card number",
  "pay.expiry": "Expiry (MM/YY)",
  "pay.cvv": "Security code (CVV)",
  "pay.billingZip": "Billing ZIP code",
  "pay.promo": "Promo code",
  "pay.enterCode": "Enter code",
  "pay.payNow": "Pay {amount} securely",
  "pay.processing": "Processing payment…",

  // Months
  "month.January": "January",
  "month.February": "February",
  "month.March": "March",
  "month.April": "April",
  "month.May": "May",
  "month.June": "June",
  "month.July": "July",
  "month.August": "August",
  "month.September": "September",
  "month.October": "October",
  "month.November": "November",
  "month.December": "December",
};

const es: Dict = {
  "nav.home": "Inicio",
  // Keep nav labels short so desktop header stays single-line (EN parity).
  "nav.howItWorks": "Proceso",
  "nav.states": "Estados",
  "nav.faq": "FAQ",
  "nav.about": "Nosotros",
  "nav.contact": "Contacto",
  "nav.startApplication": "Comenzar",
  "nav.openMenu": "Abrir menú",
  "nav.closeMenu": "Cerrar menú",
  "nav.primary": "Principal",
  "nav.mobile": "Móvil",
  "nav.homeAria": "ReelPermit — inicio",

  "footer.site": "Sitio",
  "footer.legal": "Legal",
  "footer.blurb":
    "Un servicio privado de asistencia con licencias que gestiona el papeleo para que puedas estar en el agua más rápido.",
  "footer.howItWorks": "Cómo funciona",
  "footer.faq": "Preguntas frecuentes",
  "footer.statesWeServe": "Estados que cubrimos",
  "footer.officialSites": "Sitios oficiales estatales",
  "footer.aboutUs": "Sobre nosotros",
  "footer.privacy": "Política de privacidad",
  "footer.terms": "Términos del servicio",
  "footer.refund": "Política de reembolso",
  "footer.disclaimer": "Aviso legal",
  "footer.dataNote":
    "Tus datos se transmiten con conexiones cifradas. Identificadores sensibles como números de Seguro Social se ocultan en notificaciones y registros y nunca se muestran después del envío. Consulta nuestra",
  "footer.dataNoteEnd": "para detalles sobre cómo recopilamos, usamos y protegemos tu información.",
  "footer.rights": "Todos los derechos reservados.",

  "apply.title": "Solicitar Licencia de Pesca de {state}",
  "apply.subtitle":
    "Completa el formulario a continuación para tramitar tu licencia de pesca de {state}. Tomará algunos minutos.",
  "apply.subtitleAdvisors":
    "Completa el formulario a continuación y nuestros asesores gestionarán tu solicitud.",

  "wizard.continue": "Continuar →",
  "wizard.continueShort": "Continuar",
  "wizard.continuePayment": "Continuar al pago",
  "wizard.back": "← Atrás",
  "wizard.backShort": "Atrás",
  "wizard.remove": "Quitar",
  "wizard.completeOrder": "Completar pedido",
  "wizard.payment": "Pago",
  "wizard.yourInformation": "Tus Datos",
  "wizard.idLicense": "Identificación y Licencia",
  "wizard.applicantInfo": "Datos del solicitante",
  "wizard.residencyLicense": "Residencia y Licencia",
  "wizard.licenseSelection": "Selección de Licencia",
  "wizard.personalDetails": "Datos Personales",
  "wizard.personalInformation": "Información personal",
  "wizard.yourPersonalInformation": "Tu información personal",
  "wizard.demographics": "Datos demográficos",
  "wizard.residentialAddress": "Dirección residencial",
  "wizard.contactInformation": "Información de contacto",
  "wizard.declarationConsent": "Declaración y consentimiento",
  "wizard.readMore": "Leer más",
  "wizard.showLess": "Mostrar menos",
  "wizard.applicationReceived": "Solicitud recibida",
  "wizard.referenceNumber": "Tu número de referencia",
  "wizard.confirmationEmail": "Un correo de confirmación está en camino a",
  "wizard.state": "Estado",
  "wizard.firstName": "Nombre",
  "wizard.middleName": "Segundo nombre",
  "wizard.lastName": "Apellido",
  "wizard.dob": "Fecha de nacimiento",
  "wizard.day": "Día",
  "wizard.month": "Mes",
  "wizard.year": "Año",
  "wizard.email": "Correo electrónico",
  "wizard.phone": "Teléfono",
  "wizard.street": "Dirección",
  "wizard.city": "Ciudad",
  "wizard.zip": "Código postal",
  "wizard.zipCode": "Código postal",
  "wizard.gender": "Género",
  "wizard.height": "Estatura",
  "wizard.heightFt": "Estatura (pies)",
  "wizard.heightIn": "Estatura (pulg.)",
  "wizard.weight": "Peso (lb)",
  "wizard.ssn": "Número de Seguro Social",
  "wizard.country": "País",
  "wizard.issuingState": "Estado emisor",
  "wizard.selectIssuingState": "Selecciona estado emisor",
  "wizard.selectState": "Selecciona estado",
  "wizard.selectGender": "Selecciona género",
  "wizard.male": "Masculino",
  "wizard.female": "Femenino",
  "wizard.nonBinary": "No binario",
  "wizard.preferNot": "Prefiero no decir",
  "wizard.idType": "Tipo de ID",
  "wizard.identificationType": "Tipo de identificación",
  "wizard.driversLicense": "Licencia de conducir",
  "wizard.optional": "opcional",
  "wizard.dlScanTitle": "Escanear licencia de conducir",
  "wizard.dlScanHint":
    "Sube una foto o escaneo de tu licencia. El frente y el reverso nos ayudan a tramitar tu solicitud más rápido.",
  "wizard.dlFront": "Licencia de conducir — Frente",
  "wizard.dlBack": "Licencia de conducir — Reverso",
  "wizard.dlClickFront": "Haz clic para subir el frente",
  "wizard.dlClickBack": "Haz clic para subir el reverso",
  "wizard.dlFileHint": "JPG, PNG o PDF — máx. 5 MB",
  "wizard.dlTooLarge": "El archivo de la licencia debe ser de 5 MB o menos.",
  "wizard.dlBadType": "El archivo debe ser JPG, PNG o PDF.",
  "wizard.personalId": "Tarjeta de ID personal",
  "wizard.passport": "Pasaporte",
  "wizard.greenCard": "Green Card",
  "wizard.foreignGovId": "ID de gobierno extranjero",
  "wizard.stateIdDrivers": "ID estatal / Licencia de conducir",
  "wizard.enterIdNumber": "Ingresa tu número de ID",
  "wizard.consent":
    "Confirmo que toda la información proporcionada es precisa y acepto los términos y condiciones.",
  "wizard.fishingLicenses": "Licencias de pesca",
  "wizard.shortTermLicenses": "Licencias de pesca de corto plazo",

  "ca.step0Title": "Identificación y selección de licencia",
  "ca.step0Sub":
    "Selecciona tu residencia, proporciona identificación y luego elige tu tipo de licencia.",
  "ca.primaryResidence": "Tipo de residencia principal",
  "ca.resident": "Residente de California",
  "ca.usCitizen": "Ciudadano de EE. UU.",
  "ca.international": "Cliente internacional",
  "ca.idNumber": "Número de ID / Licencia de conducir",
  "ca.sportFishing": "Licencias de pesca deportiva",
  "ca.shortTerm": "Opciones de corto plazo",
  "ca.qualifyResident": "✓ Calificas como residente de California",
  "ca.personalIntro":
    "Proporciónanos algunos datos personales — son esenciales para tu asistencia con la licencia de pesca de CA.",
  "ca.received":
    "Gracias — hemos recibido tu solicitud y el pago de la licencia de pesca de California.",

  "fl.residencyInfo": "Información de residencia",
  "fl.primaryResidence": "Tipo de residencia principal",
  "fl.resident": "Residente de Florida",
  "fl.usCitizen": "Ciudadano de EE. UU.",
  "fl.international": "Cliente internacional",
  "fl.continuePersonal": "Continuar con datos personales",
  "fl.secure": "Solicitud segura",

  "tx.step0Title": "Selección de residencia y licencia",
  "tx.step0Sub": "Cuéntanos sobre tu residencia y selecciona tu tipo de licencia.",
  "tx.primaryInTexas": "¿Tu residencia principal está en Texas?",
  "tx.yes": "Sí",
  "tx.no": "No",
  "tx.residentBanner": "✓ Eres residente de Texas",
  "tx.nonResidentBanner": "Eres no residente de Texas",
  "tx.digitalCustomer": "¿Deseas ser un cliente digital?",
  "tx.digitalYes": "Sí (licencia digital)",
  "tx.digitalNo": "No (licencia en papel)",
  "tx.personalIntro":
    "Proporciónanos algunos datos personales — son esenciales para tu asistencia con la licencia de pesca de TX.",

  "mi.step0Title": "Identificación y licencia",
  "mi.step0Sub": "Cuéntanos sobre tu residencia y proporciona los datos de tu ID.",
  "mi.areYouResident": "¿Eres residente de Michigan?",
  "mi.yesResident": "Sí, residente de MI",
  "mi.noNonResident": "No, no residente",
  "mi.residentBanner": "✓ Eres residente de Michigan",

  "nc.step0Title": "Identificación y licencia",
  "nc.step0Sub": "Cuéntanos sobre tu residencia y proporciona los datos de tu ID.",
  "nc.residencyStatus": "Estado de residencia",
  "nc.resident": "Residente de NC",
  "nc.usCitizen": "Ciudadano de EE. UU.",
  "nc.international": "Internacional",

  "sc.personalIntro":
    "Proporciónanos algunos datos personales — son esenciales para tu asistencia con la licencia de pesca de SC.",
  "sc.resident": "Residente de SC",

  "co.step0Title": "Selección de residencia y licencia",
  "co.step0Sub": "Cuéntanos sobre tu residencia y selecciona tu licencia de pesca de Colorado.",
  "co.areYouResident": "¿Eres residente de Colorado?",
  "co.residentBanner": "✓ Eres residente de Colorado",
  "co.nonResidentBanner": "Eres no residente de Colorado",

  "pay.cardNumber": "Número de tarjeta",
  "pay.expiry": "Vencimiento (MM/AA)",
  "pay.cvv": "Código de seguridad (CVV)",
  "pay.billingZip": "Código postal de facturación",
  "pay.promo": "Código promocional",
  "pay.enterCode": "Ingresa el código",
  "pay.payNow": "Pagar {amount} de forma segura",
  "pay.processing": "Procesando pago…",

  "month.January": "Enero",
  "month.February": "Febrero",
  "month.March": "Marzo",
  "month.April": "Abril",
  "month.May": "Mayo",
  "month.June": "Junio",
  "month.July": "Julio",
  "month.August": "Agosto",
  "month.September": "Septiembre",
  "month.October": "Octubre",
  "month.November": "Noviembre",
  "month.December": "Diciembre",
};

const dictionaries: Record<Locale, Dict> = { en, es };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = dictionaries[locale] ?? en;
  let text = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}
