import type { Translation } from './id';

/** English dictionary. Must have exactly the same keys as `id.ts` (enforced by the type). */
const en: Translation = {
  common: {
    employee: 'Employee',
    ok: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    continue: 'Continue',
    openSettings: 'Open Settings',
    backToHome: 'Back to Home',
    goToMainMenu: 'Go to Home',
    notice: 'Notice',
    tabs: {
      history: 'History',
      attendance: 'Check-in',
      profile: 'Profile',
      home: 'Home',
    },
    status: {
      onTime: 'On Time',
      late: 'Late',
      present: 'Present',
      absent: 'Absent',
    },
  },

  date: {
    dayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthShort: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    monthLong: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    today: 'Today',
    clockIn: 'Clock-in: {{time}} WIB',
  },

  login: {
    tagline: 'Arrive On Time, Keep the Office Organized',
    logoLabel: 'SapaKerja logo',
    title: 'Sign In',
    subtitle: 'Please sign in with your employee account',
    identifierLabel: 'Email or phone number',
    identifierPlaceholder: 'name@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    submit: 'Sign In',
    fillAllFields: 'Please enter your email and password',
    invalidCredentials: 'Incorrect email or password.',
    serverError: 'Something went wrong on the server. Please try again shortly.',
    offline: 'Unable to reach the server. Your first sign-in requires an internet connection.',
  },

  home: {
    status: {
      holiday: 'Day Off',
      closed: 'Office Closed',
      notYet: 'Not Checked In',
    },
    officeHours: 'Office Hours',
    checkInTime: 'Check-in Time',
    recapTitle: 'THIS MONTH',
    targetMet: '95% target reached',
    noRecords: 'No records yet',
    totalDuration: 'Total duration recorded',
    punctuality: '100% punctuality',
    recentTitle: 'Last 5 Days of Attendance',
    recentSubtitle: 'Check-in times for previous workdays',
    seeAll: 'See All',
    emptyTitle: 'No Attendance History Yet',
    emptySubtitle: 'Check in today to start recording your attendance.',
  },

  attendance: {
    alreadyTitle: 'Already Checked In Today',
    alreadyBody: 'You have already checked in today at {{time}} WIB.',
    cameraNeededTitle: 'Camera Access Needed',
    cameraNeededBody: 'Please allow camera access first to check in.',
    locationNeededTitle: 'Location Access Needed',
    locationNeededBody: 'Please turn on location services (GPS) first to check in.',
    outsideTitle: 'Check-in Declined (Outside Office) 🚫',
    outsideBody:
      'You are {{distance}} meters outside the {{office}} area.\n\nYou can only check in from inside the office (within {{max}} meters). Employees cannot check in from home or other locations.',
    checkLocationAgain: 'Check Location Again',
    impreciseTitle: 'Location Not Precise Enough',
    preciseOffBody:
      'Check-in needs a precise location, but SapaKerja is only allowed to use an approximate one. Turn on “Precise Location” and try again.',
    weakSignalBody:
      'The location signal is too weak (accuracy about {{accuracy}} m, maximum {{max}} m). Move to an open area or near a window, make sure GPS is in high-accuracy mode, then check again.',
    enablePrecise: 'Turn On Precise Location',
    mockedTitle: 'Fake Location Detected',
    mockedBody:
      'This device is using a mock location. Turn off the fake-location app and try again.',
    unavailableTitle: 'Location Not Available',
    unavailableBody:
      'The device location could not be read. Make sure GPS is on and location permission is allowed, then try again.',
    pillImprecise: 'Location not precise',
    pillMocked: 'Fake location detected',
    pillUnavailable: 'Location unavailable',
    captureFailedTitle: 'Could Not Take Photo',
    captureFailedBody: 'Something went wrong while using the camera.',
    submitFailedTitle: 'Could Not Submit Attendance',
    submitFailedBody: 'Something went wrong while saving your attendance.',
    successTitle: 'Attendance Submitted! 🎉',
    alreadyOnServer: 'Your attendance is already recorded on the server today.',
    successBody:
      'Your check-in was recorded on the server at {{time}} WIB ({{status}}). Your photo and GPS location are available on the Web Dashboard right away.',
    queuedTitle: 'Attendance Saved (Offline Queue) 📲',
    queuedBody:
      'Your check-in was saved at {{time}} WIB ({{status}}).\n\nThe data is stored safely on your phone and will sync to the server automatically once you are online.',
    recordedTime: 'CHECK-IN TIME RECORDED',
    attendanceStatus: 'ATTENDANCE STATUS',
    retake: 'Retake',
    submit: 'Submit Attendance',
    lightingHint: 'Make sure the lighting is good and your face is clearly visible',
    insideOffice: 'Inside the Office ({{distance}}m)',
    outsideOffice: 'Outside the Office ({{distance}}m / Max {{max}}m)',
    offlineMode: 'Offline Mode (Saved on Device)',
    capturing: 'Capturing…',
    checkingLocation: 'Checking location…',
    shutterLabel: 'Check-in button',
  },

  permission: {
    checking: 'Checking permissions…',
    camera: {
      askTitle: 'Camera access needed',
      askBody:
        'SapaKerja uses the front camera to take your selfie when you check in. Tap Continue, then choose Allow in the dialog that appears.',
      blockedTitle: 'Camera access is off',
      blockedBody:
        'Camera access is turned off for SapaKerja. Turn it on in Settings so you can take your attendance photo.',
      guideTitle: 'Quick Guide',
      steps: [
        { title: 'Open the app settings', subtitle: '' },
        { title: 'Open Permissions / Camera', subtitle: '' },
        { title: 'Turn on Camera access', subtitle: '' },
      ],
    },
    location: {
      askTitle: 'Location access needed',
      askBody:
        'SapaKerja uses your location while the app is in use to confirm you are at the office when you check in. Tap Continue, then choose Allow While Using App.',
      blockedTitle: 'Location access is off',
      blockedBody:
        'Location access is turned off for SapaKerja. Turn it on in Settings so your presence at the office can be verified.',
      servicesOffTitle: 'Location services (GPS) are off',
      servicesOffBody:
        'Location Services are turned off on your device. Turn them on so SapaKerja can verify your position when you check in.',
      guideTitle: 'Quick Guide',
      stepsBadge: '3 STEPS',
      steps: [
        { title: 'Open device Settings', subtitle: 'Go to the privacy or app settings menu' },
        {
          title: 'Turn on Location Services (GPS)',
          subtitle: 'Make sure high-accuracy mode is on',
        },
        {
          title: "Allow location 'While Using the App'",
          subtitle: 'Choose this option so your check-in can be validated automatically',
        },
      ],
    },
    gallery: {
      blockedTitle: 'Photo Library Access Needed',
      blockedBody:
        'SapaKerja needs access to your photo library so you can choose and change your profile photo. Turn it on in Settings.',
    },
  },

  history: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    openCalendar: 'Open attendance calendar',
    closeCalendar: 'Close calendar',
    pickThisMonth: 'Select this month',
    dayLabel: 'Day {{day}}',
    dateFilter: 'Date filter:',
    clearFilter: 'Clear date filter',
    showAll: 'Show All',
    activityTitle: 'Attendance Activity',
    recordCount_one: '{{count}} Record',
    recordCount_other: '{{count}} Records',
    detailLabel: 'Attendance details for {{day}}',
    backToHistory: 'Back to History',
    noRecordsOnDate: 'No attendance records on {{date}}.',
    showAllDays: 'Show All Days',
    emptyTitle: 'No attendance this month yet.',
    emptySubtitle:
      'Your attendance records for this period will appear automatically after your first check-in.',
    viewPreviousMonth: 'View Previous Month',
  },

  profile: {
    editTitle: 'Edit Profile',
    changePhoto: 'Change Photo',
    updatingPhoto: 'Updating...',
    changePhotoLabel: 'Change profile photo',
    fullName: 'Full Name',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    currentPasswordPlaceholder: 'Enter your current password',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'At least 8 characters',
    save: 'Save Changes',
    logout: 'Sign Out',
    logoutTitle: 'Sign Out?',
    logoutMessage:
      'Your session will end. You will need to enter your email and password again to sign in.',
    logoutConfirm: 'Yes, Sign Out',
    autoSavedTitle: 'Profile Saved Automatically 🎉',
    autoSavedBody:
      'Your profile photo is saved automatically, no need to tap save.\n\nEnter your current and new password if you want to change your account password.',
    enterCurrent: 'Please enter your current password.',
    enterNew: 'Please enter a new password.',
    minLength: 'The new password must be at least 8 characters.',
    failedTitle: 'Failed',
    wrongPassword: 'The current password you entered is incorrect.',
    noConnectionTitle: 'No connection',
    noConnectionBody:
      'Changing your password requires an internet connection. Please try again when you are online.',
    passwordUpdatedTitle: 'Success 🎉',
    passwordUpdatedBody:
      'Your password was updated! Please use the new password the next time you sign in.',
    photoUpdatedTitle: 'Profile Photo Updated! 🎉',
    photoSynced:
      'Your profile photo is saved automatically and already updated on the Admin Web Dashboard.',
    photoLocalOnly:
      'Your profile photo is saved on this phone and will sync to the Web Dashboard automatically once the server is reachable.',
    photoFailedTitle: 'Could Not Select Photo',
    photoFailedBody: 'Something went wrong while opening the photo library.',
  },

  notification: {
    channelAlarm: 'Alarm',
    channelInfo: 'Info',
  },

  startupUpdate: {
    title: 'Preparing update…',
    hint: 'Please wait a moment, the app will restart automatically.',
  },

  appInfo: {
    label: 'App version information',
    embedded: 'Built-in',
  },
};

export default en;
