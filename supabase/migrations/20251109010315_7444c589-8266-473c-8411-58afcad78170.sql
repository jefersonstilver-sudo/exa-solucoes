-- Delete test benefits for specified test emails
DELETE FROM provider_benefits 
WHERE provider_email IN (
  'alexiarigolon95@gmail.com',
  'jefi92@gmail.com',
  'Brunodantas@proongroup.com',
  'joaotumiski@gmail.com',
  'eduardogabriel.foz@gmail.com'
);