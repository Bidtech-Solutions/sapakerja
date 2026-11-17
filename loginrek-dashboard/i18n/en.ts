// English dictionary (served at "/en"). Must have exactly the same keys as id.ts (enforced by `npm run typecheck`).
import type id from './id';

const en: typeof id = {
  ogLocale: 'en_US',
  name: 'English',
  switchTo: 'Ganti ke Bahasa Indonesia',
  switchShort: 'ID',

  meta: {
    title: 'SapaKerja: Selfie & GPS Attendance App for Offices',
    description:
      'SapaKerja is an employee attendance app with selfie and GPS location from the phone. Employees check in within seconds, and HR monitors attendance on a web dashboard. A product of Bidtech, available on iPhone and Android.',
    keywords: [
      'attendance app',
      'employee attendance',
      'selfie attendance',
      'GPS attendance',
      'time and attendance',
      'HR app',
      'HR dashboard',
      'SapaKerja',
      'Bidtech',
    ],
    privacyTitle: 'Privacy Policy',
    privacyDescription:
      'Privacy Policy of the SapaKerja attendance app: what data is collected, how it is used, device permissions, storage, and employee rights.',
    notFoundTitle: 'Page not found',
  },

  a11y: {
    skip: 'Skip to main content',
    mainNav: 'Main navigation',
    home: 'SapaKerja, back to top',
    phoneOf: '{screen} screen of the SapaKerja app',
    mapTitle: 'Map of the Bidtech office in Batam Kota',
    footerFeatures: 'Features',
    footerCompany: 'Company',
    heroCarousel: 'SapaKerja app screens, changing automatically',
    featuresCarousel: 'SapaKerja app features, swipe sideways to see more features',
    featureDot: 'Show feature {n} of {total}',
  },

  nav: {
    features: 'Features',
    faq: 'FAQ',
    contact: 'Contact',
    download: 'Download',
    cta: 'Contact Us',
  },

  hero: {
    title: ['Arrive On Time,', 'Run a More Organized Office'],
    appStoreAlt: 'Download SapaKerja on the App Store',
    playStoreAlt: 'Get SapaKerja on Google Play',
    phones: {
      beranda: "See today's status",
      presensi: 'Say hi to the camera',
      konfirmasi: 'Submit attendance',
      riwayat: 'Check history',
    },
  },

  features: {
    eyebrow: 'SAPAKERJA FEATURES',
    title: 'Everything you need to check in every morning.',
    lead: 'From a selfie in front of the camera to the monthly recap, here are the features you can already use in the SapaKerja app today.',
    items: [
      {
        id: 'fitur-presensi',
        screen: 'presensi',
        tag: 'SELFIE CHECK-IN',
        title: 'Check in by saying hi to the camera.',
        body: 'Employees check in from their own phone. Face and location are checked on the spot, so there is no queue at the fingerprint machine and nobody can check in for a colleague.',
        points: [
          { h: 'Face frame on the camera.', t: 'Helps employees position their selfie correctly.' },
          { h: 'Location checked automatically.', t: 'Shows whether the employee is within the office area, including the distance in metres.' },
          { h: 'Live clock on screen.', t: 'Employees know exactly what time they check in, in WIB.' },
          { h: 'Lighting reminder.', t: 'So the face in the attendance photo is always clearly visible.' },
        ],
      },
      {
        id: 'fitur-konfirmasi',
        screen: 'konfirmasi',
        tag: 'CONFIRMATION & STATUS',
        title: 'Check, submit, instantly recorded.',
        body: 'Before submitting, employees can review their own photo. Once sent, the check-in time and attendance status are recorded with no manual calculation.',
        points: [
          { h: 'Photo preview.', t: 'Not clear enough? Just tap Retake.' },
          { h: 'Check-in time recorded on the server.', t: 'The check-in time is shown clearly once the attendance is submitted.' },
          { h: 'Automatic status.', t: 'On Time or Late is determined from the office working hours.' },
          { h: 'Straight to HR.', t: 'The photo and GPS location appear on the HR Web Dashboard as soon as attendance is submitted.' },
        ],
      },
      {
        id: 'fitur-beranda',
        screen: 'beranda',
        tag: 'HOME',
        title: "Today's status at a glance.",
        body: "As soon as the app opens, employees know whether they have checked in today and how their attendance looks this month.",
        points: [
          { h: 'Daily status card.', t: 'Not Checked In, On Time, or Late, in colours that are easy to tell apart.' },
          { h: 'Working hours and check-in time.', t: "The office working hours are shown next to the employee's check-in time." },
          { h: "This month's recap.", t: 'The number of on-time and late days, plus the total duration of lateness.' },
          { h: 'Last 5 days of attendance.', t: 'Check-in times from the previous working days.' },
        ],
      },
      {
        id: 'fitur-riwayat',
        screen: 'riwayat',
        tag: 'ATTENDANCE HISTORY',
        title: 'Attendance history, neatly kept.',
        body: 'Employees can open their own attendance records at any time, without having to ask HR.',
        points: [
          { h: 'Pick a month.', t: 'Go back to previous months to see older records.' },
          { h: 'Monthly summary.', t: 'Present, late, and absent counts in a single row.' },
          { h: 'Daily activity.', t: 'Every working day is logged with its check-in time and status.' },
        ],
      },
      {
        id: 'fitur-profil',
        screen: 'profil',
        tag: 'PROFILE & ACCOUNT',
        title: 'Employees manage their own account.',
        body: 'Small account tasks no longer need to go through HR or the IT team.',
        points: [
          { h: 'Change profile photo.', t: 'Straight from the camera or gallery.' },
          { h: 'Locked name.', t: 'The full name follows the data from HR, so it cannot be changed casually.' },
          { h: 'Change your own password.', t: 'Just enter the old and new password, at least 8 characters.' },
          { h: 'Sign out.', t: 'Safe when switching phones.' },
        ],
      },
    ],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions.',
    items: [
      {
        q: 'What is SapaKerja?',
        a: 'SapaKerja is an attendance app for offices. Employees record attendance with a selfie and GPS location from their phone (iPhone or Android), while HR monitors attendance on a web dashboard. SapaKerja is a product of Bidtech.',
      },
      {
        q: 'How do employees check in with SapaKerja?',
        a: 'Employees open the app, tap Check-in, take a selfie within the face frame, and submit it. The location is checked automatically and the distance to the office is shown in metres. Once submitted, the check-in time and attendance status are recorded right away.',
      },
      {
        q: 'How is the On Time or Late status determined?',
        a: 'The status is determined automatically from the office working hours and the check-in time recorded on the server, so HR does not have to calculate it manually.',
      },
      {
        q: "What can HR see of an employee's attendance?",
        a: "As soon as attendance is submitted, the employee's photo and GPS location appear on the HR Web Dashboard together with the check-in time and status. Employees can open their own monthly attendance history in the app.",
      },
      {
        q: 'Is SapaKerja available on iPhone and Android?',
        a: 'Yes. SapaKerja is available on the App Store for iPhone and on Google Play for Android.',
      },
      {
        q: "How does SapaKerja handle employees' personal data?",
        a: "Attendance photos can only be accessed by the HR/admin team of the employee's company and are not shared with third parties. SapaKerja does not perform facial recognition. The details are in the Privacy Policy.",
      },
      {
        q: 'How do we start using SapaKerja in our office?',
        a: 'Contact the Bidtech team via WhatsApp or email. We explain the plans, help with the initial setup, and prepare a demo for your HR team. Employee accounts are created by the company HR.',
      },
      {
        q: 'Who makes SapaKerja?',
        a: 'SapaKerja is built and operated by Bidtech (PT Solusi Bisnis Jalanin Aja Dulu), a software house in Batam, Riau Islands, Indonesia.',
      },
    ],
    privacyLink: 'Read the Privacy Policy',
  },

  contact: {
    eyebrow: 'CONTACT',
    title: 'Want to use SapaKerja in your office?',
    lead: 'The Bidtech team is ready to explain the plans, help with the initial setup, and prepare a demo for your HR team. Say hi through whichever channel suits you best.',
    whatsapp: 'Chat on WhatsApp',
    email: 'Send Email',
    emailCard: 'Email',
    phoneCard: 'Phone & WhatsApp',
    phoneLabel: 'Number {n}',
    officeTitle: 'Bidtech Office',
    officeAddress: 'King Business Centre, Block A5 No.3, Belian, Batam Kota, Batam, 29464, Indonesia',
    openMaps: 'Open in Google Maps →',
  },

  download: {
    eyebrow: 'GET SAPAKERJA',
    title: 'Check in from your phone, starting tomorrow morning.',
    lead: "Install SapaKerja on your employees' phones. One hello every morning, and the team's attendance is neatly recorded.",
    chips: ['iPhone & Android', 'Selfie + location', 'Straight to the HR dashboard'],
  },

  footer: {
    about:
      'An attendance app for offices. Employees record their own attendance and leave from their phone, and HR sees who is on time without asking one by one.',
    featuresTitle: 'FEATURES',
    featureLinks: [
      { href: '#fitur-presensi', label: 'Selfie check-in' },
      { href: '#fitur-konfirmasi', label: 'Confirmation & status' },
      { href: '#fitur-beranda', label: 'Home' },
      { href: '#fitur-riwayat', label: 'Attendance history' },
      { href: '#fitur-profil', label: 'Profile & account' },
    ],
    companyTitle: 'COMPANY',
    bidtech: 'Bidtech',
    contact: 'Contact',
    download: 'Download the app',
    privacy: 'Privacy policy',
    hrDashboard: 'HR Dashboard',
    reach: 'CONTACT US',
    tagline: ['Arrive on time,', 'run a tidier office.'],
    copyright: '© 2026 SapaKerja · sapakerja.com',
    madeBy: 'A product of Bidtech · PT Solusi Bisnis Jalanin Aja Dulu',
  },

  notFound: {
    title: 'Page not found',
    body: 'The address you opened does not exist or has been moved.',
    back: 'Back to home',
  },


  privacy: {
    brandSub: 'Privacy Policy',
    updatedLabel: 'Last updated:',
    updatedDate: '17 November 2026',
    title: 'Privacy Policy',
    lead: 'This policy explains what personal data SapaKerja collects, what it is used for, and how it is protected.',
    footerLink: 'Go to sign in',
    homeLink: 'Back to SapaKerja home',
    sections: [
      {
        title: '1. Introduction',
        blocks: [
          {
            type: 'p',
            text: 'SapaKerja is an employee attendance app (iOS, Android, and an HR web dashboard) operated by {company} and used only by company employees. Accounts are created by the company HR; users cannot sign up on their own.',
          },
        ],
      },
      {
        title: '2. Data we collect',
        blocks: [
          {
            type: 'ul',
            items: [
              'Full name.',
              'Email (used to sign in) and phone number, if provided by HR.',
              'Job title, department, and employment status (for example employee, intern, or vocational trainee).',
              'Account ID (an internal number generated by the system).',
              'The selfie photo taken when checking in.',
              'Profile photo (optional), chosen by the user from the photo gallery.',
              'Attendance location data: the device position is read at check-in to calculate the distance to the office point. What is stored in the attendance record is the verification result: the distance from the office (in metres), the office name, and the coordinates of the reference location.',
              'Attendance time and status (on time, late), plus a flag when attendance was submitted later because the device was offline.',
              'Technical data: the login session token stored in the device secure storage, and technical server logs (for example IP address and access time) for security and maintenance.',
            ],
          },
          {
            type: 'p',
            text: 'When the device is offline, attendance data (time, photo, and location) is temporarily kept in the device secure storage and sent to the server once the connection is back.',
          },
        ],
      },
      {
        id: 'attendance-photos',
        title: '3. Attendance Photos',
        blocks: [
          {
            type: 'p',
            text: "When checking in, SapaKerja captures a single photo through the device camera as proof of attendance at the designated office location. The photo may show the user's face, but SapaKerja does not perform face detection or facial recognition, does not create biometric data or face templates, and does not automatically analyze photos. Photos are stored on servers operated by {company}, are only accessible to the HR/admin team of the user's employer, are not shared with any third parties, and are retained for one year after the attendance record is created before being deleted. Users or their employer may request earlier deletion by contacting {email}.",
          },
        ],
      },
      {
        title: '4. How we use data',
        blocks: [
          {
            type: 'ul',
            items: [
              'Recording and verifying employee attendance.',
              'Calculating attendance punctuality.',
              'Compiling attendance recaps for HR.',
              'Managing employee accounts.',
            ],
          },
          {
            type: 'p',
            text: 'Data is not used for advertising, is not sold, and is not used to track users across other apps or websites. The mobile app does not include third-party advertising, analytics, or crash-reporting SDKs.',
          },
        ],
      },
      {
        title: '5. Device permissions',
        blocks: [
          {
            type: 'ul',
            items: [
              '**Camera** — to take the selfie photo for attendance.',
              '**Location while using the app** — to confirm you are within the office area. Location is only read while the app is open for check-in; the app does not track location in the background.',
              '**Photo gallery** — to choose a photo for your profile picture. The app only uses the photo you pick.',
            ],
          },
          {
            type: 'p',
            text: 'Permissions are requested right before the related feature is used and can be revoked at any time in your device settings. Without camera or location permission, attendance cannot be recorded.',
          },
        ],
      },
      {
        title: '6. Who can access the data',
        blocks: [
          {
            type: 'p',
            text: 'Attendance and profile data can be accessed by the employee concerned and by the admin/HR of {company}. Data is not shared with third parties, except where required by law or an official request from an authorised agency.',
          },
          {
            type: 'p',
            text: 'The servers and photo storage are managed by the company. One thing worth knowing: on the HR web dashboard, the attendance detail shows an embedded Google Maps map of the check-in location, so Google receives the coordinates of that point and technical data from the browser of the admin who opens the map.',
          },
        ],
      },
      {
        id: 'website',
        title: '7. The public website sapakerja.com',
        blocks: [
          {
            type: 'p',
            text: 'This section applies to visitors of the public website sapakerja.com (the product introduction pages and this page), not to app users.',
          },
          {
            type: 'ul',
            items: [
              '**Google Tag Manager and Google Analytics** — we use Google Tag Manager to load the Google Analytics measurement tool, which measures visits, for example the pages opened, approximate region, device type, and browser. Google may store cookies or similar identifiers in your browser. This data is statistical and is not used to identify you personally.',
              '**Google Maps** — the Contact section shows an embedded map of the Bidtech office. When the map loads, Google receives technical data from your browser (for example your IP address).',
              '**Fonts** — the fonts on this site are served from our own server, not from Google Fonts.',
              'This site does not ask you to enter personal data. If you contact us via WhatsApp or email, we only use the data you send to respond to that message.',
            ],
          },
          {
            type: 'p',
            text: 'You can refuse or delete cookies in your browser settings, or install the Google Analytics opt-out browser add-on.',
          },
        ],
      },
      {
        title: '8. Storage and security',
        blocks: [
          {
            type: 'ul',
            items: [
              'Data is sent between the app/dashboard and the server over HTTPS.',
              'Passwords are stored as hashes, not plain text.',
              'Access to data is restricted by account and role (employee or HR).',
              'Photos are stored in object storage on the company server.',
              'The login token on the device is kept in the system secure storage (Keychain/Keystore).',
            ],
          },
          {
            type: 'p',
            text: 'No system is entirely free of risk, but we work to protect data with reasonable technical measures.',
          },
        ],
      },
      {
        title: '9. Data retention',
        blocks: [
          {
            type: 'p',
            text: 'Data is kept while the employee is active and for as long as needed for employment purposes and the company legal obligations. After that, data is deleted or anonymised.',
          },
        ],
      },
      {
        title: '10. Employee rights',
        blocks: [
          {
            type: 'p',
            text: 'You may request access to, correction of, or deletion of your personal data through your company HR or by email at {email}. The handling of this personal data follows Indonesian Law No. 27 of 2022 on Personal Data Protection.',
          },
        ],
      },
      {
        title: '11. Children',
        blocks: [
          {
            type: 'p',
            text: 'This app is not intended for children under 13. All accounts are created and managed by the company HR; there is no self sign-up.',
          },
        ],
      },
      {
        title: '12. Policy changes and contact',
        blocks: [
          {
            type: 'p',
            text: 'This policy may be updated from time to time. The date of the latest update is shown at the top of this page. For questions about this policy, contact us:',
          },
        ],
      },
    ],
  },
};

export default en;
