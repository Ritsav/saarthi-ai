async function main() {
  // Intentionally empty.
  console.log('No seed data applied.');
}

main().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
