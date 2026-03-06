// Clear all Foodra localStorage data
// Run this in browser console if you see old hardcoded data

const foodraKeys = [
  'foodra_products',
  'foodra_training',
  'foodra_applications',
  'foodra_enrollments',
];

foodraKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

console.log('✅ All hardcoded data cleared from localStorage');
console.log('Refresh the page to load fresh data from Supabase');
