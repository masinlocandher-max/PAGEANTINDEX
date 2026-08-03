"use strict";

(() => {
  const COUNTRY_CODES = "AF,AL,DZ,AS,AD,AO,AI,AQ,AG,AR,AM,AW,AU,AT,AZ,BS,BH,BD,BB,BY,BE,BZ,BJ,BM,BT,BO,BA,BW,BV,BR,IO,VG,BN,BG,BF,BI,CV,KH,CM,CA,BQ,KY,CF,TD,CL,CN,CX,CC,CO,KM,CK,CR,HR,CU,CW,CY,CZ,CI,CD,DK,DJ,DM,DO,EC,EG,SV,GQ,ER,EE,SZ,ET,FK,FO,FJ,FI,FR,GF,PF,TF,GA,GM,GE,DE,GH,GI,GR,GL,GD,GP,GU,GT,GG,GN,GW,GY,HT,HM,VA,HN,HK,HU,IS,IN,ID,IR,IQ,IE,IM,IL,IT,JM,JP,JE,JO,KZ,KE,KI,KW,KG,LA,LV,LB,LS,LR,LY,LI,LT,LU,MO,MG,MW,MY,MV,ML,MT,MH,MQ,MR,MU,YT,MX,FM,MD,MC,MN,ME,MS,MA,MZ,MM,NA,NR,NP,NL,NC,NZ,NI,NE,NG,NU,NF,KP,MK,MP,NO,OM,PK,PW,PS,PA,PG,PY,PE,PH,PN,PL,PT,PR,QA,CG,RO,RU,RW,RE,BL,SH,KN,LC,MF,PM,VC,WS,SM,ST,SA,SN,RS,SC,SL,SG,SX,SK,SI,SB,SO,ZA,GS,KR,SS,ES,LK,SD,SR,SJ,SE,CH,SY,TW,TJ,TZ,TH,TL,TG,TK,TO,TT,TN,TM,TC,TV,TR,VI,UG,UA,AE,GB,US,UM,UY,UZ,VU,VE,VN,WF,EH,YE,ZM,ZW,AX".split(",");
  const regionNames = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], {type: "region"})
    : null;

  const COMMON_REGION_NAMES = {
    BO: "Bolivia", BN: "Brunei", CD: "Democratic Republic of the Congo",
    CG: "Republic of the Congo", CI: "Côte d’Ivoire", IR: "Iran", KP: "North Korea",
    KR: "South Korea", LA: "Laos", MD: "Moldova", PS: "Palestine", RU: "Russia",
    SY: "Syria", TZ: "Tanzania", VE: "Venezuela", VN: "Vietnam",
  };

  const flagFromCode = (code) => String(code || "")
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));

  const countries = COUNTRY_CODES
    .map((code) => ({
      code,
      name: COMMON_REGION_NAMES[code] || regionNames?.of(code) || code,
      flag: flagFromCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const supplierCategories = [
    "Pasarela / Runway Coach",
    "Q&A Coach",
    "Pageant Coach / Mentor",
    "Hair and Makeup Artist (HMUA)",
    "Fashion / Gown Designer",
    "National Costume Designer",
    "Photographer",
    "Videographer",
    "Pageant Camp / Training Center",
    "Stylist / Image Consultant",
    "Choreographer",
    "Host / Emcee",
    "Pageant Director / Organizer",
    "Events and Production",
    "Stage, Lights and Sound",
    "Livestreaming / Media Production",
    "Voting and Tabulation",
    "Crown and Sash Supplier",
    "Jewelry and Accessories",
    "Beauty and Wellness",
    "PR, Marketing and Digital Services",
    "Talent Agency / Management",
    "Sponsor / Brand Partner",
    "Venue",
    "Hotel / Accommodation",
    "Flights / Airline / Travel Agency",
    "Transportation / Tour Services",
    "Other",
  ];

  const candidateStatuses = [
    "Aspiring candidate",
    "Current candidate",
    "Titleholder",
    "Former candidate or titleholder",
  ];

  const candidateGoals = [
    "Find pageants",
    "Find suppliers",
    "Build my candidate profile",
    "Find flights or hotels",
    "Find sponsors or opportunities",
  ];

  window.PageantIndexConfig = Object.freeze({
    brandName: "Pageant Index",
    tagline: "The Global Network for Pageantry",
    accountTypes: Object.freeze([
      {value: "candidate", label: "Candidate"},
      {value: "supplier", label: "Supplier"},
    ]),
    countries: Object.freeze(countries),
    supplierCategories: Object.freeze(supplierCategories),
    candidateStatuses: Object.freeze(candidateStatuses),
    candidateGoals: Object.freeze(candidateGoals),
    flagFromCode,
    travelDisclosure: "Pageant Index connects users with independent travel and accommodation providers. Availability, prices, bookings, refunds, and service terms are handled directly by each provider.",
  });
})();
