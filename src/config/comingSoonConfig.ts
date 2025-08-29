// Centralized Coming Soon / Maintenance configuration
// NOTE: Env vars (VITE_*) are not supported in this project, so use this file to toggle flags.

// Function to get the next Tuesday at noon
const getNextTuesdayNoon = () => {
  const now = new Date();
  const nextTuesday = new Date(now);
  
  // Get days until next Tuesday (2 = Tuesday)
  const daysUntilTuesday = (2 - now.getDay() + 7) % 7;
  
  // If today is Tuesday and it's before noon, use today
  if (now.getDay() === 2 && now.getHours() < 12) {
    nextTuesday.setHours(12, 0, 0, 0);
  } 
  // If today is Tuesday and it's after noon, or any other day
  else {
    nextTuesday.setDate(now.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
    nextTuesday.setHours(12, 0, 0, 0);
  }
  
  return nextTuesday;
};

// Launch date automatically set to next Tuesday at noon
const LAUNCH_DATE = getNextTuesdayNoon();
export const LAUNCH_DATE_ISO = LAUNCH_DATE.toISOString();

// Function to check if launch time has passed
export const hasLaunchTimePassed = () => {
  return new Date() >= LAUNCH_DATE;
};

// When true, the app shows the ComingSoonPage for all routes
// Disabled manually to open the site
export const MAINTENANCE_MODE = false;

// Controls visibility of the developer access section on ComingSoonPage
export const SHOW_DEV_ACCESS = true;
