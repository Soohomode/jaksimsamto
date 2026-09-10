/**
 * 샘플 문제 시드 데이터. (전부 창작 예문 — 공식 토익 문제 아님)
 * upsert 기준: (part, content)
 */

export interface SeedQuestion {
  part: number;
  type: string;
  content: string;
  choices: string[];
  answer: string;
  audioScript?: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
  passageGroup?: string;
  passageOrder?: number;
}

export const seedQuestions: SeedQuestion[] = [
  // ── Part 1: 사진 묘사 ──
  {
    part: 1,
    type: "photo",
    content: "사진을 가장 잘 묘사한 문장을 고르세요. (한 남자가 노트북 앞에 앉아 있는 사무실 사진)",
    choices: [
      "(A) A man is typing on a laptop.",
      "(B) A man is closing a window.",
      "(C) Some people are leaving the office.",
      "(D) A woman is watering the plants.",
    ],
    answer: "A",
    audioScript:
      "(A) A man is typing on a laptop. (B) A man is closing a window. (C) Some people are leaving the office. (D) A woman is watering the plants.",
    explanation: "사진 속 인물의 동작(typing)을 정확히 묘사한 (A)가 정답입니다.",
    difficulty: 2,
    tags: ["사진묘사", "인물동작"],
  },
  {
    part: 1,
    type: "photo",
    content: "사진을 가장 잘 묘사한 문장을 고르세요. (야외 카페 테이블에 컵들이 놓여 있는 사진)",
    choices: [
      "(A) Cups have been placed on a table.",
      "(B) A waiter is pouring coffee.",
      "(C) The chairs are being stacked.",
      "(D) A table is being wiped down.",
    ],
    answer: "A",
    audioScript:
      "(A) Cups have been placed on a table. (B) A waiter is pouring coffee. (C) The chairs are being stacked. (D) A table is being wiped down.",
    explanation: "인물이 없는 사물 사진은 현재완료 수동태(have been placed) 묘사가 자주 정답이 됩니다.",
    difficulty: 3,
    tags: ["사진묘사", "사물"],
  },

  // ── Part 2: 질의응답 ──
  {
    part: 2,
    type: "qa",
    content:
      "질문에 가장 적절한 응답을 고르세요. (질문: How will the documents be sent to the client?)",
    choices: [
      "(A) By express mail.",
      "(B) It was very informative.",
      "(C) On the second floor.",
    ],
    answer: "A",
    audioScript:
      "How will the documents be sent to the client? (A) By express mail. (B) It was very informative. (C) On the second floor.",
    explanation: "How(수단)로 물었으므로 'By express mail'이 자연스럽습니다.",
    difficulty: 2,
    tags: ["질의응답", "How"],
  },
  {
    part: 2,
    type: "qa",
    content:
      "질문에 가장 적절한 응답을 고르세요. (질문: Could you send me the updated schedule?)",
    choices: [
      "(A) Yes, I'll do it right now.",
      "(B) A larger conference room.",
      "(C) She works in accounting.",
    ],
    answer: "A",
    audioScript:
      "Could you send me the updated schedule? (A) Yes, I'll do it right now. (B) A larger conference room. (C) She works in accounting.",
    explanation: "요청문(Could you ~?)에는 수락/거절 응답이 정답입니다.",
    difficulty: 2,
    tags: ["질의응답", "요청"],
  },

  // ── Part 3: 짧은 대화 (3문항 세트) ──
  {
    part: 3,
    type: "conversation",
    content: "What are the speakers mainly discussing?",
    choices: [
      "(A) A product launch",
      "(B) A staff training session",
      "(C) An office relocation",
      "(D) A budget report",
    ],
    answer: "C",
    audioScript:
      "W: Have you heard that we're moving to the new building downtown next month?\nM: Yes, but I'm worried about the commute. The new office is farther from the subway.\nW: Actually, the company is arranging a shuttle bus from the station.\nM: That's a relief. When do we start packing our desks?",
    explanation: "대화 전반에서 사무실 이전(relocation)을 다루고 있습니다.",
    difficulty: 3,
    tags: ["대화", "주제"],
    passageGroup: "seed-pt3-set-01",
    passageOrder: 1,
  },
  {
    part: 3,
    type: "conversation",
    content: "What is the man concerned about?",
    choices: [
      "(A) The cost of the move",
      "(B) His commute to work",
      "(C) A project deadline",
      "(D) The size of the new office",
    ],
    answer: "B",
    audioScript:
      "W: Have you heard that we're moving to the new building downtown next month?\nM: Yes, but I'm worried about the commute. The new office is farther from the subway.\nW: Actually, the company is arranging a shuttle bus from the station.\nM: That's a relief. When do we start packing our desks?",
    explanation: "남자는 지하철에서 더 먼 새 사무실로의 통근(commute)을 걱정합니다.",
    difficulty: 3,
    tags: ["대화", "세부사항"],
    passageGroup: "seed-pt3-set-01",
    passageOrder: 2,
  },
  {
    part: 3,
    type: "conversation",
    content: "What does the woman say the company will provide?",
    choices: [
      "(A) A parking permit",
      "(B) A relocation bonus",
      "(C) A shuttle bus service",
      "(D) Extra vacation days",
    ],
    answer: "C",
    audioScript:
      "W: Have you heard that we're moving to the new building downtown next month?\nM: Yes, but I'm worried about the commute. The new office is farther from the subway.\nW: Actually, the company is arranging a shuttle bus from the station.\nM: That's a relief. When do we start packing our desks?",
    explanation: "여자는 회사가 역에서 오는 셔틀버스를 마련한다고 말합니다.",
    difficulty: 2,
    tags: ["대화", "세부사항"],
    passageGroup: "seed-pt3-set-01",
    passageOrder: 3,
  },

  // ── Part 4: 짧은 담화 (3문항 세트) ──
  {
    part: 4,
    type: "talk",
    content: "Where most likely is the announcement being made?",
    choices: [
      "(A) At an airport",
      "(B) At a train station",
      "(C) At a shopping mall",
      "(D) At a museum",
    ],
    answer: "B",
    audioScript:
      "Attention passengers. The 3:15 express service to Central City has been delayed by approximately twenty minutes due to signal maintenance. Passengers holding reserved seats may wait in the first-class lounge on platform two. We apologize for the inconvenience and appreciate your patience.",
    explanation: "platform, express service 등에서 기차역임을 알 수 있습니다.",
    difficulty: 3,
    tags: ["담화", "장소추론"],
    passageGroup: "seed-pt4-set-01",
    passageOrder: 1,
  },
  {
    part: 4,
    type: "talk",
    content: "Why has the service been delayed?",
    choices: [
      "(A) Bad weather",
      "(B) Signal maintenance",
      "(C) A staff shortage",
      "(D) An earlier accident",
    ],
    answer: "B",
    audioScript:
      "Attention passengers. The 3:15 express service to Central City has been delayed by approximately twenty minutes due to signal maintenance. Passengers holding reserved seats may wait in the first-class lounge on platform two. We apologize for the inconvenience and appreciate your patience.",
    explanation: "지연 사유로 'signal maintenance'가 언급됩니다.",
    difficulty: 2,
    tags: ["담화", "세부사항"],
    passageGroup: "seed-pt4-set-01",
    passageOrder: 2,
  },
  {
    part: 4,
    type: "talk",
    content: "What are reserved-seat passengers invited to do?",
    choices: [
      "(A) Request a refund",
      "(B) Board from a different platform",
      "(C) Wait in a lounge",
      "(D) Contact customer service",
    ],
    answer: "C",
    audioScript:
      "Attention passengers. The 3:15 express service to Central City has been delayed by approximately twenty minutes due to signal maintenance. Passengers holding reserved seats may wait in the first-class lounge on platform two. We apologize for the inconvenience and appreciate your patience.",
    explanation: "예약 좌석 승객은 2번 플랫폼 일등석 라운지에서 대기할 수 있습니다.",
    difficulty: 3,
    tags: ["담화", "세부사항"],
    passageGroup: "seed-pt4-set-01",
    passageOrder: 3,
  },

  // ── Part 5: 단문 공란 채우기 ──
  {
    part: 5,
    type: "incomplete-sentence",
    content:
      "The marketing team will finalize the campaign ______ the client approves the budget.",
    choices: ["(A) once", "(B) despite", "(C) during", "(D) whether"],
    answer: "A",
    explanation: "'~하자마자/일단 ~하면'의 의미로 시간 접속사 once가 적절합니다.",
    difficulty: 3,
    tags: ["접속사", "문법"],
  },
  {
    part: 5,
    type: "incomplete-sentence",
    content:
      "All employees must submit their expense reports ______ the end of each month.",
    choices: ["(A) by", "(B) until", "(C) since", "(D) within"],
    answer: "A",
    explanation: "완료 시점 마감을 나타내는 전치사 by가 정답입니다. until은 상태 지속에 씁니다.",
    difficulty: 3,
    tags: ["전치사", "by-until"],
  },
  {
    part: 5,
    type: "incomplete-sentence",
    content:
      "The new software update significantly improved the system's ______.",
    choices: [
      "(A) perform",
      "(B) performing",
      "(C) performance",
      "(D) performed",
    ],
    answer: "C",
    explanation: "소유격(system's) 뒤 목적어 자리이므로 명사 performance가 필요합니다.",
    difficulty: 2,
    tags: ["품사", "명사"],
  },
  {
    part: 5,
    type: "incomplete-sentence",
    content:
      "Ms. Tanaka handled the negotiation ______, securing a favorable contract for the firm.",
    choices: [
      "(A) skill",
      "(B) skilled",
      "(C) skillful",
      "(D) skillfully",
    ],
    answer: "D",
    explanation: "동사 handled를 수식하므로 부사 skillfully가 정답입니다.",
    difficulty: 2,
    tags: ["품사", "부사"],
  },

  // ── Part 6: 장문 공란 채우기 (3문항 세트) ──
  {
    part: 6,
    type: "text-completion",
    content:
      "지문: \"Thank you for your recent purchase from HomeStyle. Your order has been processed and ______ within three business days. You will receive a tracking number by email once it leaves our warehouse. If you have any questions about your delivery, our support team is available Monday through Friday. We appreciate your business and hope you enjoy your new furniture.\"\n\n(1) 빈칸에 알맞은 것은?",
    choices: [
      "(A) shipped",
      "(B) will be shipped",
      "(C) has shipped",
      "(D) shipping",
    ],
    answer: "B",
    explanation: "'within three business days'라는 미래 시점 표현과 어울리는 미래 수동태가 정답입니다.",
    difficulty: 3,
    tags: ["시제", "수동태"],
    passageGroup: "seed-pt6-set-01",
    passageOrder: 1,
  },
  {
    part: 6,
    type: "text-completion",
    content:
      "지문: 위 HomeStyle 안내문. (2) 다음 중 지문의 흐름상 빈칸에 들어갈 문장으로 가장 적절한 것은? (\"You will receive a tracking number by email once it leaves our warehouse.\" 자리)",
    choices: [
      "(A) Our stores will be closed for the holiday.",
      "(B) You will receive a tracking number by email once it leaves our warehouse.",
      "(C) Please reset your password to continue.",
      "(D) The recipe serves four people.",
    ],
    answer: "B",
    explanation: "배송/추적 안내라는 문맥에 맞는 문장은 (B)뿐입니다.",
    difficulty: 2,
    tags: ["문장삽입"],
    passageGroup: "seed-pt6-set-01",
    passageOrder: 2,
  },
  {
    part: 6,
    type: "text-completion",
    content:
      "지문: 위 HomeStyle 안내문. (3) 빈칸에 알맞은 어휘는? (\"our support team is available Monday ______ Friday\")",
    choices: ["(A) between", "(B) through", "(C) across", "(D) toward"],
    answer: "B",
    explanation: "요일 범위를 나타낼 때 'Monday through Friday' 표현을 씁니다.",
    difficulty: 2,
    tags: ["전치사", "어휘"],
    passageGroup: "seed-pt6-set-01",
    passageOrder: 3,
  },

  // ── Part 7: 독해 (2문항 세트) ──
  {
    part: 7,
    type: "reading-comprehension",
    content:
      "지문(공지): \"GreenLeaf Coworking will undergo lobby renovations from March 4 to March 15. During this period, members should enter through the side door on Maple Avenue. Meeting rooms on the second floor remain available, but the ground-floor cafe will be temporarily closed. A pop-up coffee cart will operate near the side entrance from 8 a.m. to 11 a.m. on weekdays. We appreciate your understanding.\"\n\n1. What is the purpose of the notice?",
    choices: [
      "(A) To announce a change in membership fees",
      "(B) To inform members about renovation work",
      "(C) To promote a new coffee menu",
      "(D) To advertise available meeting rooms",
    ],
    answer: "B",
    explanation: "공지의 핵심은 로비 리노베이션 안내입니다.",
    difficulty: 2,
    tags: ["독해", "주제/목적"],
    passageGroup: "seed-pt7-set-01",
    passageOrder: 1,
  },
  {
    part: 7,
    type: "reading-comprehension",
    content:
      "지문: 위 GreenLeaf Coworking 공지. 2. What is indicated about the coffee cart?",
    choices: [
      "(A) It operates only in the mornings on weekdays.",
      "(B) It is located inside the second-floor lounge.",
      "(C) It is free for all members.",
      "(D) It will remain after the renovation ends.",
    ],
    answer: "A",
    explanation: "'from 8 a.m. to 11 a.m. on weekdays'에서 평일 오전만 운영함을 알 수 있습니다.",
    difficulty: 3,
    tags: ["독해", "세부사항"],
    passageGroup: "seed-pt7-set-01",
    passageOrder: 2,
  },
];
