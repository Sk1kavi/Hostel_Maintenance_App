const bcrypt = require("bcryptjs");

(async () => {
  const password = "kavi";   // your chosen admin password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log("Hashed Password:", hash);
  process.exit(0);
})();
