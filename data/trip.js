/*  Kilimanjaro: Lemosho Route, 7 days, June 24-30 2026
 *
 *  This is the single place to edit the trip. Everything on the site is
 *  rendered from here: the day openers, the sheets, the elevation profile,
 *  the blood oxygen chart, the route points, the stat tiles, the ledger.
 *
 *  Elevations are in meters; the site converts to feet on the fly.
 *  `km` on a point is cumulative distance walked since the trailhead. It is
 *  what positions the point on the elevation profile.
 *
 *  WRITING NUMBERS IN THE PROSE
 *  Never type an elevation or a distance directly into a sentence, or it will
 *  be stuck in one unit while the rest of the page switches. Use a token:
 *      {{4673}}     an elevation in meters -> "15,331 ft" or "4,673 m"
 *      {{65km}}     a distance             -> "40.4 mi" or "65 km"
 *  app.js swaps these for live values that follow the ft/m toggle.
 *
 *  Dates and the on-the-move times come from the EXIF capture times on the
 *  trip photos and drone clips, which agree with each other to the minute.
 *  The narrative, the SpO2 readings and the times are Eric's own account,
 *  written in his voice: "I" for himself, "we" for the group.
 */

const TRIP = {
  title: "Kilimanjaro",
  subtitle: "Lemosho Route · seven days · June 2026",
  summitDate: "2026-06-29",
  cover: "IMG_3673",

  facts: {
    summitElevation: 5895,
    startElevation: 2360,
    distanceKm: 65,
    days: 7,
    nightsOnMountain: 6,
    highestSleep: 4673,
    summitTime: "2:10 pm",
    startSpo2: 89,
    summitSpo2: 32,
  },

  /* Full-bleed moments between days. `after` is the day number they follow. */
  interstitials: [
    { after: 4, image: "IMG_3689",
      quote: "There is no way I am getting up that.",
      caption: "Barranco Camp, 4:41 pm. The Wall is the skyline I am looking at." },
    { after: 5, image: "IMG_3711",
      quote: "Above the clouds, with the city lights showing through the gaps.",
      caption: "Barafu Camp, 5:56 pm, {{4673}}. Summit push in nine hours." },
    { after: 6, image: "IMG_3702",
      quote: "It was the hardest thing I have ever done.",
      caption: "The summit ridge from below" },
  ],

  days: [
    {
      n: 1,
      hero: "IMG_3624",
      heroCaption: "Mti Mkubwa camp, my first night under the canopy",
      date: "2026-06-24",
      label: "Into the rainforest",
      from: "Londorossi Gate",
      to: "Mti Mkubwa (Forest Camp)",
      sleepAt: 2785,
      distanceKm: 6,
      hours: "3–4",
      zone: "Montane rainforest",
      firstFrame: "08:18",
      lastFrame: "18:43",
      spo2: 89,
      blurb: [
        "I sign the register at Londorossi, ride a truck up a red-dirt road, and start walking where the forest closes over the track. Humid and loud: colobus monkeys somewhere overhead, water running off the trail, moss on everything. As a hike it is gentle. Almost nothing about the first day is technically hard.",
        "What is hard is that I started this trip with a stomach bug. It decides what I can eat and it decides, with no notice, when I need to leave the trail. Somewhere in the bushes on day one I find out the hard way that Kilimanjaro's rainforest has stinging nettles, that they are waist-height, and that I was not looking. It hurts. It stops hurting after about five minutes. It is the funniest thing that happens to me all week.",
        "The real enemy today is mud. It is slick and constant and it will still be there on the last day, waiting.",
      ],
      moments: [
        { title: "The nettle", text: "Stomach bug, no bathroom, tall bushes, a stinging nettle plant. Five minutes of genuine pain and a story for life." },
        { title: "Mud", text: "The hardest part of an otherwise easy day. Slippery the whole way up, and it will be worse on the way down." },
      ],
      points: [
        { name: "Londorossi Gate", m: 2100, km: 0, note: "Registration and permits. {{2100}}, already higher than most of the country." },
        { name: "Lemosho Trailhead", m: 2360, km: 0, note: "Boots on. The forest starts here." },
        { name: "Mti Mkubwa", m: 2785, km: 6, note: "\"Big Tree\". First camp, first night under the canopy.", camp: true },
      ],
    },
    {
      n: 2,
      hero: "IMG_3636",
      heroCaption: "Up the Shira Ridge, out of the trees for good",
      date: "2026-06-25",
      label: "Out of the trees",
      from: "Mti Mkubwa",
      to: "Shira 1 Camp",
      sleepAt: 3505,
      distanceKm: 8,
      hours: "5–6",
      zone: "Heather & moorland",
      highlight: "the day I nearly talked myself out of it",
      firstFrame: "08:35",
      lastFrame: "17:40",
      spo2: 82,
      blurb: [
        "I wake at three in the morning to monkeys fighting somewhere in the dark, and then I keep waking, in and out, never properly under. At one point I surface with my heart going far too fast, and that frightens me. Stack that on top of a stomach that still isn't right and a head cold that arrived overnight, stuffed and congested, and this is the morning I quietly start second-guessing the whole trip.",
        "And then the day gets better. It usually does. I eat more than I managed yesterday. The canopy thins and quits, and we climb the Shira Ridge through giant heather with white-necked ravens tracking us along the trail, close enough to watch properly. The ridges are genuinely beautiful. The hiking is intense, essentially all incline, but I am moving well.",
        "At camp I lie down for a nap and sleep straight through tea, surfacing only for dinner. It is the best decision I make all week. I wake the next morning better than I have felt since the gate. This is also the day the altitude introduces itself, as a headache that arrives and then stays.",
      ],
      moments: [
        { title: "3 a.m., monkeys fighting", text: "Screaming in the dark outside the tent. Sleep came in fragments after that." },
        { title: "Racing heart", text: "Waking up with my pulse far too fast at {{3505}} is its own kind of frightening." },
        { title: "The nap that saved it", text: "I slept clean through tea time, woke for dinner, and woke the next day genuinely improved." },
      ],
      points: [
        { name: "Shira Ridge", m: 3600, km: 11, note: "The tree line ends. The view opens and does not close again for five days." },
        { name: "Shira 1 Camp", m: 3505, km: 14, note: "On the floor of an old collapsed cone. The signboard lists every camp still ahead of us.", camp: true },
      ],
    },
    {
      n: 3,
      hero: "IMG_3658",
      heroCaption: "Crossing the Shira plateau, Kibo on the horizon all morning",
      date: "2026-06-26",
      label: "Across the plateau",
      from: "Shira 1 Camp",
      to: "Shira 2 Camp",
      sleepAt: 3900,
      distanceKm: 7,
      hours: "4–5",
      zone: "Moorland → alpine desert",
      highlight: "everything takes more out of me than it should",
      firstFrame: "06:34",
      lastFrame: "18:37",
      spo2: 75,
      blurb: [
        "A 6:34 am start and a long, slow walk east across the Shira plateau with Kibo growing in front of us all morning. As a hike it is simple: flat, open, forgiving, and after yesterday it lands like a rest day. The cold symptoms are still with me but I feel better than I did. This is giant lobelia and groundsel country, plants that grow nowhere else on earth, standing around like they are waiting for something.",
        "This is the day I think I have lost the drone. I go through my bag and it is not where I expect it, and going through a bag up here is its own problem. Bending over, digging, shifting things from one side to the other, all of it takes more out of me than it should. It turns up. It had been misplaced in my own bag the whole time. Handling my own gear has become a chore.",
        "The altitude keeps working on me all day and the headache sharpens toward evening. By the end of it, moving costs me. I sit down on the ground, get back up, and my head swims the way it would if I had jumped to my feet. I had not. That is the altitude sickness doing it, and it happens every time I get up. No nap today.",
        "That evening the sun sets below us, on top of the clouds.",
      ],
      moments: [
        { title: "The drone I thought I'd lost", text: "It was misplaced in my own bag. Searching for it at altitude is heavy work, and finding things had started to cost real effort." },
        { title: "Head rush", text: "Sitting down and standing back up made my head swim as though I had jumped to my feet. I hadn't. The altitude sickness was doing it." },
        { title: "Sunset from above", text: "{{3900}}, and the weather is happening underneath us." },
      ],
      points: [
        { name: "Shira 2 Camp", m: 3900, km: 21, note: "Alpine desert begins. Thin, dry, cold at night, and the last easy day.", camp: true },
      ],
    },
    {
      n: 4,
      hero: "IMG_3687",
      heroCaption: "The giant groundsels below Barranco",
      date: "2026-06-27",
      label: "Pole pole",
      from: "Shira 2 Camp",
      to: "Barranco Camp",
      sleepAt: 3960,
      distanceKm: 10,
      hours: "7–8",
      zone: "Alpine desert",
      highlight: "pole pole: slowly, slowly",
      firstFrame: "08:26",
      lastFrame: "16:41",
      spo2: 65,
      blurb: [
        "This is the day the mental strain arrives. I wake up and the thought lands fully formed: I have to hike today, and it is going to take all day, and then I have to do it again. I hit sections where I look up and think there is no way I get over that, and the self-doubt gets a real foothold for the first time.",
        "So I go step by step. The word here is <i>pole pole</i>: slowly, slowly. Today it stops being a phrase the guides say and becomes the only way anything happens. The headache is harder now. The thin air is exhausting in a way that is difficult to explain to anyone who hasn't been in it: putting my shoes on makes me tired. Any incline at all is a fight. Going downhill is the only time I get my breath back, which is why dropping into Barranco feels like mercy.",
        "Eating is becoming a problem. My appetite has not gone anywhere, but getting food down has turned into work. Soup goes down. Porridge goes down. I take as much of both as I can hold, because it is energy and I am going to need it. I keep forgetting to bring my water to meals, which makes all of it harder.",
        "Somewhere along here we pass rocks the buffalo come up to lick salt from. And somewhere along here I go looking for one of my first-layer gloves and cannot find it, which I notice, and then worry about, because summit day is in two days.",
      ],
      moments: [
        { title: "Tired putting my shoes on", text: "At {{3960}}, bending over to lace my boots is genuinely aerobic work." },
        { title: "The salt licks", text: "Rocks the buffalo climb to for salt, well above where I expected to find them." },
        { title: "The missing glove", text: "One first-layer glove I could not find anywhere. Two days from the summit, that is not a small problem." },
      ],
      points: [
        { name: "Lava Tower", m: 4630, km: 27, note: "Lunch at {{4630}}. The acclimatization high point. We come up here to suffer briefly, on purpose.", peak: true },
        { name: "Barranco Camp", m: 3960, km: 31, note: "Under the Breach Wall, among the giant groundsels, the summit glaciers hanging directly overhead.", camp: true },
      ],
    },
    {
      n: 5,
      hero: "IMG_3696",
      heroCaption: "Hands on rock. The Barranco Wall, 8:02 am",
      date: "2026-06-28",
      label: "The Wall, and then we didn't stop",
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
      spo2: 58,
      blurb: [
        "I start the day still missing a glove, with a sock on one hand.",
        "I saw the Barranco Wall yesterday, from below, and my verdict was immediate: there is no way I am getting up that. It is steep enough that it doesn't read as a trail at all. Then it is morning and I am on it, and it turns out I was right about one thing. I have to physically climb rocks. Hands on holds. And when I turn around, the drop behind me is exactly as far down as it looked.",
        "Two things happen on the Wall. A porter loses the bag he is carrying and it goes over the edge into the valley, and the whole slow arc of it seems to take minutes, and there is nothing any of us can do but watch it go. And we pass a man who has frozen with fear. He has stopped completely and cannot make himself move in either direction.",
        "Then the Kissing Rock, where the trail hugs the face so close I have to press against it, holding on with everything, with several stories of nothing underneath. The climbing part is honestly fun. The altitude sickness sitting on top of it makes it hard to enjoy properly.",
        "We get to the top and everyone breathes with relief that we are done with the Wall. And the day is not over. Most groups walk to Karanga from here and stop for the night. That is the eight-day itinerary. We ate at Karanga and kept going, because we were doing this in seven.",
        "It is colder today. More layers. We get to Barafu in the evening: {{4673}}, all loose rock, the summit visible directly above us. We are above the clouds, and at night I can see the city lights far below through the gaps. The briefing is about tomorrow: 3 am wake-up and exactly what we will carry. And going through my bag that night, the glove turns up. It had been buried in there the whole time. The relief is out of all proportion to a glove.",
      ],
      moments: [
        { title: "A sock for a glove", text: "Down one first layer for the whole of the Wall, improvising with a sock." },
        { title: "The dropped bag", text: "A porter's load went over the edge and fell into the valley in what felt like slow motion. Nothing any of us could do but watch." },
        { title: "The frozen climber", text: "A man stopped dead on the Wall, unable to make himself move in either direction." },
        { title: "Kissing Rock", text: "Press myself to the face, hold on, and do not let go. A long way down if I do." },
        { title: "The glove turns up", text: "Buried in my own bag the entire time. It surfaces at Barafu the night before the summit, and the relief is enormous." },
        { title: "City lights from {{4673}}", text: "Above the cloud layer at Barafu, with the lights of the town showing through the gaps." },
      ],
      points: [
        { name: "Barranco Wall", m: 4200, km: 32.5, note: "{{257}} of scramble, and the only place on the route where I climbed with my hands." },
        { name: "Karanga Camp", m: 3995, km: 36, note: "Where the eight-day trek sleeps. We ate lunch and walked on.", skipped: true },
        { name: "Barafu Camp", m: 4673, km: 40, note: "\"Ice\" in Swahili, and it earns it. Highest camp, shortest night.", camp: true },
      ],
    },
    {
      n: 6,
      hero: "IMG_3729",
      heroCaption: "Uhuru Peak, 2:10 pm. Minutes before it went wrong",
      date: "2026-06-29",
      label: "The roof of Africa",
      from: "Barafu Camp",
      to: "Uhuru Peak → Millennium Camp",
      sleepAt: 3820,
      distanceKm: 14,
      hours: "19 h",
      zone: "Arctic summit",
      summit: true,
      highlight: "the hardest thing I have ever done",
      firstFrame: "12:22",
      lastFrame: "20:40",
      spo2: 55,
      spo2Low: 32,
      blurb: [
        "3 am, which is late for this mountain. Most groups leave for the summit at midnight. My gear was laid out the night before. I eat breakfast, collect my bag, and go. Today food and water are equipment. I will be moving continuously with no real lunch, because the air up here is too thin to let me linger.",
        "The guide tells me the first incline is the hardest part of the day. I take that and make a deal with myself: get through this bit and I will make the top.",
        "The altitude sickness is worse than it has ever been. I take ibuprofen for the headache. Every step is a negotiation. It feels like five minutes to move five feet: tiny steps, and breathing that keeps getting harder. Move fast and I pay for it immediately, so I pace my breath to my feet, one to one, and I hold that rhythm because the moment I break it I am wrecked. It takes forever, because it is nothing but uphill.",
        "We reach the crater rim. Stella Point, 12:22 pm, and it is the first photograph any of us has taken all day, nine hours in. I stop to eat and I am hollowed out; it takes everything I have to start moving again. An apple. Something light. Anything too sweet or refined makes me feel sick.",
        "From the rim it is another hour along the crater edge to the highest point in Africa. Up there everything is alien, the closest to another planet I am likely to stand. The snow is as hard as rock. Time moves differently. And if the climb up to the rim was slow, this last stretch along it is something else again: ten to fifteen minutes to cover five feet. Every single step feels like I have just finished running for my life. Left, right. Left, right.",
        "<b>2:10 pm. Uhuru Peak, {{5895}}.</b> They say people cry up here, after what it takes to arrive. I didn't, but I understood exactly why they do. It was the hardest thing I have ever done, it took everything I had, and I did it. The euphoria hits like a wave.",
        "And then it goes wrong. I get too excited and move too fast trying to get down from the peak, and at that altitude I do not get away with it. I pass out. There are gaps in what I remember on both sides of it, the minutes before and the minutes after. What I do have is my blood oxygen reading in the <b>30s</b>, and an oxygen tank with the tube strapped to my nose, and me breathing in as hard as I can manage. I stay on it for the descent and come off it once we are low enough.",
        "After that everything is about losing altitude quickly. The guide takes my weight and we go down fast. The gravel slides under our feet the whole way and I keep losing my footing while I am still badly confused. Porters come up to help get me back to camp. I arrive at Barafu and think it is somewhere new, a camp I have not seen before. I go into the dining tent, come out, and have no idea what has happened or where I am. The closest thing I can compare it to is a concussion: the fog, the missing pieces, and my body not doing what I ask it, so that simply moving is hard work.",
        "My oxygen is at 55 and that is not good enough to sleep at {{4673}}. So the day is still not over. We hike down to a lower camp in the dark with porters supporting me, and I drift in and out of confusion the whole way. I get there better than I was at Barafu, still at 55, but better, and hoping sleep will do the rest.",
        "I reach my tent at 10 pm. Nineteen hours after I started.",
      ],
      moments: [
        { title: "3:00 am start", text: "Most groups leave for the summit at midnight. We left at three." },
        { title: "Nine hours to the first photo", text: "None of us had a hand or a breath to spare until Stella Point at 12:22 pm." },
        { title: "2:10 pm · Uhuru Peak", text: "{{5895}}. Highest point in Africa, tallest freestanding mountain on earth." },
        { title: "SpO₂ in the 30s", text: "I passed out coming down from the peak. Oxygen tube strapped to my nose for the descent, off it again once the altitude came down.", critical: true },
        { title: "Gaps in the day", text: "I lose the minutes either side of passing out, and the confusion stays with me into the night." },
        { title: "The hike down in the dark", text: "55% and falling asleep on my feet, but too high to stay. Down to a lower camp, arriving 10 pm." },
      ],
      points: [
        { name: "Stella Point", m: 5756, km: 45, note: "12:22 pm. The crater rim. The climbing is over; the cold and the thin air are not." },
        { name: "Uhuru Peak", m: 5895, km: 46, note: "2:10 pm. {{5895}}. The goal complete, and then the emergency.", summit: true },
        { name: "Barafu Camp", m: 4673, km: 51, note: "Carried in confused, off the tank by now. Too high to stay the night." },
        { name: "Millennium Camp", m: 3820, km: 55, note: "Reached at 10 pm in the dark. Lower, warmer, survivable.", camp: true },
      ],
    },
    {
      n: 7,
      hero: "IMG_3748",
      heroCaption: "Back into the fog, and the mud",
      date: "2026-06-30",
      label: "Down through the mud",
      from: "Millennium Camp",
      to: "Mweka Gate",
      sleepAt: null,
      distanceKm: 10,
      hours: "5–6",
      zone: "Rainforest again",
      firstFrame: "09:54",
      lastFrame: "19:06",
      blurb: [
        "I wake up better. The confusion has mostly lifted. What is left is a mental fog, gaps where facts should be, and it keeps clearing as the day goes on.",
        "The tipping ceremony happens this morning. The whole crew sing and dance for us at camp, all of them together, and it is the best mood anyone has been in all week. Then we pack and start walking.",
        "The first stretch is rocky and downhill, and the gravel slides under me, so most of the effort goes on braking rather than moving. Manageable. Then we hit the forest, and the forest has its own rules. The flat parts are fine. Every descent is mud: deep, slick, unavoidable mud that gets on my pants and then on everything else.",
        "I know the end is close but I have no idea how close, and it goes on and on, hours of nothing but downhill through a churned brown path. And then it stops, and there is a gate, and I sign out of the park.",
        "The certificate comes afterward, once I am off the mountain: my name on it, and 5,895 m printed underneath the way the sign at the summit has it.",
      ],
      moments: [
        { title: "The crew dancing", text: "The tipping ceremony at camp. The whole team singing and dancing before we started down." },
        { title: "Mud, again", text: "Same enemy as day one, in the same forest, going the other way. Everything got covered." },
      ],
      points: [
        { name: "Mweka Gate", m: 1640, km: 65, note: "Sign out. {{65km}} on foot, and {{4255}} of vertical between here and where I stood yesterday afternoon." },
      ],
    },
  ],
};
