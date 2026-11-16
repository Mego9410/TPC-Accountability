/* =========================================================================
   The photography.

   Placeholders, deliberately: these are generated images standing in for the
   six shots in the photography brief, so the page can be built and judged at
   full strength before a camera goes near a real practice. Swap the files at
   these paths once the shoot is done and nothing else has to change.

   Nothing here may show an identifiable patient or any patient record.
   ------------------------------------------------------------------------- */

export const PHOTO = {
  exterior: "/photography/exterior-blue-hour.webp",
  reception: "/photography/reception-morning.webp",
  huddle: "/photography/huddle.webp",
  surgery: "/photography/surgery-doorway.webp",
  diary: "/photography/diary.webp",
  receptionPatient: "/photography/reception-patient.webp",
  twoPrincipals: "/photography/two-principals.webp",
  notebook: "/photography/notebook.webp",
  frontDoor: "/photography/front-door.webp",
  readingRoom: "/photography/reading-room.webp",
  sealedLetter: "/photography/sealed-letter.webp",
  road: "/photography/map-ground.webp",
} as const;

export const MARK = "/brand/monogram.png";
export const WORDMARK = "/brand/wordmark.png";

/** The morning, hour by hour. Shared by the landing filmstrip and the visit planner. */
export const STAGES = [
  {
    time: "8.40",
    title: "Arrive",
    desc: "Coffee in the staff room before the first patient is through the door.",
    img: PHOTO.reception,
    alt: "A quiet reception desk in early morning light",
    m: 0,
  },
  {
    time: "9.00",
    title: "The huddle",
    desc: "How the day gets set, who says what, and how long it actually takes.",
    img: PHOTO.huddle,
    alt: "A dental team gathered for the morning huddle",
    m: 20,
  },
  {
    time: "9.30",
    title: "The surgeries",
    desc: "Layout, kit, what they bought, and what they wish they had not.",
    img: PHOTO.surgery,
    alt: "A dental surgery seen from the doorway",
    m: 50,
  },
  {
    time: "11.00",
    title: "The diary",
    desc: "Where the gaps are, who fills them, and what happens to a failed appointment.",
    img: PHOTO.diary,
    alt: "A practice manager at the appointment diary",
    m: 140,
  },
  {
    time: "12.15",
    title: "Reception",
    desc: "The conversation that turns an enquiry into a booking, heard first hand.",
    img: PHOTO.receptionPatient,
    alt: "A receptionist speaking with a patient",
    m: 215,
  },
  {
    time: "1.00",
    title: "Lunch",
    desc: "The questions you actually came to ask.",
    img: PHOTO.twoPrincipals,
    alt: "Two principals talking over lunch",
    m: 260,
  },
] as const;

export const STAGE_SPAN = 260;
