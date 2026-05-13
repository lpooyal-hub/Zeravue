const noirlabCredit = "E. Slawik/NOIRLab/NSF/AURA/M. Zamani";

function noirlabPhoto(id) {
  return {
    imageUrl: `https://noirlab.edu/public/media/archives/images/screen/${id}.jpg`,
    sourceUrl: `https://noirlab.edu/public/images/${id}/`,
    credit: noirlabCredit,
    license: "CC BY 4.0"
  };
}

export const zodiacSigns = [
  {
    id: "aries",
    name: { en: "Aries", ko: "양자리" },
    photo: noirlabPhoto("aries"),
    dateRange: { en: "Mar 21 - Apr 19", ko: "3월 21일 - 4월 19일" },
    brightStar: { en: "Hamal", ko: "하말" },
    raHours: 2.5,
    decDegrees: 20,
    story: {
      en: "A compact northern constellation marked by Hamal and a clean bent line of stars.",
      ko: "하말을 중심으로 짧고 꺾인 별선이 돋보이는 북쪽 하늘의 작은 별자리입니다."
    },
    points: [
      [0.18, 0.56],
      [0.32, 0.46],
      [0.47, 0.5],
      [0.62, 0.38]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3]
    ]
  },
  {
    id: "taurus",
    name: { en: "Taurus", ko: "황소자리" },
    photo: noirlabPhoto("taurus"),
    dateRange: { en: "Apr 20 - May 20", ko: "4월 20일 - 5월 20일" },
    brightStar: { en: "Aldebaran", ko: "알데바란" },
    raHours: 4.6,
    decDegrees: 16,
    story: {
      en: "A V-shaped face and long horns make Taurus one of the easiest zodiac patterns to recognize.",
      ko: "V자 얼굴과 긴 뿔 모양 덕분에 황도 별자리 중 알아보기 쉬운 패턴입니다."
    },
    points: [
      [0.18, 0.34],
      [0.38, 0.48],
      [0.18, 0.62],
      [0.52, 0.48],
      [0.78, 0.28],
      [0.74, 0.68]
    ],
    lines: [
      [0, 1],
      [2, 1],
      [1, 3],
      [3, 4],
      [3, 5]
    ]
  },
  {
    id: "gemini",
    name: { en: "Gemini", ko: "쌍둥이자리" },
    photo: noirlabPhoto("gemini"),
    dateRange: { en: "May 21 - Jun 20", ko: "5월 21일 - 6월 20일" },
    brightStar: { en: "Pollux", ko: "폴룩스" },
    raHours: 7.0,
    decDegrees: 22,
    story: {
      en: "Two parallel chains of stars represent Castor and Pollux, the celestial twins.",
      ko: "두 줄의 별 사슬이 하늘의 쌍둥이 카스토르와 폴룩스를 나타냅니다."
    },
    points: [
      [0.24, 0.34],
      [0.42, 0.42],
      [0.62, 0.5],
      [0.78, 0.58],
      [0.22, 0.62],
      [0.42, 0.58],
      [0.62, 0.64],
      [0.8, 0.72]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 5],
      [5, 6],
      [6, 7],
      [1, 5]
    ]
  },
  {
    id: "cancer",
    name: { en: "Cancer", ko: "게자리" },
    photo: noirlabPhoto("cancer"),
    dateRange: { en: "Jun 21 - Jul 22", ko: "6월 21일 - 7월 22일" },
    brightStar: { en: "Altarf", ko: "알타르프" },
    raHours: 8.7,
    decDegrees: 20,
    story: {
      en: "A faint cross-like constellation best known for the Beehive Cluster nearby.",
      ko: "희미한 십자형 별자리이며 주변의 벌집 성단으로 잘 알려져 있습니다."
    },
    points: [
      [0.5, 0.24],
      [0.44, 0.44],
      [0.56, 0.54],
      [0.38, 0.72],
      [0.68, 0.36]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4]
    ]
  },
  {
    id: "leo",
    name: { en: "Leo", ko: "사자자리" },
    photo: noirlabPhoto("leo"),
    dateRange: { en: "Jul 23 - Aug 22", ko: "7월 23일 - 8월 22일" },
    brightStar: { en: "Regulus", ko: "레굴루스" },
    raHours: 10.7,
    decDegrees: 13,
    story: {
      en: "Leo's sickle and triangular tail form a large, bright spring constellation.",
      ko: "낫 모양 머리와 삼각형 꼬리가 봄 하늘의 커다란 사자를 이룹니다."
    },
    points: [
      [0.2, 0.62],
      [0.34, 0.48],
      [0.3, 0.32],
      [0.44, 0.22],
      [0.58, 0.44],
      [0.78, 0.36],
      [0.72, 0.62],
      [0.48, 0.68]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0]
    ]
  },
  {
    id: "virgo",
    name: { en: "Virgo", ko: "처녀자리" },
    photo: noirlabPhoto("virgo"),
    dateRange: { en: "Aug 23 - Sep 22", ko: "8월 23일 - 9월 22일" },
    brightStar: { en: "Spica", ko: "스피카" },
    raHours: 13.4,
    decDegrees: -4,
    story: {
      en: "Virgo stretches wide across the sky and is anchored by the blue-white star Spica.",
      ko: "넓게 펼쳐진 별자리로 푸른빛의 스피카가 중심을 잡아줍니다."
    },
    points: [
      [0.18, 0.44],
      [0.36, 0.34],
      [0.5, 0.48],
      [0.7, 0.4],
      [0.82, 0.58],
      [0.58, 0.72],
      [0.34, 0.64]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [6, 0]
    ]
  },
  {
    id: "libra",
    name: { en: "Libra", ko: "천칭자리" },
    photo: noirlabPhoto("libra"),
    dateRange: { en: "Sep 23 - Oct 22", ko: "9월 23일 - 10월 22일" },
    brightStar: { en: "Zubeneschamali", ko: "주베네샤말리" },
    raHours: 15.2,
    decDegrees: -15,
    story: {
      en: "Libra forms a small balance-shaped quadrilateral between Virgo and Scorpius.",
      ko: "처녀자리와 전갈자리 사이에서 저울 모양 사각형을 이루는 별자리입니다."
    },
    points: [
      [0.28, 0.34],
      [0.68, 0.32],
      [0.78, 0.58],
      [0.36, 0.68],
      [0.5, 0.5]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [1, 4]
    ]
  },
  {
    id: "scorpius",
    name: { en: "Scorpius", ko: "전갈자리" },
    photo: noirlabPhoto("scorpius"),
    dateRange: { en: "Oct 23 - Nov 21", ko: "10월 23일 - 11월 21일" },
    brightStar: { en: "Antares", ko: "안타레스" },
    raHours: 16.6,
    decDegrees: -26,
    story: {
      en: "A dramatic hook-shaped constellation with red Antares glowing at its heart.",
      ko: "붉은 안타레스가 심장처럼 빛나는 갈고리 모양의 강렬한 별자리입니다."
    },
    points: [
      [0.2, 0.26],
      [0.34, 0.34],
      [0.46, 0.48],
      [0.5, 0.64],
      [0.42, 0.78],
      [0.56, 0.86],
      [0.72, 0.78],
      [0.8, 0.62]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7]
    ]
  },
  {
    id: "sagittarius",
    name: { en: "Sagittarius", ko: "궁수자리" },
    photo: noirlabPhoto("sagittarius"),
    dateRange: { en: "Nov 22 - Dec 21", ko: "11월 22일 - 12월 21일" },
    brightStar: { en: "Kaus Australis", ko: "카우스 오스트랄리스" },
    raHours: 19.0,
    decDegrees: -25,
    story: {
      en: "Its Teapot asterism points toward the rich center of the Milky Way.",
      ko: "찻주전자 모양 별무리가 은하수 중심 방향을 가리킵니다."
    },
    points: [
      [0.24, 0.58],
      [0.38, 0.38],
      [0.58, 0.36],
      [0.72, 0.56],
      [0.58, 0.76],
      [0.36, 0.74],
      [0.5, 0.54]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 6],
      [6, 4]
    ]
  },
  {
    id: "capricornus",
    name: { en: "Capricornus", ko: "염소자리" },
    photo: noirlabPhoto("capricornus"),
    dateRange: { en: "Dec 22 - Jan 19", ko: "12월 22일 - 1월 19일" },
    brightStar: { en: "Deneb Algedi", ko: "데네브 알게디" },
    raHours: 21.0,
    decDegrees: -18,
    story: {
      en: "A wide, faint triangle outlines the sea-goat between Sagittarius and Aquarius.",
      ko: "궁수자리와 물병자리 사이에 넓고 희미한 삼각형으로 바다염소를 그립니다."
    },
    points: [
      [0.18, 0.44],
      [0.48, 0.32],
      [0.82, 0.46],
      [0.66, 0.72],
      [0.34, 0.68]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0]
    ]
  },
  {
    id: "aquarius",
    name: { en: "Aquarius", ko: "물병자리" },
    photo: noirlabPhoto("aquarius"),
    dateRange: { en: "Jan 20 - Feb 18", ko: "1월 20일 - 2월 18일" },
    brightStar: { en: "Sadalsuud", ko: "사달수드" },
    raHours: 22.4,
    decDegrees: -10,
    story: {
      en: "A flowing chain of faint stars represents water poured across the autumn sky.",
      ko: "가을 하늘에 물이 흐르듯 이어지는 희미한 별들의 사슬입니다."
    },
    points: [
      [0.2, 0.34],
      [0.34, 0.42],
      [0.48, 0.34],
      [0.6, 0.48],
      [0.74, 0.44],
      [0.62, 0.64],
      [0.44, 0.72],
      [0.3, 0.62]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [5, 6],
      [6, 7],
      [7, 1]
    ]
  },
  {
    id: "pisces",
    name: { en: "Pisces", ko: "물고기자리" },
    photo: noirlabPhoto("pisces"),
    dateRange: { en: "Feb 19 - Mar 20", ko: "2월 19일 - 3월 20일" },
    brightStar: { en: "Eta Piscium", ko: "에타 피시움" },
    raHours: 0.6,
    decDegrees: 10,
    story: {
      en: "Two fish are tied by a long cord of faint stars stretching across the sky.",
      ko: "두 물고기가 하늘을 가로지르는 긴 별의 끈으로 이어진 형태입니다."
    },
    points: [
      [0.18, 0.42],
      [0.3, 0.32],
      [0.42, 0.44],
      [0.5, 0.58],
      [0.64, 0.48],
      [0.78, 0.34],
      [0.84, 0.5],
      [0.72, 0.62]
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4]
    ]
  }
];
