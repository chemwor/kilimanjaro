/*  Kilimanjaro — Lemosho Route, 7 days, 24–30 June 2026
 *
 *  This is the single place to edit the trip. Everything on the site is
 *  rendered from here: the day sections, the elevation profile, the route
 *  points, the stat counters.
 *
 *  Elevations are in metres; the site converts to feet on the fly.
 *  `km` on a point is cumulative distance walked since the trailhead — it is
 *  what positions the point on the elevation profile.
 *
 *  The dates and the on-the-move times are not guesses: they were read out of
 *  the EXIF capture times on the trip photos and the drone clips, which agree
 *  with each other to the minute.
 */

const TRIP = {
  title: "Kilimanjaro",
  subtitle: "Lemosho Route · seven days · June 2026",
  summitDate: "2026-06-29",

  // Headline numbers, shown in the hero and the closing ledger.
  facts: {
    summitElevation: 5895,
    startElevation: 2360,
    distanceKm: 65,
    days: 7,
    nightsOnMountain: 6,
    highestSleep: 4673,
    summitTime: "14:15",
  },

  days: [
    {
      n: 1,
      date: "2026-06-24",
      label: "Into the rainforest",
      from: "Londorossi Gate",
      to: "Mti Mkubwa (Forest Camp)",
      sleepAt: 2785,
      distanceKm: 6,
      hours: "3–4",
      zone: "Montane rainforest",
      firstFrame: "08:18",
      lastFrame: "15:11",
      blurb:
        "You sign the register at Londorossi, ride a truck up a red-dirt road, and start walking where the forest closes over the track. It is humid and loud — colobus monkeys overhead, water somewhere off the trail, moss on everything. Nothing about this first afternoon feels like a mountain yet.",
      points: [
        { name: "Londorossi Gate", m: 2100, km: 0, note: "Registration and permits. 2,100 m, and already higher than most of the country." },
        { name: "Lemosho Trailhead", m: 2360, km: 0, note: "Boots on. The forest starts here." },
        { name: "Mti Mkubwa", m: 2785, km: 6, note: "\"Big Tree\" — first camp, first night under the canopy.", camp: true },
      ],
    },
    {
      n: 2,
      date: "2026-06-25",
      label: "Out of the trees",
      from: "Mti Mkubwa",
      to: "Shira 1 Camp",
      sleepAt: 3505,
      distanceKm: 8,
      hours: "5–6",
      zone: "Heather & moorland",
      firstFrame: "08:35",
      lastFrame: "17:40",
      blurb:
        "The canopy thins, then quits altogether. You climb the Shira Ridge through giant heather, white-necked ravens tracking you along the trail, and come out on the plateau — and there it is, the whole point of the walk, sitting on the horizon with a glacier on its shoulder. First time you can see what you signed up for.",
      points: [
        { name: "Shira Ridge", m: 3600, km: 11, note: "The tree line ends. The view opens and does not close again for five days." },
        { name: "Shira 1 Camp", m: 3505, km: 14, note: "On the floor of an old collapsed cone. The signboard lists every camp still ahead of you.", camp: true },
      ],
    },
    {
      n: 3,
      date: "2026-06-26",
      label: "Across the plateau",
      from: "Shira 1 Camp",
      to: "Shira 2 Camp",
      sleepAt: 3900,
      distanceKm: 7,
      hours: "4–5",
      zone: "Moorland → alpine desert",
      firstFrame: "06:34",
      lastFrame: "18:37",
      blurb:
        "A 6:34 start, and a long slow walk east across the Shira plateau with Kibo growing in front of you all morning. This is giant lobelia and groundsel country — plants that exist nowhere else on earth, standing around like they are waiting for something. You are at 3,900 m by early afternoon, and the sunset that evening happens below you, on top of the clouds.",
      points: [
        { name: "Shira 2 Camp", m: 3900, km: 21, note: "Alpine desert begins. Thin, dry, cold at night, and the last easy day.", camp: true },
      ],
    },
    {
      n: 4,
      date: "2026-06-27",
      label: "Lava Tower, then down to Barranco",
      from: "Shira 2 Camp",
      to: "Barranco Camp",
      sleepAt: 3960,
      distanceKm: 10,
      hours: "7–8",
      zone: "Alpine desert",
      highlight: "climb high, sleep low",
      firstFrame: "08:26",
      lastFrame: "16:41",
      blurb:
        "The ground turns to rock and dust — no soil, no shelter, nothing growing above ankle height. You climb to 4,630 m at Lava Tower, a 300-metre plug of solidified magma, and feel exactly how thin the air is up there. Then you give all that altitude straight back, dropping 670 m into Barranco through a forest of giant senecios. Climb high, sleep low. Your head thanks you for it at two in the morning.",
      points: [
        { name: "Lava Tower", m: 4630, km: 27, note: "Lunch at 15,190 ft. The acclimatisation high point — you come here to suffer briefly on purpose.", peak: true },
        { name: "Barranco Camp", m: 3960, km: 31, note: "Under the Breach Wall, among the giant groundsels, with the summit glaciers hanging directly overhead.", camp: true },
      ],
    },
    {
      n: 5,
      date: "2026-06-28",
      label: "The Wall — and then we didn't stop",
      from: "Barranco Camp",
      to: "Barafu Camp",
      sleepAt: 4673,
      distanceKm: 9,
      hours: "10–11",
      zone: "Alpine desert",
      compressed: true,
      highlight: "the day we skipped a camp",
      firstFrame: "07:57",
      lastFrame: "19:58",
      blurb:
        "This is the day the eight-day itinerary gets folded into seven. You are on the Barranco Wall by eight in the morning — hands on rock, packs handed up, the Kissing Rock move where the trail hugs the face and you do not look right. Most groups come down the far side, walk to Karanga, and stop there for the night. We ate at Karanga and kept walking. By evening you are at Barafu, 4,673 m, pitched on loose scree with the summit ridge directly above you, and the plan is to go up it.",
      points: [
        { name: "Barranco Wall", m: 4200, km: 32.5, note: "257 m of scramble, and the only place on the whole route where you use your hands." },
        { name: "Karanga Camp", m: 3995, km: 36, note: "Where the eight-day trek sleeps. We ate lunch and walked on.", skipped: true },
        { name: "Barafu Camp", m: 4673, km: 40, note: "\"Ice\" in Swahili, and it earns the name. Highest camp of the trip.", camp: true },
      ],
    },
    {
      n: 6,
      date: "2026-06-29",
      label: "The roof of Africa",
      from: "Barafu Camp",
      to: "Uhuru Peak → Millennium Camp",
      sleepAt: 3820,
      distanceKm: 14,
      hours: "12–13",
      zone: "Arctic summit",
      summit: true,
      highlight: "5,895 m",
      firstFrame: "12:22",
      lastFrame: "20:40",
      blurb:
        "Summit day, and nobody takes a photograph for hours. You switchback up frozen scree in air holding about half the oxygen you were born into, and there is nothing to say and no breath to say it with. The first frame anyone shoots all day is at 12:22, at Stella Point on the crater rim — glaciers, cloud below, the hard part behind you. Then an hour along the rim, and at 14:15 the ground stops going up. Uhuru Peak, 5,895 m: the highest point in Africa and the tallest freestanding mountain on earth, and you walked here from a rainforest five days ago. Then you turn around and give back nearly 2,100 m of it before you sleep.",
      points: [
        { name: "Stella Point", m: 5756, km: 45, note: "12:22. The crater rim. The climbing is over; the cold is not." },
        { name: "Uhuru Peak", m: 5895, km: 46, note: "14:15. 19,341 ft. Roof of Africa.", summit: true },
        { name: "Barafu Camp", m: 4673, km: 51, note: "Back down for a rest and a repack before carrying on." },
        { name: "Millennium Camp", m: 3820, km: 55, note: "Below the scree, back among plants, and warm enough to sleep properly.", camp: true },
      ],
    },
    {
      n: 7,
      date: "2026-06-30",
      label: "Down through the green",
      from: "Millennium Camp",
      to: "Mweka Gate",
      sleepAt: null,
      distanceKm: 10,
      hours: "4–5",
      zone: "Rainforest again",
      firstFrame: "10:53",
      lastFrame: "19:06",
      blurb:
        "The mountain runs backwards. Moorland, then heather, then mud and moss and birdsong and fog in the trees, and air so thick it feels like a drink after five days without it. Knees complain the whole way down and nobody cares. You sign out at Mweka Gate, and that evening someone hands you a certificate with your name on it and the number 5,895 printed underneath.",
      points: [
        { name: "Mweka Gate", m: 1640, km: 65, note: "Sign out. 65 km on foot, and 4,255 m of vertical between here and where you stood yesterday afternoon." },
      ],
    },
  ],
};
