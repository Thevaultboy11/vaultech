// Fall 2026 syllabi → Baseline gap tracker courses.
// Built from: CSO course schedule (HTML), Calc syllabus (MATH-UH 1012 §007),
// Markets syllabus (SOCSC-UH 1111), The Unconscious Mind syllabus (CDAD-UH 1007EQ).
// Each topic's classDate is the day it's taught; every topic starts as "not_started".
// Markets dates are approximate (the syllabus gives weeks, not days).
// Imported once into the signed-in account (see store.jsx → syllabus import).

export const SYLLABUS_VERSION = 'fall-2026-v1';

export const SYLLABUS_COURSES = [
  {
    "key": "cso",
    "id": "syl-cso",
    "short": "CSO",
    "name": "Computer Systems Organization",
    "code": "CS-UH 2010",
    "professor": "Prof. Falcao",
    "color": "#7EC8E3",
    "schedule": "Mon/Wed · quizzes Mondays · assignments due 11:55 pm",
    "milestone": {
      "label": "Midterm 2",
      "date": "2026-12-07"
    },
    "match": [
      "cso",
      "computer systems",
      "cs-uh 2010",
      "csuh2010"
    ],
    "topics": [
      {
        "id": "cso-1",
        "title": "Intro to Computer Organization & C Basics (T0) · PH §1.1–1.5",
        "classDate": "2026-08-31",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-2",
        "title": "Binary Representation & Memory Organization (T1) · PH §2.4–2.5",
        "classDate": "2026-09-07",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-3",
        "title": "IEEE 754 Floating-Point Representation (T2) · PH §3.5",
        "classDate": "2026-09-09",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-4",
        "title": "RISC-V Instructions (T3) · PH §2.2–2.7",
        "classDate": "2026-09-14",
        "status": "not_started",
        "estMin": 75
      },
      {
        "id": "cso-5",
        "title": "Logic Instructions & Loops (T4) · PH §2.3, 2.6, 2.7",
        "classDate": "2026-09-21",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-6",
        "title": "Procedures (T5) · PH §2.8, 2.9, 2.13",
        "classDate": "2026-09-28",
        "status": "not_started",
        "estMin": 75
      },
      {
        "id": "cso-7",
        "title": "Performance (T6) · PH §1.4–1.6",
        "classDate": "2026-10-05",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-8",
        "title": "Arrays, Pointers & Stack Frames (T7) · PH §2.13–2.14",
        "classDate": "2026-10-12",
        "status": "not_started",
        "estMin": 90
      },
      {
        "id": "cso-9",
        "title": "Synchronization (T8) · PH §2.11",
        "classDate": "2026-11-02",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "cso-10",
        "title": "Compile, Link & Load (T9) · PH §2.12",
        "classDate": "2026-11-04",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "cso-11",
        "title": "Arithmetic: Multiplication Hardware (TA) · PH §3.2–3.3",
        "classDate": "2026-11-09",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-12",
        "title": "Polling, Interrupts & Basic I/O (TB) · PH §4.10",
        "classDate": "2026-11-11",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "cso-13",
        "title": "Datapath (TC) · PH §4.2–4.4",
        "classDate": "2026-11-18",
        "status": "not_started",
        "estMin": 75
      },
      {
        "id": "cso-14",
        "title": "Pipelining (TD) · PH §4.5–4.9",
        "classDate": "2026-11-25",
        "status": "not_started",
        "estMin": 90
      },
      {
        "id": "cso-15",
        "title": "Memory Hierarchy: Set Associativity (TF) · PH §5.2, 5.3, 5.8",
        "classDate": "2026-12-09",
        "status": "not_started",
        "estMin": 75
      }
    ]
  },
  {
    "key": "calc",
    "id": "syl-calc",
    "short": "Calc",
    "name": "Calculus with Applications to Science and Engineering",
    "code": "MATH-UH 1012",
    "professor": "Karam Fayad",
    "color": "#A78BFA",
    "schedule": "Tue/Thu 9:55–11:10 (A3-001) · Recitation Fri 8:00 (C3-006)",
    "milestone": {
      "label": "Midterm 2",
      "date": "2026-11-27"
    },
    "match": [
      "calc",
      "calculus",
      "math-uh 1012",
      "mathuh1012"
    ],
    "topics": [
      {
        "id": "calc-1",
        "title": "The Limit of a Function (2.2)",
        "classDate": "2026-09-01",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-2",
        "title": "Limit Laws (2.3)",
        "classDate": "2026-09-03",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-3",
        "title": "Continuity (2.5)",
        "classDate": "2026-09-03",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-4",
        "title": "Limits at Infinity; Horizontal Asymptotes (2.6)",
        "classDate": "2026-09-08",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-5",
        "title": "Derivatives and Rates of Change (2.7)",
        "classDate": "2026-09-10",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-6",
        "title": "The Derivative as a Function (2.8)",
        "classDate": "2026-09-10",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-7",
        "title": "Derivatives of Polynomials and Exponentials (3.1)",
        "classDate": "2026-09-15",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-8",
        "title": "Product and Quotient Rules (3.2)",
        "classDate": "2026-09-15",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-9",
        "title": "Derivatives of Trig Functions (3.3)",
        "classDate": "2026-09-17",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-10",
        "title": "The Chain Rule (3.4)",
        "classDate": "2026-09-17",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-11",
        "title": "Implicit Differentiation (3.5)",
        "classDate": "2026-09-22",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-12",
        "title": "Derivatives of Log & Inverse Trig Functions (3.6)",
        "classDate": "2026-09-22",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-13",
        "title": "Linear Approximation (3.10)",
        "classDate": "2026-09-22",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "calc-14",
        "title": "Exponential Growth and Decay (3.8)",
        "classDate": "2026-09-24",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-15",
        "title": "Related Rates (3.9)",
        "classDate": "2026-09-24",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-16",
        "title": "Indeterminate Forms & l’Hospital’s Rule (4.4)",
        "classDate": "2026-09-29",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-17",
        "title": "Maximum and Minimum Values (4.1)",
        "classDate": "2026-10-01",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-18",
        "title": "The Mean Value Theorem (4.2)",
        "classDate": "2026-10-01",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-19",
        "title": "Derivatives and the Shape of a Graph (4.3)",
        "classDate": "2026-10-06",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-20",
        "title": "Summary of Curve Sketching (4.5)",
        "classDate": "2026-10-08",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-21",
        "title": "Optimization Problems (4.7)",
        "classDate": "2026-10-13",
        "status": "not_started",
        "estMin": 75
      },
      {
        "id": "calc-22",
        "title": "Antiderivatives (4.9)",
        "classDate": "2026-10-13",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-23",
        "title": "Sequences (11.1)",
        "classDate": "2026-10-15",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-24",
        "title": "The Area and Distance Problems (5.1)",
        "classDate": "2026-10-27",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-25",
        "title": "The Definite Integral (5.2)",
        "classDate": "2026-10-27",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-26",
        "title": "The Fundamental Theorem of Calculus (5.3)",
        "classDate": "2026-10-29",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-27",
        "title": "The Substitution Rule (5.5)",
        "classDate": "2026-11-03",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-28",
        "title": "Trigonometric Integrals (7.2)",
        "classDate": "2026-11-03",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-29",
        "title": "Trigonometric Substitution (7.3)",
        "classDate": "2026-11-03",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-30",
        "title": "Integration by Parts (7.1)",
        "classDate": "2026-11-05",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-31",
        "title": "Partial Fractions (7.4)",
        "classDate": "2026-11-05",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-32",
        "title": "Strategy for Integration (7.5)",
        "classDate": "2026-11-10",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-33",
        "title": "Areas Between Curves (6.1)",
        "classDate": "2026-11-10",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-34",
        "title": "Improper Integrals (7.8)",
        "classDate": "2026-11-12",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-35",
        "title": "Series (11.2)",
        "classDate": "2026-11-17",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-36",
        "title": "The Integral Test & Estimation of Sums (11.3)",
        "classDate": "2026-11-24",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-37",
        "title": "The Comparison Tests (11.4)",
        "classDate": "2026-11-24",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-38",
        "title": "Alternating Series & Absolute Convergence (11.5)",
        "classDate": "2026-11-26",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-39",
        "title": "The Ratio and Root Tests (11.6)",
        "classDate": "2026-12-01",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-40",
        "title": "Strategy for Testing Series (11.7)",
        "classDate": "2026-12-01",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "calc-41",
        "title": "Power Series (11.8)",
        "classDate": "2026-12-08",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-42",
        "title": "Representations of Functions as Power Series (11.9)",
        "classDate": "2026-12-10",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "calc-43",
        "title": "Taylor and Maclaurin Series (11.10)",
        "classDate": "2026-12-14",
        "status": "not_started",
        "estMin": 75
      }
    ]
  },
  {
    "key": "markets",
    "id": "syl-markets",
    "short": "Markets",
    "name": "Markets",
    "code": "SOCSC-UH 1111",
    "professor": "Dr. Andrzej Baranski-Madrigal",
    "color": "#F5A97F",
    "schedule": "Mon/Wed 9:55–11:10 (East Admin 005) · weekly recitation",
    "milestone": {
      "label": "Midterm II (approx.)",
      "date": "2026-11-11"
    },
    "match": [
      "markets",
      "market",
      "socsc-uh 1111",
      "socscuh1111"
    ],
    "topics": [
      {
        "id": "mk-1",
        "title": "First Principles (Ch. 1)",
        "classDate": "2026-08-31",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "mk-2",
        "title": "Economic Models (Ch. 2)",
        "classDate": "2026-09-02",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-3",
        "title": "Supply and Demand (Ch. 3)",
        "classDate": "2026-09-07",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-4",
        "title": "Consumer and Producer Surplus (Ch. 4)",
        "classDate": "2026-09-14",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-5",
        "title": "Price Controls and Quotas (Ch. 5)",
        "classDate": "2026-09-21",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-6",
        "title": "Elasticity (Ch. 6)",
        "classDate": "2026-09-23",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-7",
        "title": "Taxes (Ch. 7)",
        "classDate": "2026-09-28",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-8",
        "title": "International Trade (Ch. 8)",
        "classDate": "2026-10-05",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-9",
        "title": "Decision Making (Ch. 9)",
        "classDate": "2026-10-12",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-10",
        "title": "The Rational Consumer (Ch. 13)",
        "classDate": "2026-10-26",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-11",
        "title": "Behind the Supply Curve (Ch. 14)",
        "classDate": "2026-11-02",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-12",
        "title": "Perfect Competition (Ch. 15)",
        "classDate": "2026-11-09",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-13",
        "title": "Monopoly (Ch. 16)",
        "classDate": "2026-11-16",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "mk-14",
        "title": "Oligopoly (Ch. 17)",
        "classDate": "2026-11-23",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-15",
        "title": "Monopolistic Competition (Ch. 18)",
        "classDate": "2026-11-25",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-16",
        "title": "Externalities (Ch. 10)",
        "classDate": "2026-11-30",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "mk-17",
        "title": "Public Goods (Ch. 11)",
        "classDate": "2026-12-07",
        "status": "not_started",
        "estMin": 45
      }
    ]
  },
  {
    "key": "um",
    "id": "syl-um",
    "short": "Unconscious Mind",
    "name": "The Unconscious Mind",
    "code": "CDAD-UH 1007EQ",
    "professor": "Shaalan Farouk",
    "color": "#86EFAC",
    "schedule": "Mon/Wed 15:35–16:50 (CRB 005) · 3 labs Fri 10:40 (CRB 012)",
    "milestone": {
      "label": "Lab 2: Decision Making",
      "date": "2026-10-28"
    },
    "match": [
      "unconscious",
      "cdad-uh 1007",
      "cdaduh1007"
    ],
    "topics": [
      {
        "id": "um-1",
        "title": "Introduction to the Unconscious Mind",
        "classDate": "2026-08-31",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "um-2",
        "title": "The Unconscious Mind",
        "classDate": "2026-09-02",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-3",
        "title": "The Completely Unconscious Mind: unconscious processes",
        "classDate": "2026-09-07",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-4",
        "title": "Sacks (2011) The Mind’s Eye",
        "classDate": "2026-09-09",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-5",
        "title": "Theory, Data & Design: Coolican (2014)",
        "classDate": "2026-09-14",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-6",
        "title": "Research Design: Creswell & Creswell (2022)",
        "classDate": "2026-09-16",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-7",
        "title": "Planning Experiment 1: Face Recognition",
        "classDate": "2026-09-21",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-8",
        "title": "Lab 1: Face Recognition Experiment",
        "classDate": "2026-09-23",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "um-9",
        "title": "Kahneman (2013) Part 1 “Two Systems”",
        "classDate": "2026-09-28",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-10",
        "title": "Bargh (2018) Chapters 1–3",
        "classDate": "2026-09-30",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-11",
        "title": "Bargh (2018) Chapters 5–6: conscious & unconscious decision making",
        "classDate": "2026-10-05",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-12",
        "title": "Bargh (2018) Chapter 7",
        "classDate": "2026-10-07",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-13",
        "title": "Emotions and Unconscious Cognition",
        "classDate": "2026-10-12",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-14",
        "title": "Preparation for Lab 2: Decision Making",
        "classDate": "2026-10-26",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-15",
        "title": "Lab 2: Decision Making",
        "classDate": "2026-10-28",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "um-16",
        "title": "Making the Unconscious Conscious: McAdams (2001) Life Stories",
        "classDate": "2026-11-02",
        "status": "not_started",
        "estMin": 60
      },
      {
        "id": "um-17",
        "title": "Autobiographical Memory: Josselson (2009) The Present of the Past",
        "classDate": "2026-11-09",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-18",
        "title": "McAdams & Bowman (2001) Narrating Life’s Turning Points",
        "classDate": "2026-11-11",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-19",
        "title": "Narrative Foreclosure: Freeman (2010) Ch. 5",
        "classDate": "2026-11-16",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-20",
        "title": "Theory, Data and Design (revisited)",
        "classDate": "2026-11-23",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-21",
        "title": "Planning Experiment 3: Autobiographical Memory",
        "classDate": "2026-11-30",
        "status": "not_started",
        "estMin": 45
      },
      {
        "id": "um-22",
        "title": "Lab 3: Autobiographical Memory",
        "classDate": "2026-12-04",
        "status": "not_started",
        "estMin": 30
      },
      {
        "id": "um-23",
        "title": "Presentation of Findings in Groups",
        "classDate": "2026-12-07",
        "status": "not_started",
        "estMin": 45
      }
    ]
  }
];
