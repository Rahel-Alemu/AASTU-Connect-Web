export const COLLEGES = {
  ENGINEERING: "Engineering",
  APPLIED: "Applied"
} as const;

export const DEPARTMENTS = {
  [COLLEGES.ENGINEERING]: [
    "Mechanical Engineering",
    "Electrical Engineering",
    "Software Engineering",
    "Mining Engineering",
    "Environmental Engineering",
    "Civil Engineering",
    "Electromechanical Engineering (Mechatronics)",
    "Chemical Engineering"
  ],
  [COLLEGES.APPLIED]: [
    "Food Science",
    "Industrial Chemistry",
    "Biotechnology"
  ]
} as const;

export const ALL_DEPARTMENTS = [
  ...DEPARTMENTS[COLLEGES.ENGINEERING],
  ...DEPARTMENTS[COLLEGES.APPLIED]
];

export const APP_NAME = "AASTU Connect";
export const STARTING_BALANCE = 100;
